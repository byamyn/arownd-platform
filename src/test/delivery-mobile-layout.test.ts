import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../routes/delivery-dashboard.tsx", import.meta.url), "utf8");
const registration = readFileSync(new URL("../routes/delivery-register.tsx", import.meta.url), "utf8");

describe("delivery company mobile experience", () => {
  it("reserves the native bottom safe area and keeps dashboard tabs scrollable", () => {
    expect(dashboard).toContain("pb-[calc(7rem+env(safe-area-inset-bottom))]");
    expect(dashboard).toContain("no-scrollbar flex gap-2 overflow-x-auto");
    expect(dashboard).toContain('aria-pressed={activeTab === "pending"}');
    expect(dashboard).toContain('aria-pressed={activeTab === "all"}');
  });

  it("keeps delivery actions at comfortable mobile touch sizes", () => {
    expect(dashboard).toContain("min-h-11 flex-1 rounded-[var(--radius-control)]");
    expect(dashboard).toContain("min-h-11 rounded-2xl border px-3 py-2");
    expect(dashboard).toContain("min-h-[5.5rem] rounded-[var(--radius-card)]");
  });

  it("uses safe-area aware spacing and full-height form controls during registration", () => {
    expect(registration).toContain("pb-[calc(7rem+env(safe-area-inset-bottom))]");
    expect(registration).toContain("h-12 w-full rounded-[var(--radius-control)]");
    expect(registration).toContain("min-h-[var(--control-height)] rounded-full");
  });

  it("uses dictionary keys instead of hardcoded Arabic UI strings", () => {
    const arabicLiteral = /["\x27`][^"\x27`]*[\\u0600-\\u06FF][^"\x27`]*["\x27`]/;
    expect(dashboard).not.toMatch(arabicLiteral);
    expect(registration).not.toMatch(arabicLiteral);
  });

  it("does not contain escaped newline fragments in JSX", () => {
    expect(dashboard).not.toContain("\\n            className=");
  });
});
