import { describe, expect, it } from "vitest";
import { getShareImageFilename, getSocialShareLinks } from "./share";

describe("social share links", () => {
  it("includes encoded Open Cambio links for every network", () => {
    const links = getSocialShareLinks();

    expect(Object.values(links)).toHaveLength(4);
    for (const link of Object.values(links)) {
      expect(link).toContain("opencambio.puertale.com");
      expect(() => new URL(link)).not.toThrow();
    }
  });

  it("uses the Venezuela update date in the image filename", () => {
    expect(getShareImageFilename("2026-08-02T02:30:00.000Z")).toBe(
      "tasas-open-cambio-2026-08-01.png",
    );
  });
});
