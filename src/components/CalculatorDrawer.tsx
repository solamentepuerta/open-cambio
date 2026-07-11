"use client";

import { Calculator, Delete, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalculatorOperator, CalculatorState, INITIAL_CALCULATOR_STATE, chooseOperator, evaluate, formatCalculatorValue, inputDecimal, inputDigit, parseCalculatorState } from "@/lib/calculator";

const STORAGE_KEY = "vex-calculator-v1";
const operatorKeys: Record<string, CalculatorOperator> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export default function CalculatorDrawer() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CalculatorState>(INITIAL_CALCULATOR_STATE);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const storageLoadedRef = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setState(parseCalculatorState(localStorage.getItem(STORAGE_KEY)));
      storageLoadedRef.current = true;
    });
  }, []);
  useEffect(() => {
    if (storageLoadedRef.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, [tabindex]:not([tabindex='-1'])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      else if (/^\d$/.test(event.key)) setState((current) => inputDigit(current, event.key));
      else if (event.key === "." || event.key === ",") setState(inputDecimal);
      else if (event.key === "Enter" || event.key === "=") setState(evaluate);
      else if (operatorKeys[event.key]) setState((current) => chooseOperator(current, operatorKeys[event.key]));
      else if (event.key === "Backspace") setState((current) => ({ ...current, display: current.display.length > 1 ? current.display.slice(0, -1) : "0" }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKeyDown); };
  }, [close, open]);

  const unary = (percent: boolean) => setState((current) => ({ ...current, display: formatCalculatorValue((Number(current.display) || 0) * (percent ? 0.01 : -1)), error: null }));
  const memory = (kind: "clear" | "recall" | "add" | "subtract") => setState((current) => {
    const value = Number(current.display) || 0;
    if (kind === "clear") return { ...current, memory: 0 };
    if (kind === "recall") return { ...current, display: formatCalculatorValue(current.memory), waitingForOperand: true };
    return { ...current, memory: current.memory + (kind === "add" ? value : -value) };
  });
  const backspace = () => setState((current) => ({ ...current, display: current.display.length > 1 ? current.display.slice(0, -1) : "0" }));
  const digit = (value: string) => setState((current) => inputDigit(current, value));
  const operator = (value: CalculatorOperator) => setState((current) => chooseOperator(current, value));

  const keys: Array<[string, () => void, boolean?]> = [
    ["AC", () => setState((current) => ({ ...INITIAL_CALCULATOR_STATE, memory: current.memory, history: current.history }))], ["+/−", () => unary(false)], ["%", () => unary(true)], ["÷", () => operator("÷"), true],
    ["7", () => digit("7")], ["8", () => digit("8")], ["9", () => digit("9")], ["×", () => operator("×"), true],
    ["4", () => digit("4")], ["5", () => digit("5")], ["6", () => digit("6")], ["−", () => operator("−"), true],
    ["1", () => digit("1")], ["2", () => digit("2")], ["3", () => digit("3")], ["+", () => operator("+"), true],
    ["0", () => digit("0")], [".", () => setState(inputDecimal)], ["⌫", backspace], ["=", () => setState(evaluate), true],
  ];

  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-[8rem] right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform" aria-label="Abrir calculadora"><Calculator className="w-6 h-6" /></button>
    <div className={`fixed inset-0 z-[60] transition ${open ? "visible" : "invisible delay-300"}`} aria-hidden={!open}>
      <button className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={close} aria-label="Cerrar calculadora" tabIndex={open ? 0 : -1} />
      <aside ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="calculator-title" className={`absolute right-0 top-0 h-full w-full max-w-sm bg-surface text-on-surface shadow-2xl p-5 overflow-y-auto transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between mb-5"><h2 id="calculator-title" className="font-display text-xl font-bold">Calculadora</h2><button ref={closeRef} onClick={close} className="w-10 h-10 rounded-full hover:bg-on-surface/10 flex items-center justify-center" aria-label="Cerrar"><X /></button></div>
        <div className="rounded-3xl bg-background p-5 mb-4 text-right min-h-28 flex flex-col justify-end"><span className="text-xs text-foreground/50 h-5">{state.accumulator !== null && state.operator ? `${formatCalculatorValue(state.accumulator)} ${state.operator}` : state.memory !== 0 ? `Memoria: ${formatCalculatorValue(state.memory)}` : ""}</span><output className="text-4xl font-bold break-all">{state.display}</output>{state.error && <span className="text-xs text-red-400 mt-1">{state.error}</span>}</div>
        <div className="grid grid-cols-4 gap-2 mb-3">{["MC", "MR", "M+", "M−"].map((label, index) => <button key={label} onClick={() => memory((["clear", "recall", "add", "subtract"] as const)[index])} className="py-2 rounded-xl bg-on-surface/5 text-sm font-semibold">{label}</button>)}</div>
        <div className="grid grid-cols-4 gap-2">{keys.map(([label, action, accent], index) => <button key={`${label}-${index}`} onClick={action} className={`h-14 rounded-2xl text-lg font-bold active:scale-95 transition ${accent ? "bg-primary text-on-primary" : "bg-on-surface/8 hover:bg-on-surface/15"}`} aria-label={label === "⌫" ? "Borrar último dígito" : label}>{label === "⌫" ? <Delete className="mx-auto" /> : label}</button>)}</div>
        {state.history.length > 0 && <section className="mt-6"><div className="flex justify-between mb-2"><h3 className="text-sm font-bold">Historial</h3><button onClick={() => setState((current) => ({ ...current, history: [] }))} className="text-xs text-primary">Borrar</button></div><ul className="space-y-2">{state.history.slice().reverse().map((item, index) => <li key={`${item.expression}-${index}`} className="rounded-xl bg-background px-3 py-2 text-right"><div className="text-xs text-foreground/50">{item.expression}</div><div className="font-semibold">= {item.result}</div></li>)}</ul></section>}
      </aside>
    </div>
  </>;
}
