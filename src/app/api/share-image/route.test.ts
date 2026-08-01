// @vitest-environment node

import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/share-image", () => {
  it("renders a complete 1200x630 PNG", async () => {
    const response = await GET();
    const bytes = new Uint8Array(await response.arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(response.headers.get("content-type")).toContain("image/png");
    expect(Array.from(bytes.slice(0, 8))).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  });
});
