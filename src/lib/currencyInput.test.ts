import { describe, expect, it } from "vitest";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  sanitizeCurrencyInput,
} from "./currencyInput";

describe("currency input helpers", () => {
  it("keeps valid intermediate decimal values", () => {
    expect(sanitizeCurrencyInput("")).toBe("");
    expect(sanitizeCurrencyInput(".")).toBe("0.");
    expect(sanitizeCurrencyInput("000.50")).toBe("0.50");
    expect(parseCurrencyInput("0.")).toBe(0);
  });

  it("removes presentation formatting without changing the value", () => {
    expect(sanitizeCurrencyInput("Bs 41,404.55")).toBe("41404.55");
    expect(formatCurrencyInput("41404.55")).toBe("41,404.55");
  });

  it("rejects a second decimal separator", () => {
    expect(sanitizeCurrencyInput("12.3.4")).toBeNull();
  });
});
