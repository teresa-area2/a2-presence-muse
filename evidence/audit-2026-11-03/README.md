# Public audit: 3 November, 20:23 UTC

This is a **closed, reviewed derivative of the frozen research consolidation**,
not a folder of untouched original exports. It includes all 82 saved cases;
33 have paired ratings, 51 paired resources and 39 complete paired timings.
Individual numeric ratings are published with the owner's authorization.

## Files and reproduction

- `audit.json`: all case rows, retained-source commitments and separate observer overhead.
- `summary.json`: all ten aggregates, denominators and included case aliases.
- `manifest.json`: public-byte hashes, private derivative-input hashes and transformations.

From the repository root:

```sh
node scripts/evidence-audit.mjs reproduce evidence/audit-2026-11-03
```

This verifies public file hashes, rechecks each case's eligibility and recomputes
every summary value without external services or private inputs. It does not
verify withheld originals, provider billing or causal effects.

## Record fields

`case_id` is a freeze-local pseudonym for one full private run-ID/generation key.
Copies and revisions remain grouped. `selected` records the chosen revision,
generation, source/checkpoint commitments and endpoint uncertainty. `metadata`
contains reviewed task/model/version fields and unknowns; a reported task commit
or harness fingerprint does not prove deployed server/browser bytes.

Each arm retains numeric ratings, noticed interruptions, approvals, requested and
observed model metadata, elapsed values, public-output counts and delivery labels.
`usage` is the analysis projection; `source_usage` retains original saved values
and `usage_normalization` identifies the 13 native/trace exact-agreement
projections. Input includes cached input. Actual billing remains unknown.

The audit preserves readings, policy events and request rows, using sequence/turn
ordinals and categorical controls. Request observation is distinct from compliance
or benefit. `check_history` contains all 92 retained check records and 124 metadata
variants, preserving earlier failures, currentness, consumption, test counts,
artifact/plan commitments and revision/source links.

`presentation_projections` keeps 102 browser-ledger snapshots containing 1,912
events, including held/released/shown reasons and omitted-event counters. Individual
clock times are replaced by milliseconds since that arm projection's first event.
Different browser projections can overlap: **do not sum them as unique user
interruptions or independent presentations**. They are separate from ratings.

`observer_overhead` retains 15 reports and numeric usage separately from coding
totals, with completion/stale/input-relation labels. OP service request counts and
latency are retained per case where available; these do not establish full
service/collector cost or lifetime overhead.

## Removed, absent and unknown

Original run/request/check/reading/ledger/report IDs, source locators, personal
identifiers and individual epoch timestamps are omitted. Arbitrary extra fields,
credential material, typing arrays, Capsules and hidden reasoning cannot pass the
closed projection. Source/checkpoint commitments refer to retained private history;
they are not freshly reverified original-byte receipts. New public-byte hashes
are clearly separate.

**Conversation bodies and quoted exchanges are absent from these derivative
inputs**, so they are not reconstructed or claimed as published. Observer narrative,
observer coverage detail, per-response attribution arrays and arbitrary diagnostic
text are not included; numeric delivery summaries and request/control rows remain.
Original files stay private. Publication is pseudonymized, not anonymous:
policy histories and ratings can still identify context.

No new user trial, simulation, Muse, OP or evaluator call was made to prepare this
audit. App-reported modes and uncertain batch origins remain qualified in the
[method](../METHOD.md). Synthetic diagnostics outside the selected inventory are
not pooled with these recorded cases.
