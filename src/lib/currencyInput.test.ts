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
    expect(sanitizeCurrencyInput("12,3,4")).toBeNull();
  });

  it("accepts a comma as the decimal separator", () => {
    expect(sanitizeCurrencyInput(",")).toBe("0.");
    expect(sanitizeCurrencyInput("1,5")).toBe("1.5");
    expect(sanitizeCurrencyInput("41.404,55")).toBe("41404.55");
    expect(parseCurrencyInput(sanitizeCurrencyInput("0,75") ?? "")).toBe(0.75);
  });

  it("keeps thousands separators when both separators are present", () => {
    expect(sanitizeCurrencyInput("1.234,56")).toBe("1234.56");
    expect(sanitizeCurrencyInput("1,234.56")).toBe("1234.56");
    expect(sanitizeCurrencyInput("1.234.567")).toBe("1234567");
  });
});
