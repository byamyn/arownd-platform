import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/sooqy/app-shell";
import { t } from "@/lib/i18n";

describe("mobile application shell and role navigation labels", () => {
  it("uses a dynamic viewport and clips horizontal overflow", () => {
    render(<AppShell><div>محتوى الصفحة</div></AppShell>);
    const shell = screen.getByText("محتوى الصفحة").parentElement;
    expect(shell).toHaveClass("min-h-dvh");
    expect(shell).toHaveClass("overflow-x-clip");
  });

  it("provides matching delivery navigation labels in Arabic and English", () => {
    expect(t("delivery_dashboard", "ar")).toBe("لوحة التوصيل");
    expect(t("delivery_dashboard", "en")).toBe("Delivery");
    expect(t("delivery_nav_home", "ar")).toBe("الرئيسية");
    expect(t("delivery_nav_home", "en")).toBe("Home");
  });
});
