export type CalculatorOperator = "+" | "−" | "×" | "÷";
export interface CalculatorHistoryItem { expression: string; result: string }
export interface CalculatorState {
  version: 1; display: string; accumulator: number | null; operator: CalculatorOperator | null;
  waitingForOperand: boolean; memory: number; history: CalculatorHistoryItem[]; error: string | null;
}
export const INITIAL_CALCULATOR_STATE: CalculatorState = { version: 1, display: "0", accumulator: null, operator: null, waitingForOperand: false, memory: 0, history: [], error: null };
const MAX_LENGTH = 15;

export function parsePastedCalculatorValue(text: string): string | null {
  const matches = text.match(/[-+]?\s*\d[\d.,\s]*/g);
  const match = matches?.at(-1);
  if (!match) return null;

  let token = match.replace(/\s/g, "");
  const sign = token.startsWith("-") ? "-" : "";
  token = token.replace(/^[-+]/, "");
  const lastComma = token.lastIndexOf(",");
  const lastDot = token.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    token = token.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    const decimalDigits = token.length - lastComma - 1;
    token = decimalDigits === 3 ? token.replaceAll(",", "") : token.replaceAll(",", ".");
  } else if ((token.match(/\./g) ?? []).length > 1) {
    const decimalDigits = token.length - lastDot - 1;
    token = decimalDigits === 3
      ? token.replaceAll(".", "")
      : `${token.slice(0, lastDot).replaceAll(".", "")}.${token.slice(lastDot + 1)}`;
  }

  const value = Number(`${sign}${token}`);
  return Number.isFinite(value) ? formatCalculatorValue(value) : null;
}

export function appendPastedCalculatorText(
  state: CalculatorState,
  text: string,
): CalculatorState | null {
  const operatorMatch = text.match(/[+\-−*×/÷]/);
  const operatorMap: Record<string, CalculatorOperator> = {
    "+": "+", "-": "−", "−": "−", "*": "×", "×": "×", "/": "÷", "÷": "÷",
  };
  let next = operatorMatch ? chooseOperator(state, operatorMap[operatorMatch[0]]) : state;
  const pastedValue = parsePastedCalculatorValue(text);
  if (!pastedValue) return operatorMatch ? next : null;

  for (const character of pastedValue) {
    if (/^\d$/.test(character)) next = inputDigit(next, character);
    else if (character === ".") next = inputDecimal(next);
    else if (character === "-" && !operatorMatch) next = {
      ...next,
      display: next.display.startsWith("-") ? next.display : `-${next.display}`,
    };
  }
  return next;
}
export function calculate(left: number, right: number, operator: CalculatorOperator): number | null {
  if (operator === "+") return left + right;
  if (operator === "−") return left - right;
  if (operator === "×") return left * right;
  return right === 0 ? null : left / right;
}
export function formatCalculatorValue(value: number): string {
  return Number.isFinite(value) ? Number(value.toPrecision(12)).toString().slice(0, MAX_LENGTH) : "Error";
}
export function parseCalculatorState(raw: string | null): CalculatorState {
  if (!raw) return INITIAL_CALCULATOR_STATE;
  try {
    const value = JSON.parse(raw) as Partial<CalculatorState>;
    if (value.version !== 1 || typeof value.display !== "string" || typeof value.memory !== "number" || !Array.isArray(value.history)) return INITIAL_CALCULATOR_STATE;
    return { ...INITIAL_CALCULATOR_STATE, ...value, display: value.display.slice(0, MAX_LENGTH), history: value.history.slice(-20) };
  } catch { return INITIAL_CALCULATOR_STATE; }
}
export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error || state.waitingForOperand) return { ...state, display: digit, waitingForOperand: false, error: null };
  if (state.display.replace(/[-.]/g, "").length >= MAX_LENGTH) return state;
  return { ...state, display: state.display === "0" ? digit : state.display + digit };
}
export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error || state.waitingForOperand) return { ...state, display: "0.", waitingForOperand: false, error: null };
  return state.display.includes(".") ? state : { ...state, display: `${state.display}.` };
}
export function chooseOperator(state: CalculatorState, next: CalculatorOperator): CalculatorState {
  const input = Number(state.display);
  if (state.error) return { ...INITIAL_CALCULATOR_STATE, operator: next };
  if (state.accumulator === null) return { ...state, accumulator: input, operator: next, waitingForOperand: true };
  if (state.waitingForOperand) return { ...state, operator: next };
  const result = calculate(state.accumulator, input, state.operator ?? next);
  if (result === null) return { ...state, display: "Error", error: "No se puede dividir entre cero", accumulator: null, operator: null };
  return { ...state, display: formatCalculatorValue(result), accumulator: result, operator: next, waitingForOperand: true };
}
export function evaluate(state: CalculatorState): CalculatorState {
  if (state.accumulator === null || !state.operator || state.error) return state;
  const result = calculate(state.accumulator, Number(state.display), state.operator);
  if (result === null) return { ...state, display: "Error", error: "No se puede dividir entre cero", accumulator: null, operator: null };
  const formatted = formatCalculatorValue(result);
  return { ...state, display: formatted, accumulator: null, operator: null, waitingForOperand: true, history: [...state.history, { expression: `${formatCalculatorValue(state.accumulator)} ${state.operator} ${state.display}`, result: formatted }].slice(-20) };
}
