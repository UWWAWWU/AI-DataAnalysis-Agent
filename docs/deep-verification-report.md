# AI Data Analysis Agent — deep verification

Generated 2026-10-08T22:41:19.103762+00:00. Local: **92/92 fixture cases passed**, **470 independent filter checks**. Public live AI: **20/20 recorded cases passed** out of 20 planned.

Local correctness and live AI completion are reported separately. Every live pass requires successful investigation evidence, an actual remotely executed dashboard, validated completion references, source-row preservation and a nonempty grounded brief.

## Data coverage

The local corpus contains 60 synthetic domain/edge cases, 20 public Seaborn example datasets, and 12 scientific/stress fixtures. The synthetic domains cover retail, weather, water quality, inventory, finance, support, logistics, energy, education and marketing. Edge cases include empty input rejection, one row, all missing values, constant columns, zero denominators, 100,000 rows, high-cardinality categories, leading zeros, Unicode/untrusted text and extreme signed values.

Scientific fixtures include sklearn Iris, Wine, Breast Cancer, Diabetes, Digits and Linnerud, plus nonlinear relationships, non-finite numbers, localized strings, scientific-looking category codes, mixed signs and timezone dates. CSV and XLSX are exercised. Iris is the same underlying dataset in two suites.

| Public sample | Rows | Local | Live AI |
|---|---:|---|---|
| anagrams | 20 | pass | pass |
| anscombe | 44 | pass | pass |
| attention | 60 | pass | pass |
| car_crashes | 51 | pass | pass |
| diamonds | 53,940 | pass | pass |
| dots | 848 | pass | pass |
| dowjones | 649 | pass | pass |
| exercise | 90 | pass | pass |
| flights | 144 | pass | pass |
| fmri | 1,064 | pass | pass |
| geyser | 272 | pass | pass |
| healthexp | 274 | pass | pass |
| iris | 150 | pass | pass |
| mpg | 398 | pass | pass |
| penguins | 344 | pass | pass |
| planets | 1,035 | pass | pass |
| seaice | 13,175 | pass | pass |
| taxis | 6,433 | pass | pass |
| tips | 244 | pass | pass |
| titanic | 891 | pass | pass |

Public sources: https://github.com/mwaskom/seaborn-data. These are sample datasets, not guaranteed original scientific archives; exact URLs and SHA-256 hashes are retained in the JSON evidence.

## Verified fixes

| Defect | Change | Verification |
|---|---|---|
| Excel boolean filters | Python emitted True/False while the browser selected true/false. Normalize category booleans in dashboard and custom Python. | Local pandas plus actual production E2B CSV/XLSX filter tests. |
| Scientific-looking category codes | A literal code such as 1e2 changed into 100 in Python while staying text in the browser. Align category conversion with browser preparation. | Category selection must retain at least one matching row; scientific-notation XLSX fixture passed. |
| Language of follow-up chat | An Indonesian request in English UI received English confirmation; translated history could overwrite the actual answer. Detect prompt language and render chat responses directly. | Actual browser update answered in Indonesian; bidirectional UI/prompt language regression checks. |
| Numeric chart axes | A count metric over sex produced an empty age histogram. Infer numeric histogram axis from groupBy, constrain model schema and validate metadata plus actual numeric values in Python. | Actual Titanic: 714 ages; text sex axis rejected by production Python; genuinely all-missing numeric axes allowed. |
| Optional dashboard fields | Empty tableMetrics on an ordinary chart caused rejection. Blank title/objective also blocked valid executable dashboards. Strip empty optional tables and derive blank metadata from the existing action purpose. | Invalid nonempty table references remain rejected; resumed health spending, tips and taxis agents completed. |
| Isolation between charts | Histogram exclusions leaked into a subsequent bar sharing the same metric, changing Southampton from 644 to 554. Start each chart from a fresh copy of the metric frame. | Order-invariance regression; actual E2B and browser both retain 891 passengers, 714 ages and Southampton 644. |
| Completion evidence references | A valid computed dashboard was followed by invalid model report citations. Constrain citations to successful report IDs and explicitly identify the latest dashboard and eligible tool IDs. | API schema regression; penguins agent completed from its saved checkpoint; no automatic insertion of citations. |
| PDF export description | The export dialog promised insights although the PDF captures the dashboard canvas. Describe it as a one-page snapshot with current filters. | Actual downloaded tips PDF is one page at 16:9; rendering visually inspected. Descriptive change preserves export implementation. |
| Actionable chart validation | Split generic chart failures into safe field-specific reasons and constrain grouping columns/category limits. Bound histogram bins to 2–50; ignore bin placeholders on unrelated chart types. | Actual API schema regression and numeric/extended chart checks; invalid histogram bin counts still rejected. |
| Portable verification scripts | Worker test harnesses omitted the category-label module; a BOM regression wrote into an old absolute workspace path. | Corrected test imports and isolated temporary path; cleaning stage/discard/commit, original export and BOM checks pass. |

## Browser and exports

- **tips:** 244 rows; completed dashboard and brief; one chart appended without removing earlier charts or KPIs.
- **refresh:** Same-tab tips and Titanic data persisted across refresh. A new tab started at upload.
- **thinking:** Visible Thinking status while sending a real dashboard update.
- **chatLanguage:** Indonesian request in English UI received Indonesian response and confirmation.
- **zoom:** Actual browser: 200% selected successfully, then restored to Fit.
- **chartMenus:** Actual browser: opening second menu closed first; clicking Analysis brief closed second.
- **titanicRepair:** Actual chat rebuild: 891 passengers, survival 38.383838%, 714 ages, survivor bars sum342, embarkation bars sum891, Southampton644.
- **pdf:** Actual tips and latest Titanic browser downloads: each one page, 907.087 x 510.236 points (16:9); both rendered and visually inspected. The production dialog describes a one-page dashboard snapshot with current filters.
- **html:** Actual Titanic browser HTML download: inline assets, restrictive CSP, 3 charts; recomputed exported aggregates match 891/714/644. Offline browser interactions not exercised.

## Regression verification

Regression scripts cover EDA statistics, dashboard aggregation, custom Python contracts, identifiers/category labels, numeric axes, extended charts, multi-metric tables, immutable sources, staged cleaning, chart additions, response language, provider errors/failover, agent evidence gates, duplicate calls, cancellation, budget pauses, pending-action recovery, session isolation, menus, layout composition, presentation changes and one-page PDF generation. TypeScript type checking passed after application changes.

The calculation isolation test runs two chart orders and requires equal unaffected results. The numeric guard also distinguishes an invalid text axis from a legitimate all-missing numeric variable. The optional field tests retain rejection of nonempty invalid table metrics. Completion validation still rejects invented, failed or stale report references.

The test harness fixes are distinguished from product defects; the initial missing module and obsolete temporary path were verification-script errors. The Online Retail-specific check remains not-run rather than reported as a product failure.

## Live failures and recovery

Earlier public failures included blank metadata, empty optional table metrics and invalid completion citations. Five cases were completed from retained evidence after corrections; 15 additional public cases were started fresh. Diamonds and mpg required later retries from their saved investigation evidence after chart-schema corrections. The fMRI agent recovered from a Python NameError and executed a corrected custom analysis. Failed attempt snapshots remain separate from the latest result.

No recorded latest live case is currently failing. This is a bounded test result, not a guarantee of all future model outputs.

## Limits

- 92 local fixture cases are not 92 live AI runs or unique real-world sources; Iris occurs in two suites.
- Five original public live cases were resumed from retained checkpoints. The 15 expanded public cases start fresh. Later retries resume their actual saved tool evidence; successful cases are skipped.
- Local 50 domain variants share a base numeric pattern with different schemas and deliberate perturbations.
- Localized-string stress fixture uses the known numeric Other measure, without guessing ambiguous decimal conventions.
- Model executions use Gemini 3.5 Flash Lite; success does not prove every provider/model works.
- The original Online Retail.xlsx fixture needed by check-analysis.mjs was unavailable; this specific test is not-run.
- Two browser sessions and two downloaded PDFs were inspected; not every dataset/layout/export was visually checked.
- HTML export payload and self-contained assets were checked, but offline browser filtering was not exercised.
- Existing specification and execution resource limits remain. No claim of unbounded charts or absolute perfection.

## Reproduction

```bash
npm run prebuild && npm run typecheck
node scripts/check-diverse-agent-corpus.mjs --generate --local
node scripts/check-public-dataset-corpus.mjs
node scripts/check-scientific-dataset-corpus.mjs
node scripts/check-numeric-chart-columns.mjs .tmp/public-dataset-corpus/public-titanic.csv
node scripts/check-live-titanic-histogram.mjs .tmp/public-dataset-corpus/public-titanic.csv
CORPUS_ONLY_MODEL=gemini-3.5-flash-lite CORPUS_CONCURRENCY=2 node scripts/check-public-dataset-corpus.mjs --public-all-live
```

Live tests call the configured production AI provider and real E2B execution. They may consume provider credits and can pause/fail when the provider is unavailable. Never include credentials in the evidence.
