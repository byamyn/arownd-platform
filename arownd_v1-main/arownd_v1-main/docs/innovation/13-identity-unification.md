# 13 — توحيد الهوية (Identity Unification: Arownd vs SOOQY)

> **الغرض:** توثيق فجوة الاسم (Arownd vs SOOQY) وخطة توحيد آمنة (docs-only; لا تعديل كود).  
> **قاعدة:** لا تغيّر كود التطبيق (حسب قواعد المهمة). التوحيد = قرار + خطة تطبيق لاحق.

## 1. الوضع (As-Is)

| Source | Name used | Location |
|---|---|---|
| BRAND.md | **Arownd** (أحرف صغيرة في الشعار: "arownd") | docs/BRAND.md |
| docs/innovation/* | **Arownd** | كل ملفات الحزمة |
| src/* (code, SEO, manifest) | **SOOQY** | src/routes/*, src/lib/i18n.ts, public/manifest*.json, public/sw.js, public/seo/og.svg, capacitor.config.ts |
| README.md (master prompt) | **SOOQY** | README.md |
| AGENTS.md | **SooQy** (مزيج) | AGENTS.md |
| DEPLOY-VERCEL.md | **SooQy** | DEPLOY-VERCEL.md |
| package.json (name) | **sooqy-app** | package.json |

## 2. التأثير (Impact)

- **SEO / marketing:** اسمان مختلفان → تشتت العلامة، ضعف recall.
- **الترشح (label projet innovant):** Comité يطلب «Nom du projet» واحداً — يجب choosing Arownd **أو** SOOQY (أو rename).
- **القانونية:** ملكية فكرية (marque) — Arownd غير مودعة (TODO: INAPI). SOOQY غير مودعة (TODO).
- **التطبيق (Android):** appId `com.sooqy.app`, appName `SooQy` (capacitor.config.ts).

## 3. خيارات (Decision)

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Keep Arownd | unify code → Arownd | BRAND.md already Arownd; tagline «Discover What's Around You.» | large refactor (src, manifest, SEO, Android appId) |
| B. Keep SOOQY | unify docs → SOOQY | code already SOOQY; less work | contradicts BRAND.md + docs |
| C. Rename to new name | new brand | clean slate | cost + legal + user recognition |

> **توصية (docs-only):** قرار المؤسس. انظر `ask_user` (TODO: إجراء decision meeting).

## 4. خطة توحيد (Implementation plan — manual, out of scope for docs)

### 4.1 إن اختير Arownd (Option A)

- [ ] src: replace `SOOQY` → `Arownd` in all user-facing strings (i18n dictionaries, SEO SeoHead, manifest).
- [ ] public: manifest*.json, sw.js, seo/og.svg, sitemap? (domain stays sooqy.app or new domain).
- [ ] capacitor.config.ts: appId `com.arownd.app`, appName `Arownd`.
- [ ] package.json: name `arownd-app` (optional).
- [ ] AGENTS.md, README.md, DEPLOY-VERCEL.md: update references.
- [ ] Domain: decide sooqy.app vs arownd.app (DNS + Vercel).
- [ ] Legal: deposit marque «Arownd» (INAPI) before public launch.

### 4.2 إن اختير SOOQY (Option B)

- [ ] BRAND.md: update name to SOOQY + colors/fonts (IBM Plex Sans Arabic/Tajawal already in README master prompt).
- [ ] docs/innovation/*: replace `Arownd` → `SOOQY`.
- [ ] Keep code as-is.

### 4.3 Domain/URL impact

- Current canonical: `https://sooqy.app/{lang}{path}` (SeoHead).
- If rename to Arownd: new domain `arownd.app` + 301 redirects + update sitemap/robots/OG.
- If keep SOOQY: no domain change.

## 5. Checklist before submission (label projet innovant)

- [ ] Nom du projet unique (Arownd **أو** SOOQY) — no mixing.
- [ ] Marque deposit (INAPI) or «aucun» (honest).
- [ ] Domain reachable (production URL documented).
- [ ] APK (if Android) with matching name.
- [ ] SEO/OG image with matching name.

## 6. ما لم يُختلق

- No market data invented. All [TODO].
- Code not modified (per task rules).

## 7. Sources

- BRAND.md (internal).
- AGENTS.md (internal).
- README.md (internal).
- capacitor.config.ts (internal).
- Date de vérification: 2026-10-22.
