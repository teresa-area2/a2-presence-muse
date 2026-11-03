# Recorded evidence method and limits

## Selection and denominators

The current saved-file cutoff is **2026-11-03T20:23:08.088810Z**. The authoritative
frozen consolidation contains 82 full run-ID/session-generation keys, 200 retained
source hashes and 133 checkpoint versions. The latest stable uncontested revision
per full key is selected. Copies and revisions do not create cases. Historical
check variants remain available; a later pass never erases an earlier failure.

Every case is in the [public audit](audit-2026-11-03/audit.json): 33 with paired
ratings, 18 additional paired-resource cases, three one-arm resource cases and
28 with no paired observed work. Absence is not verified zero activity. The
publication retains incomplete, adverse and unmatched cases. Previously suggested
linkage between private review aliases R079 and R082 was withdrawn: their full
keys differ and they are not merged or assumed related.

Paired resources require both arms to have positive valid observed usage. For
13 cases, a labelled analysis projection uses explicitly recorded native/trace
exact agreement; both source usage and normalized analysis usage are retained.
This is not provider billing verification. Paired ratings also require both valid
1–5 effort ratings and nonnegative interruption counts. Complete paired timing
requires both arms' elapsed status to be completed and no incomplete turns. The
reproduction command recomputes these flags and rejects contradictory inclusion.

## Arithmetic

Means are used for effort ratings, noticed interruptions and summed completed-turn
seconds. Tokens, observed model calls and approval decisions use paired sums.
Percentage change is 100 × (With − Without) / Without on the same eligible subset;
a zero baseline is undefined. **Input already includes cached input**:
uncached = input − cache; input + output does not add cache again. A scale-point
rating change is not a calibrated workload reduction. Turn times include waits
and do not establish accepted-work speed or equal realized work.

## Resource interpretation

Cached and uncached input are reported as resource-accounting dimensions.
Lower cache reuse is not classified as a benefit or a penalty by itself. The
assessment relates resource use to reported experience, useful work and
correctness. Dynamic guidance is a possible explanation for a changed reuse
profile; this dataset does not isolate its cause or show that the difference
was necessary for adaptation. Design rationale remains separate from observation.

## Quality and interpretation

The known rated participant is one unblinded repeated pilot, not 33 independent
people. Eighteen resource cases are unrated and have uncertain origin/comparability.
Tasks, models, histories and builds differ; the recorded matched-context flag is
not independent proof of equivalent work. Twelve rated saved endpoints remain
provisional, including 11 operationally closed without confirmed participant
review closure. Only one rated and one unrated resource pair have current passed
common frozen checks. Ten rated and four unrated resource cases retain earlier
frozen-test failures. Stale failures are not verdicts on a later artifact.

Guidance-labelled requests, linked finals and browser hold/release records support
engineering observations, not model compliance, causal benefit or human effort
reduction. App-reported `live` mode does not independently establish origin;
unknown fixture metadata and batch-import origins stay visible. Controlled
synthetic diagnostics and selected visual examples are separate from this cohort
and are not added to its denominators.

Observer history is separate: 15 retained reports (14 completed, one failed),
15 calls, 396,482 input / 89,767 output tokens, no recorded cached input, and
467.346 seconds summed report latency. These are retained observations, not
lifetime overhead. Development, review and observer calls are not added to coding
totals. Actual billing and full Presence/collector overhead are unavailable.

## Publication and verification

The closed [offline projector](../scripts/evidence-audit.mjs) accepts only reviewed
fields, types and enums. It replaces identities with freeze-local case aliases,
removes source locators and individual timestamps, and preserves within-projection
event intervals. Each record is explicitly a derivative; no original checksum is
presented as validating changed public bytes. [The manifest](audit-2026-11-03/manifest.json)
hashes the public files and identifies private derivative inputs by hash.
Retained source/checkpoint hashes are commitments to private history, not fresh
independent verification of those originals.

The [audit schema](audit-2026-11-03/README.md) lists retained fields and omissions.
Reproduction checks extraction, inclusion and arithmetic from public data. It is
not independent scientific replication, a fresh provider run or qualification of
every final-release feature. Earlier cutoffs are overlapping historical views,
kept separately; never pool their rows with this freeze.

## Response-level impact supplement

The [impact supplement](impact-2026-11-03/README.md) adds five illustrative episodes
from two existing comparisons, supported by 11 previously reviewed/redacted Muse
final-answer excerpts and earlier saved turn-linkage metadata. It is not a new
trial, source rescan, complete native transcript or semantic-adherence estimate.
The underlying numeric audit and its hashes are unchanged. The all-case coverage
matrix makes absent/unlinked response evidence explicit, while examples keep
model behavior, browser gating, self-report and coordinator actions separate.

## Overall assessment and secondary analysis

The [overall assessment](overall-2026-11-03/README.md) uses all 82 inventoried cases
and outcome-specific 33/51/39 paired subsets. Its secondary joint experience,
per-pair direction and same-rated-cohort resource summaries are reproducible from
the unchanged public audit. They do not redefine eligibility or pool independent
participants. No causal estimate, semantic-adherence rate or numeric net-benefit
score is inferred from missing/heterogeneous evidence. Five episodes remain
illustrative only.
