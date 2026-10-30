# 11 — تقرير الجاهزية (Readiness Report)

## 1. التقييم (Go/No-Go)
**No-Go (للترشح الآن)** — النواقص الحمراء (P0) غير مغلقة.

## 2. درجات (تقديرية)
| Domain | Score | Comment |
|---|---|---|
| Produit (MVP) | 80% | web+PWA+Android, Supabase, i18n, SEO |
| Backend/DB | 75% | 19 migrations; beta RPC needs application on prod DB |
| Tests | 60% | 142/174 pass; 32 UI timeouts (env) |
| Dossier (label) | 20% | équipe, prototype links, traction, IP manquants |
| Innovation proof | 40% | features présentes, pas de données/moat prouvés |
| Identité | 50% | Arownd vs SOOQY non unifié |
| **Total** | **~45%** | |

## 3. النواقص (P0/P1/P2)
**P0 (blockers):**
- Unifier le nom (Arownd vs SOOQY) — décision + mise à jour code/marketing (hors scope docs; à faire manuellement).
- Équipe nominative + CV.
- Prototype links (site prod, APK, vidéo ≤4 min).
- Description ≤400 chars finalisée + PitchDeck rempli (Canevas).
- Vérifier application migrations prod (create_order etc.) — README beta.

**P1:**
- Données marché (TAM/SAM/SOM sources).
- Traction (users/GMV/merchants) — collecter analytics.
- IP (marque Arownd) — dépôt INAPI ou «aucun».
- Incubation (oui/non + attestation).
- Tests UI (fix timeouts).

**P2:**
- Plan marketing budget, KPI baselines.
- Paiement électronique (CIB/EDAHABIA) au-delà BaridiMob manuel.

## 4. مخاطر
- Risque de refus du Comité si innovation non prouvée.
- Risque technique si DB prod non migrée.
- Risque identité (confusion Arownd/SOOQY).

## 5. خطوات تالية (next actions)
1. Décider nom final + mettre à jour code/marketing (manuel).
2. Compléter équipe + CV.
3. Produire prototype links (deploy + APK + vidéo).
4. Remplir PitchDeck (Canevas) + description ≤400.
5. Appliquer migrations prod + tester flows.
6. Collecter 20 merchants pilot (2 wilayas) + métriques.
7. Déposer marque (INAPI) ou cocher «aucun».
8. Soumettre sur https://startup.dz/label-projet/ (champs latins).
9. Participer aux meetups Ministère.

## 6. ما لم يُختلق
- Aucune donnée de marché/traction inventée; placeholders [TODO].