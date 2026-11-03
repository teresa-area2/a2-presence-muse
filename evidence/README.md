# Recorded comparisons and reproducible results

The latest reviewed freeze is **3 November 2026, 20:23:08 UTC (21:23:08 Madrid)**.
It publishes all **82 saved comparison cases**, including failures, provisional
endpoints, unrated and incomplete cases. Of these, **33 have paired ratings,
51 paired resource measurements and 39 complete paired timings**. These groups
overlap; they are not separate participants. Ratings come from one known person
in an unblinded repeated pilot. Unrated origins and comparable work are uncertain.

- [Results](RESULTS.md) and [method](METHOD.md)
- [All-case index](index.json) and [aggregate values](summary.json)
- [Individual numeric records, policy/request history and check history](audit-2026-11-03/audit.json)
- [Audit schema, redactions and reproduction](audit-2026-11-03/README.md)
- [File hashes and transformations](audit-2026-11-03/manifest.json)

To verify the public files and reproduce all ten aggregate metrics, run from the
repository root with a supported Node version:

```sh
node scripts/evidence-audit.mjs reproduce evidence/audit-2026-11-03
```

No login, installation, model call or Open Presence call is needed for that command.
Numbers are recomputed from the individual published values, checking eligibility
per outcome. Input includes cached input. The higher uncached-input total is
retained alongside the reported effort and interruption differences.

These are **reviewed derivatives**, not untouched raw exports. Numeric ratings,
usage, checks, policy sequences and presentation events are published; original
identifiers, private source paths and individual clock times are removed. The
selected derivatives contain no conversation bodies; missing exchanges are not
reconstructed. Originals remain private, with source/checkpoint hash commitments.
Those commitments do not independently verify withheld original bytes. Policies
and ratings remain potentially identifying even after pseudonymization.

## Earlier publication

The [earlier 14:15 UTC freeze](archive-2026-11-03-141507/README.md) reported
31 rated / 46 resource / 34 timing pairs. Its 67 closed-projection snapshots remain
unchanged under [runs/](runs/). They overlap with the current inventory: **do not add
the freezes, exports, checkpoints or observer reports as extra trials**. Case
aliases are local to each freeze. The new audit also represents the ten legacy
cases whose missing fixture metadata prevented the older snapshot projection;
their unknown metadata stays unknown.

The existing `scripts/export-public-evidence.mjs` still prepares the older,
more restrictive single-package projection. It does not publish files or include
individual ratings. Preparing a new audit is an explicit, reviewed release action;
ordinary local exports remain local and are not automatically uploaded.
