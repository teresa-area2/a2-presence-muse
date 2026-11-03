# Overall Presence impact assessment

**Overall judgment: the pilot shows a favorable pattern of reported developer
experience alongside a different resource profile. Cache reuse alone does not
determine collaboration value.** Net productivity, technical-quality and cost
benefits remain unestablished. Guidance delivery
and optional-update handling are recorded across the cohort; evidence of how
Muse changes the meaning and structure of its responses is much less complete.

This assessment uses **all 82 saved comparison cases** in the frozen
3 November 2026, 20:23:08 UTC inventory. It evaluates each outcome on the available
paired evidence: **33 rated comparisons, 51 resource pairs and 39 complete timing
pairs**. The rated pilot has one known participant and is unblinded. The subsets
overlap; the 18 unrated resource pairs have uncertain origin/work comparability.
The [five episodes](../impact-2026-11-03/README.md) illustrate mechanisms and limits;
they do not determine this overall judgment.

## Adaptive collaboration as the design aim

Presence adds momentary guidance to Muse so depth, optional updates and
conversation style can adjust with the interaction. The aim is a more malleable
coding experience, with task requirements and normal permissions kept in force.
Resource use is evaluated against experience, usefulness and correctness.

Dynamic guidance is a possible contributor to the changed input-reuse profile.
This mixed-task, mixed-build pilot did not isolate the cause of the cache
difference. That explanation is a design rationale, separate from the observed
outcomes below; lower cache reuse is not itself evidence of benefit or harm.

## Assessment across the cohort

| Dimension | Whole-cohort evidence | Assessment |
| --- | --- | --- |
| Developer experience · 33 rated pairs | Effort lower With in **29**, equal in 4, higher in 0. Noticed interruptions lower in **25**, equal in 4, higher in 4. Both measures lower in **24/33**. Mean effort **3.82 → 1.70**; interruptions **4.82 → 2.85**. | **Favorable reported experience in this pilot**, with adverse interruption reports retained. These are repeated self-reports from one person, not a causal/population effect. |
| Guidance and Muse behavior · all 82 accounted for | 770 retained With request rows in 50 cases; 723 labelled guidance observed. Recorded final linkage exists at 35 selected endpoints. Reviewed final-response text covers only 2 cases. | **Delivery evidence is broader than response-behavior evidence.** A cohort-wide adherence rate for Depth, Format or Conversation cannot be estimated. Missing text/linkage is unknown, not no impact. |
| Optional updates · all 82 accounted for | Held events occur in 13 cases, across overlapping browser projections; source views also retain releases and disconnected presentation. | **The presentation mechanism is demonstrated.** Its contribution to noticed interruptions or human attention is not separately measured. Browser holding is distinct from Muse changing its output. |
| Technical quality · 51 resource pairs | Only **2 pairs** have recorded current common passing checks, including 1 rated pair. **14 resource cases**, including 10 rated cases, retain earlier frozen failures. | **Quality impact remains inconclusive.** Earlier failures and later passes are preserved. The evidence does not establish quality equivalence, superiority or equal accepted work. |
| Resources · 51 paired records | Output lower in **34/51**; model calls lower in 29, equal in 3, higher in 19. Total input + output **+0.85%**; uncached input higher in **50/51**, **+509.74%** in aggregate. | **A changed resource profile.** Reused and uncached input describe different parts of the recorded work; their proportions alone do not establish better or worse collaboration. Evaluate the profile against usefulness, correctness and experience. Actual billing and full overhead are unavailable. |
| Timing · 39 complete pairs | With faster in **19**, slower in **20**. Mean summed turn seconds **115.25 → 109.79**; median paired With/Without ratio **1.0073**. | **No consistent speed advantage.** Times include waits and different work; they do not measure human attention or time per accepted task. |
| Overall usefulness | Reported effort/interruptions are available, but independent usefulness, accepted-work value and quality-adjusted cost are not. | **Promising for collaboration experience; net benefit remains unmeasured.** No weighted score is invented from incomparable or missing outcomes. |

## Experience and resource profile in the same rated comparisons

To connect experience and resources without switching cohorts, a secondary
analysis uses exactly the **same 33 rated pairs**. Their total input is **9.89%
lower**, output **21.54% lower**, calls **10.40% lower**, and input + output
**10.25% lower** With Presence. The same **33 also record more uncached input**, with
a **468.82% aggregate increase**. This describes the input mix within the rated
subset as well as in the broader inventory.

These figures complement the main 51-pair resource analysis; they do not replace
it or add comparisons. They show that favorable experience ratings can coexist
with lower recorded total tokens and lower cache reuse. The analysis does not
isolate the cause of that input mix or assign it a usefulness or cost value.
Cached input is already included in total input.

Jointly, **29/33** cases have neither experience measure worse; **4/33** have more
noticed interruptions. Of those four, one also reports lower effort and three
report equal effort. The analysis keeps those mixed outcomes rather than treating
“benefit” as a single score.

Among the 33 rated pairs, **8** combine both lower experience reports with more
input tokens, and **4** combine them with more model calls. Among the **30 rated
pairs with complete timing**, **4** combine both lower reports with longer
elapsed work. Only **1/24** both-favorable cases has recorded current common
passing-check coverage; the other 23 are not thereby failures. These same-case
associations show why token counts alone cannot determine collaboration value.

## What the overall conclusion supports

The supported statement is that **this pilot participant generally reported easier,
less interrupted collaboration With Presence**, while the system records guidance-bearing request
observations and policy-dependent browser presentation. Limited response examples
show both alignment consistent with guidance and unresolved/mixed cases. That is
a useful exploratory result about collaboration with a changed resource profile.
Its value is assessed through the resulting experience and correct work;
quality-adjusted utility remains an open measurement question.

It does not establish that every policy changed every response, that all 82 cases
benefited, that fewer tokens are always better, or that Presence made equal-quality
work cheaper or faster. Twelve rated saved endpoints remain provisional. Tasks,
models, builds and histories differ; input histories and matched-context flags
cannot independently establish equal instructions or work. Observer judgments
are separate from primary exchanges and their usage is separate from coding totals.

## Sources and reproduction

- [Main outcome table](../RESULTS.md) and [method](../METHOD.md)
- [All-case numeric audit](../audit-2026-11-03/audit.json), with original usage and labelled normalization retained
- [Whole-cohort quantitative evidence](quantitative-evidence.json): directions, joint outcomes, rated-only resource subset, timing and coverage
- [All-case impact coverage](../impact-2026-11-03/coverage.json), plus [illustrative episodes](../impact-2026-11-03/README.md)

To recompute and check the quantitative evidence from the published audit:

```sh
node evidence/overall-2026-11-03/reproduce.mjs --verify
```

Run the same command without `--verify` to print the derived values. No login,
model, OP or evaluator call is made. The secondary directions/joint/subset analyses
are descriptive additions over the unchanged frozen cohort. The original audit,
aggregate values, sources and earlier examples remain unchanged. File hashes are
in [the manifest](manifest.json); reproducible arithmetic is not an independent
replication of participant outcomes or provider billing.
