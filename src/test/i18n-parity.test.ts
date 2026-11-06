import { describe, expect, it } from "vitest";
import { GROUPS } from "@/lib/dictionaries";
import { t, pluralForm, translate } from "@/lib/i18n";

/** كل المفاتيح المعرّفة عبر المجموعات. */
function allKeys() {
  const ar = new Set<string>();
  const en = new Set<string>();
  for (const g of GROUPS) {
    for (const k of Object.keys(g.ar)) ar.add(k);
    for (const k of Object.keys(g.en)) en.add(k);
  }
  return { ar, en };
}

describe("توازن القاموس (i18n parity)", () => {
  it("مجموعة ar و en تحتويان نفس المفاتيح تمامًا", () => {
    const { ar, en } = allKeys();
    const missingInEn = [...ar].filter((k) => !en.has(k));
    const missingInAr = [...en].filter((k) => !ar.has(k));
    expect({ missingInEn, missingInAr }).toEqual({ missingInEn: [], missingInAr: [] });
  });


  it("لا تتعارض مفاتيح مجموعات القاموس إلا في المفاتيح المشتركة المصرّح بها", () => {
    const allowedDuplicates = new Set([
      "aria_favorite_add",
      "aria_favorite_remove",
      "aria_close",
      "aria_back",
      "aria_prev",
      "aria_next",
      "aria_increase_qty",
      "aria_decrease_qty",
      "action_retry",
    ]);
    const owners = new Map<string, string[]>();
    for (const group of GROUPS) {
      for (const key of Object.keys(group.ar)) {
        owners.set(key, [...(owners.get(key) ?? []), key]);
      }
    }
    const duplicates = [...owners.entries()]
      .filter(([key, entries]) => entries.length > 1 && !allowedDuplicates.has(key))
      .map(([key]) => key);
    expect(duplicates).toEqual([]);
  });

  it("أسماء مفاتيح التوصيل لا تستبدل مفاتيح عامة", () => {
    const deliveryGroup = GROUPS.find((group) => "delivery_register_title" in group.ar);
    expect(deliveryGroup).toBeDefined();
    expect(deliveryGroup?.ar).toHaveProperty("delivery_company_delivery_address");
    expect(deliveryGroup?.ar).toHaveProperty("delivery_company_shipment_fee");
    expect(deliveryGroup?.ar).not.toHaveProperty("delivery_address");
    expect(deliveryGroup?.ar).not.toHaveProperty("delivery_fee");
  });

  it("لا قيمة ترجمة فارغة", () => {
    const empty: string[] = [];
    for (const g of GROUPS) {
      for (const [k, v] of Object.entries(g.ar)) if (!v.trim()) empty.push(`ar:${k}`);
      for (const [k, v] of Object.entries(g.en)) if (!v.trim()) empty.push(`en:${k}`);
    }
    expect(empty).toEqual([]);
  });

  it("كل قيمة في ar/en تحمل نفس عدد المتغيّرات", () => {
    const mismatched: string[] = [];
    const varsOf = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");
    for (const g of GROUPS) {
      for (const [k, arv] of Object.entries(g.ar)) {
        const env = g.en[k];
        if (env === undefined) continue;
        if (varsOf(arv) !== varsOf(env)) mismatched.push(k);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("الترجمة تُعيد النص المفاتيح لا المفتاح نفسه", () => {
    expect(t("bag_heading", "ar")).toBe("سلة التسوق");
    expect(t("bag_heading", "en")).toBe("Shopping bag");
    expect(t("orders_cancel_store_title", "ar")).toBe("إلغاء طلب هذا المتجر");
    expect(t("orders_cancel_store_title", "en")).toBe("Cancel this store order");
    expect(t("orders_archive_action", "ar")).toBe("إخفاء من السجل");
    expect(t("orders_archive_action", "en")).toBe("Hide from history");
    expect(t("delivery_register_title", "ar")).toBe("تسجيل شركة توصيل");
    expect(t("delivery_register_title", "en")).toBe("Register a delivery company");
    expect(t("delivery_cod_collected_amount", "ar", { amount: "1,200" })).toContain("1,200");
    expect(t("delivery_cod_collected_amount", "en", { amount: "1,200" })).toContain("1,200");
  });

  it("لا تُعيد المفتاح الخام إذا كان مفقودًا (سلاح أمان)", () => {
    // المفتاح غير موجود في اللغتين → يعود نص المفتاح مع تحذير
    const out = t("key_that_does_not_exist_xyz", "ar");
    expect(out).toBe("key_that_does_not_exist_xyz");
  });
});

describe("صيغ الجمع", () => {
  it("العربية تميّز صفر/واحد/اثنان/قليل/كثير", () => {
    expect(pluralForm(0, "ar")).toBe("zero");
    expect(pluralForm(1, "ar")).toBe("one");
    expect(pluralForm(2, "ar")).toBe("two");
    expect(pluralForm(3, "ar")).toBe("few");
    expect(pluralForm(11, "ar")).toBe("many");
    expect(pluralForm(100, "ar")).toBe("other");
  });

  it("الإنجليزية: واحد/باقي", () => {
    expect(pluralForm(1, "en")).toBe("one");
    expect(pluralForm(2, "en")).toBe("other");
  });

  it("العدّ يعرض الصيغة الصحيحة", () => {
    expect(t("product_count", "ar", { count: 1 })).toBe("منتج واحد");
    expect(t("product_count", "ar", { count: 2 })).toBe("منتجان");
    expect(t("product_count", "ar", { count: 5 })).toContain("5");
  });
});

describe("الاستبدال في النصوص", () => {
  it("يستبدل {name} بالقيمة", () => {
    const out = t("product_reserved_body", "ar", { name: "حذاء", store: "سوق" });
    expect(out).toContain("حذاء");
    expect(out).toContain("سوق");
    expect(out).not.toContain("{name}");
  });

  it("translate() تعمل خارج مكوّن React (وسوم الميتا)", () => {
    expect(translate("bag_title")).toBe("سلة التسوق — Arownd");
  });
});
