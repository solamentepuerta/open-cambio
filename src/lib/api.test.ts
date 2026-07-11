import { describe, expect, it } from "vitest";
import { getVenezuelaDateKey, isVenezuelaWeekend, parseBcvEffectiveDate } from "./api";

describe("Venezuela calendar helpers", () => {
  it("uses Caracas when UTC is already on the next day", () => {
    expect(getVenezuelaDateKey("2026-07-11T01:00:00.000Z")).toBe("2026-07-10");
  });

  it("detects weekends in Caracas", () => {
    expect(isVenezuelaWeekend(new Date("2026-07-11T16:00:00.000Z"))).toBe(true);
    expect(isVenezuelaWeekend(new Date("2026-07-13T16:00:00.000Z"))).toBe(false);
  });

  it("normalizes the Spanish BCV effective date", () => {
    expect(parseBcvEffectiveDate("Lunes, 13 Julio 2026")).toBe("2026-07-13T16:00:00.000Z");
  });
});
