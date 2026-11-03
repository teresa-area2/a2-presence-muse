# Preliminary Presence × Muse results

Frozen **3 November 2026, 20:23:08 UTC**. All 82 saved cases are published as
[reviewed numeric audit records](audit-2026-11-03/README.md). Ratings come from
one person in an unblinded repeated pilot; the resource cohort also includes
18 unrated cases with uncertain origins and comparable work. Records span tasks,
models and builds. These are descriptive results, not a causal estimate.

## Overall Presence impact assessment

**Across the frozen pilot, Presence is associated with favorable reported
collaboration experience, alongside mixed resource use and a substantial
cache-reuse trade-off. Net productivity, correctness or cost benefit is not
established.** This conclusion uses all eligible evidence, not the five
illustrative episodes.

- **Experience:** 29/33 rated cases report lower effort; 25/33 fewer interruptions;
  **24/33 report both lower**. Four report more interruptions. The pilot has one
  known rated participant; twelve rated endpoints remain provisional.
- **Behavior:** guidance-labelled requests and browser holding are recorded across
  the inventory, but response-text coverage is limited. A cohort-wide model
  adherence rate for Depth, Format or Conversation cannot be estimated.
- **Quality:** only two resource pairs have saved current common passing checks;
  earlier failures and missing/stale checks prevent a general equivalence claim.
- **Resources and timing:** output is lower in 34/51 resource pairs, while uncached
  input is higher in 50/51. With is faster in 19/39 complete timing pairs and
  slower in 20. More consumption may be appropriate when it supports useful work;
  independent usefulness, accepted-work value and actual billing are unavailable.

Read the [overall assessment](overall-2026-11-03/README.md) for the whole-cohort
judgment, joint experience outcomes and same-rated-cohort resource analysis.
The [five traceable episodes](impact-2026-11-03/README.md) are supporting
illustrations of compact planning, questioning and update handling, including
mixed, ambiguous and disconnected-view cases.

## Experience, quality and resource outcomes

| Outcome | Without Presence | With Presence | Paired comparisons |
| --- | ---: | ---: | ---: |
| Mean effort rating (1 easier–5 harder) | 3.82 | 1.70 | 33 |
| Mean noticed interruptions | 4.82 | 2.85 | 33 |
| Approval decisions | 243 | 227 | 51 |
| Input tokens, including cached input | 18,491,798 | 18,742,436 | 51 |
| Output tokens | 620,534 | 531,988 | 51 |
| Cached input tokens | 16,772,341 | 8,258,201 | 51 |
| Uncached input tokens | 1,719,457 | 10,484,235 | 51 |
| Input plus output tokens | 19,112,332 | 19,274,424 | 51 |
| Observed model calls | 834 | 795 | 51 |
| Mean summed turn seconds, including waits | 115.25 | 109.79 | 39 |

The effort rating was lower in 29 of 33 cases and equal in four: a mean change
of **−2.12 scale points**, not a calibrated cognitive-workload reduction.
Noticed interruptions were lower in 25 cases, equal in four and higher in four.

Across the 51 paired resource records, input increased **1.36%**, output decreased
**14.27%**, and input plus output increased **0.85%**. Uncached input increased
**509.74%** (about 6.1 times baseline). Reduced cache reuse is not a saving;
input already includes cached input. Actual billing and full overhead are unknown.
Completed timing is faster with Presence in 19 of 39 pairs and slower in 20;
the lower mean does not establish faster accepted work.

Twelve rated endpoints remain provisional. One rated and one unrated resource
pair have current passed common frozen checks; ten rated and four unrated resource
cases retain earlier frozen-test failures. The audit retains 92 check records and
124 metadata variants, including failures followed by later passes. General
technical-quality equivalence remains unverified.

The inventory also retains three one-arm resource cases and 28 without paired
observed work. Missing ratings are not zeros. Guidance observation is distinct
from model compliance and benefit. Browser projections and separate observer
reports do not add independent cases, people or coding calls.

All ten metrics can be reproduced with:

```sh
node scripts/evidence-audit.mjs reproduce evidence/audit-2026-11-03
```

See [method and limits](METHOD.md), [exact values](summary.json) and the
[earlier 31/46/34 freeze](archive-2026-11-03-141507/RESULTS.md). These cutoffs overlap;
do not add their denominators. These historical results do not qualify every
feature of the final release or replace an independent judge journey.
