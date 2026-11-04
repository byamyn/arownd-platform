# Arownd Documentation | وثائق Arownd

> **Project:** Arownd · **Owner:** byamyn · **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)

A curated, bilingual documentation hub for the Arownd platform. Each engineering guide is organized for quick navigation, operational clarity, and safe implementation.

مركز وثائق ثنائي اللغة لمنصة Arownd، مصمم للوصول السريع والمراجعة الهندسية والتنفيذ الآمن.

---

## Engineering | الهندسة

| Document | الوثيقة | Purpose |
|---|---|---|
| [Architecture](./ARCHITECTURE.md) | المعمارية | Runtime boundaries, application layers, and architectural invariants |
| [Database](./DATABASE.md) | قاعدة البيانات | Supabase migrations, RLS, RPC, transactions, and data safety |
| [Security](./SECURITY.md) | الأمان | Credential handling, authorization, and security review baseline |
| [Development](./DEVELOPMENT.md) | التطوير | Node.js baseline, local setup, quality gates, and contribution rules |
| [Release](./RELEASE.md) | الإطلاق | MVP release gates, operational readiness, and rollback planning |
| [UI System](./UI_SYSTEM.md) | نظام الواجهة | Brand identity, RTL, accessibility, and interface standards |

## Operations & Platforms | التشغيل والمنصات

| Document | الوثيقة | Purpose |
|---|---|---|
| [Account deletion audit](./account-deletion-audit.md) | تدقيق حذف الحساب | Historical technical dependencies and implementation safeguards |
| [Android release signing](./android-release-signing.md) | توقيع Android | Keystore handling and Android release checklist |
| [Moderation operations](./moderation-operations.md) | تشغيل البلاغات | Content-report review process and operational controls |
| [Native runtime assessment](./mobile/CAPACITOR_NATIVE_RUNTIME_ASSESSMENT.md) | تقييم Capacitor | Native runtime, authentication, and device-testing risks |
| [Native app identity](./mobile/NATIVE_APP_IDENTITY.md) | هوية تطبيق الهاتف | Bundle IDs, callback scheme, and Supabase redirect setup |
| [VersaTiles prototype](./maps/versatiles-prototype.md) | نموذج الخرائط | Experimental MapLibre/VersaTiles design notes |
| [Brand assets](../public/brand/README.md) | أصول العلامة | SVG assets, accessibility, and reduced-motion guidance |

## Controlled documents | وثائق خاضعة للمراجعة

- [Account deletion and retention policy](./account-deletion-and-retention-policy.md) — English legal/operational baseline. Any translation or policy change must be reviewed by qualified Algerian legal counsel before publication as a binding policy.
- The generated Capacitor Swift Package Manager README is intentionally left untouched.

## Documentation standards | معايير التوثيق

- Arabic and English content must remain semantically aligned; technical identifiers and commands stay unchanged.
- Distinguish verified repository facts from assumptions, historical observations, and pending checks.
- Never document secrets, private keys, access tokens, or production credentials.
- Update the relevant guide in the same change that alters its implementation.
- Do not rewrite legal terms, third-party licenses, or generated files without explicit review.
- Use concise headings, stable relative links, checklists for operational procedures, and explicit verification boundaries.

## Ownership | الملكية

- **Project:** Arownd
- **Repository maintainer:** byamyn
- **Repository:** https://github.com/byamyn/arownd-platform

Repository ownership metadata identifies the GitHub maintainer; it does not independently establish legal ownership of third-party assets or contributions.
