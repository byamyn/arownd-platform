/**
 * audit-contrast.mjs — تدقيق تباين ألوان الواجهة وفق WCAG 2.1
 *
 * الهدف: منع تكرار خطأ استخدام لون الهوية (الليمون) كلون نص على أسطح فاتحة،
 * وهو خطأ غير مرئي لأدوات البناء والاختبارات.
 *
 * الاستخدام: node scripts/audit-contrast.mjs
 * الخروج: رمز 1 عند وجود زوج低于 الحد الأدنى.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/styles.css"), "utf8");

/* ---------- استخراج التوكنات من CSS ---------- */
function block(selector) {
  // مطابقة محدّدة: يجب أن يسبق القوس مسافة/سطر جديد حتى لا نلتقط
  // تعابير مثل `.dark *` داخل @custom-variant.
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{");
  const m = re.exec(css);
  if (!m) return "";
  const start = css.indexOf("{", m.index);
  let depth = 0;
  for (let j = start; j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") {
      depth--;
      if (depth === 0) return css.slice(start + 1, j);
    }
  }
  return "";
}

function tokens(scope) {
  const out = {};
  for (const m of block(scope).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const light = tokens(":root");
const dark = tokens(".dark");

/* ---------- حساب WCAG ---------- */
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length === 8) h = h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- أزواج يجب أن تكون مقروءة ---------- */
// [التسمية, لون النص, لون الخلفية, الحد الأدنى]
const PAIRS = [
  ["نص أساسي", "--foreground", "--background", 4.5],
  ["نص ثانوي", "--muted-foreground", "--background", 4.5],
  ["نص ثانوي على بطاقة", "--muted-foreground", "--card", 4.5],
  ["نص أساسي على بطاقة", "--foreground", "--card", 4.5],
  ["حبر الهجة", "--accent-ink", "--background", 4.5],
  ["حبر الهجة على بطاقة", "--accent-ink", "--card", 4.5],
  ["حبر الهجة على غسيل الهجة", "--accent-ink", "--primary-soft", 4.5],
  ["نص على تعبئة ليمونية", "--primary-foreground", "--primary", 4.5],
  ["حد على خلفية", "--border", "--background", 1.2],
  ["نص success", "--success", "--success-soft", 4.5],
  ["نص warning", "--warning", "--warning-soft", 4.5],
  ["نص danger", "--danger", "--danger-soft", 4.5],
  ["نص info", "--info", "--info-soft", 4.5],
  ["حلقة التركيز", "--ring", "--background", 3],
];

const THEME = { light, dark };
let failures = 0;

for (const theme of ["light", "dark"]) {
  const t = THEME[theme];
  console.log(`\n\x1b[1m── ${theme === "light" ? "فاتح" : "داكن"} ──\x1b[0m`);
  for (const [label, fgKey, bgKey, min] of PAIRS) {
    const fg = t[fgKey.replace(/^--/, "")];
    const bg = t[bgKey.replace(/^--/, "")];
    if (!fg || !bg) {
      console.log(`  \x1b[33m?\x1b[0m ${label.padEnd(24)} متغيّر مفقود (${fgKey} / ${bgKey})`);
      failures++;
      continue;
    }
    const ratio = contrast(fg, bg);
    const ok = ratio >= min;
    if (!ok) failures++;
    const mark = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(
      `  ${mark} ${label.padEnd(24)} ${ratio.toFixed(2).padStart(6)}:1  (حد ${min})  ${fg} على ${bg}`,
    );
  }
}

console.log("");
if (failures) {
  console.log(`\x1b[31m✗ ${failures} زوج غير مطابق للمعايير\x1b[0m`);
  process.exit(1);
}
console.log("\x1b[32m✓ كل الأزواج مطابقة لمعايير التباين\x1b[0m");
