# Arownd — Owner & Project Stewardship | المالك وإدارة المشروع

> **Project:** Arownd  
> **Owner / Repository Maintainer:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Documentation:** [docs/README.md](./docs/README.md)

---

## 1. Ownership identity | هوية المالك

| Field | Details |
|---|---|
| Project | Arownd |
| Owner / GitHub maintainer | byamyn |
| Canonical repository | byamyn/arownd-platform |
| Primary branch | `main` |
| Product scope | Local commerce platform for Algeria |
| Current stage | MVP preparation and controlled pilot readiness |

The identifier **byamyn** is the project owner's GitHub identity and repository-maintainer attribution. It is not, by itself, a statement of the owner's full legal identity or proof of legal title to every contribution, dependency, dataset, or third-party asset.

المعرّف **byamyn** هو هوية المالك على GitHub ونسبة إدارة المستودع إليه. ولا يُعدّ وحده بيانًا للاسم القانوني الكامل أو إثباتًا لملكية كل مساهمة أو مكتبة أو بيانات أو أصل تابع لطرف ثالث.

## 2. Project vision | رؤية المشروع

**Arownd** aims to make local commerce easier to discover and use across Algeria by bringing shoppers, merchants, and delivery companies into one coherent digital experience.

تهدف **Arownd** إلى تسهيل اكتشاف التجارة المحلية واستخدامها في الجزائر، عبر جمع المتسوقين والتجار وشركات التوصيل ضمن تجربة رقمية موحّدة.

### Product principles | مبادئ المنتج

- Local-first discovery and commerce.
- Trustworthy product, offer, and store information.
- Clear workflows for shoppers, merchants, and delivery partners.
- Arabic-first, RTL-first user experience.
- Mobile usability, accessibility, and performance.
- Security and privacy built into system boundaries.

## 3. Owner responsibilities | مسؤوليات المالك

The project owner is responsible for stewardship of the repository and project direction, including:

- Maintaining the canonical repository and primary branch.
- Reviewing and approving changes to core product behavior.
- Setting engineering, quality, security, and release expectations.
- Coordinating issue triage and contribution review.
- Ensuring that operational and legal risks are reviewed before launch.
- Keeping project documentation aligned with verified implementation.

يتولى مالك المشروع الإشراف على المستودع واتجاه المنتج، بما يشمل اعتماد التغييرات الجوهرية، ومراجعة الجودة والأمان، وتنظيم المساهمات، ومتابعة جاهزية الإطلاق، والحفاظ على تطابق التوثيق مع التنفيذ الفعلي.

## 4. Repository governance | حوكمة المستودع

- Canonical repository: `byamyn/arownd-platform`.
- Primary integration branch: `main`.
- Changes should be focused, reviewable, and traceable through commits or pull requests.
- Do not force-push, rewrite shared history, or bypass branch protections without an explicit, reviewed operational decision.
- Database changes must use new files under `supabase/migrations/`; previously applied migrations are immutable.
- Never commit credentials, private keys, tokens, or production secrets.
- Preserve compatibility-sensitive legacy identifiers unless their dependencies have been fully reviewed.

المستودع الرسمي هو `byamyn/arownd-platform` والفرع الأساسي هو `main`. يجب أن تكون التغييرات واضحة وقابلة للمراجعة والتتبع. لا تُتجاوز حماية الفرع أو يُعاد كتابة التاريخ المشترك دون قرار صريح ومدروس.

## 5. Contributions and attribution | المساهمات ونسب العمل

Contributions must follow the repository's engineering standards and applicable license terms.

- Keep changes scoped and explain their purpose.
- Add or update tests when changing application logic.
- Document security, data, and migration implications.
- Preserve third-party copyright and license notices.
- Attribute contributors accurately; do not claim another person's work as the owner's original work.
- Review external contributions before merging them into `main`.

تخضع المساهمات لمعايير المشروع وشروط التراخيص المعمول بها. يجب الحفاظ على نسب الأعمال لأصحابها، وعدم نسبة مساهمات الآخرين إلى المالك، ومراجعة التغييرات قبل دمجها.

## 6. Intellectual property | الملكية الفكرية

This file records project stewardship and repository attribution. It does **not** replace `LICENSE`, `PROPRIETARY_LICENSE.md.`, contributor agreements, trademark registrations, or legal ownership records.

- Existing license files remain authoritative for the rights and restrictions they expressly define.
- Third-party libraries, fonts, icons, maps, datasets, and services remain subject to their respective licenses and terms.
- Do not remove or modify copyright notices without documented authorization.
- The Arownd name and brand assets should be used consistently, subject to any applicable third-party rights and formal registrations.
- Any legal ownership statement, transfer, or licensing change must be verified against the relevant legal documents before publication.

يسجل هذا الملف الإشراف على المشروع ونسبة إدارة المستودع، ولا يحل محل ملفات الترخيص أو اتفاقيات المساهمين أو تسجيل العلامة التجارية أو مستندات الملكية القانونية.

## 7. Security and release accountability | مسؤولية الأمان والإطلاق

The project owner should ensure that release decisions consider:

- Supabase RLS and server-side authorization for every role.
- Server-only handling of privileged credentials.
- Atomic and idempotent handling of orders, reservations, and wallet operations.
- Backup and recovery readiness before production database changes.
- Privacy, account deletion, and data-retention review under applicable Algerian law.
- Evidence of testing and a clear record of known limitations.

لا ينبغي اعتماد إطلاق إنتاجي قبل مراجعة الصلاحيات وحماية الأسرار وسلامة العمليات الحساسة والنسخ الاحتياطي والخصوصية، مع توثيق الاختبارات والقيود المعروفة.

## 8. Official project references | المراجع الرسمية

- Repository: https://github.com/byamyn/arownd-platform
- Documentation hub: [docs/README.md](./docs/README.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Security: [docs/SECURITY.md](./docs/SECURITY.md)
- Development: [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- Release: [docs/RELEASE.md](./docs/RELEASE.md)

---

**Arownd — Built with purpose.**  
**Project stewardship: byamyn**
