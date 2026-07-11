import { describe, expect, it } from "vitest";
import { INITIAL_CALCULATOR_STATE, appendPastedCalculatorText, calculate, chooseOperator, evaluate, inputDecimal, inputDigit, parseCalculatorState, parsePastedCalculatorValue } from "./calculator";

describe("calculator engine", () => {
  it("evaluates chained arithmetic", () => {
    let state = inputDigit(INITIAL_CALCULATOR_STATE, "2");
    state = chooseOperator(state, "+");
    state = inputDigit(state, "3");
    state = chooseOperator(state, "×");
    expect(state.display).toBe("5");
    state = inputDigit(state, "4");
    expect(evaluate(state).display).toBe("20");
  });

  it("reports division by zero without throwing", () => {
    expect(calculate(4, 0, "÷")).toBeNull();
    const result = evaluate({ ...INITIAL_CALCULATOR_STATE, display: "0", accumulator: 4, operator: "÷" });
    expect(result.error).toMatch(/cero/);
  });

  it("accepts a single decimal separator", () => {
    const once = inputDecimal(INITIAL_CALCULATOR_STATE);
    expect(inputDecimal(once).display).toBe("0.");
  });

  it("rejects corrupt persisted state", () => {
    expect(parseCalculatorState("not-json")).toEqual(INITIAL_CALCULATOR_STATE);
    expect(parseCalculatorState('{"version":0}')).toEqual(INITIAL_CALCULATOR_STATE);
  });

  it("limits persisted history to twenty entries", () => {
    const history = Array.from({ length: 25 }, (_, index) => ({ expression: `${index}+1`, result: `${index + 1}` }));
    expect(parseCalculatorState(JSON.stringify({ ...INITIAL_CALCULATOR_STATE, history })).history).toHaveLength(20);
  });

  it("extracts pasted results with currency and locale separators", () => {
    expect(parsePastedCalculatorValue("Bs 1.234,56")).toBe("1234.56");
    expect(parsePastedCalculatorValue("$ 1,234.56")).toBe("1234.56");
    expect(parsePastedCalculatorValue("2 + 3 = 5")).toBe("5");
    expect(parsePastedCalculatorValue("sin número")).toBeNull();
  });

  it("appends pasted values and preserves the current operation", () => {
    const current = { ...INITIAL_CALCULATOR_STATE, display: "25" };
    expect(appendPastedCalculatorText(current, "$ 10")?.display).toBe("2510");
    const operand = appendPastedCalculatorText(current, "+ Bs 10");
    expect(operand).toMatchObject({ display: "10", accumulator: 25, operator: "+" });
  });
});
