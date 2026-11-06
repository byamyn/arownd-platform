import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/sooqy/app-shell";
import { t } from "@/lib/i18n";
import { readFileSync } from "node:fs";

const rootLayout = readFileSync(new URL("../routes/__root.tsx", import.meta.url), "utf8");

describe("mobile application shell and role navigation labels", () => {
  it("uses a dynamic viewport and clips horizontal overflow", () => {
    render(<AppShell><div>محتوى الصفحة</div></AppShell>);
    const shell = screen.getByText("محتوى الصفحة").parentElement;
    expect(shell).toHaveClass("min-h-dvh");
    expect(shell).toHaveClass("overflow-x-clip");
  });

  it("reserves top and bottom safe areas at the application root", () => {
    expect(rootLayout).toContain("pt-[env(safe-area-inset-top)]");
    expect(rootLayout).toContain("pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))]");
  });

  it("provides matching delivery navigation labels in Arabic and English", () => {
    expect(t("delivery_dashboard", "ar")).toBe("لوحة التوصيل");
    expect(t("delivery_dashboard", "en")).toBe("Delivery");
    expect(t("delivery_nav_home", "ar")).toBe("الرئيسية");
    expect(t("delivery_nav_home", "en")).toBe("Home");
  });
});
