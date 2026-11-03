# Qualification status

This candidate records checked behavior and remaining limits. It does not claim a
complete independent judge journey or production qualification.

- **Clean candidate checks:** on 3 November, the independent release tree passed
  all 1,790 offline tests with zero failures/skips on Node 22.12.0, including the
  installed PowerShell parser checks. A fresh empty-cache anonymous judge install
  passed. Earlier 1,755-test installation qualifications cover predecessor source;
  source checks are not an independent human judge or live OP admission test.
- **Shared evidence home:** future launches use a private per-user home outside
  source checkouts for checkpoints and exports. Directory ownership/permissions,
  symlink/inode/currentness and atomic-save behavior are checked. Existing live
  sessions retain their original paths until deliberately restarted; evaluator
  intake keeps those historical folders. No live session was restarted for this
  release preparation.
- **Cipher installation:** public `@area2-ai/a2-cipher-react-lite@3.0.0` and
  `@area2-ai/a2-cipher-core-lite@2.1.0` installed from an empty npm cache with
  isolated registry-only user/empty global configs and no token/config inheritance.
  The normal `npm run judge:install` then passed install/build/setup/pin checks.
  Existing import paths are npm aliases; original private packages remain separate.
  The former npm token is revoked; normal judge installation never reads it or the
  OP access file. This is a local installation qualification, not live OP admission.
- **Release access:** first consented startup can retrieve the already-public, fixed
  hash-pinned OP-only demo access into an ignored private local file; no credential
  value, npm token or Muse key is tracked in the clean release. Preserving that access
  does not establish a fresh OP admission check. Normal installation does not read
  the evaluation file. Original development history is retained privately. Fresh-clone default bootstrap
  has offline regression coverage; real OP admission remains a human rehearsal gate.
- **Native Muse:** existing-account 1.4.13 empty sessions, hook installation and
  catchable judge hangup cleanup were exercised without a model turn or OP capture.
  Historical 1.4.14 protocol/control checks do not qualify its full current coding/
  Presence journey. Fresh own-account login, real typing/coding/approval and reopened
  export remain independent human-rehearsal gates. See [platform support](PLATFORM-SUPPORT.md).
- **OP cutoff:** synthetic clocks/fetchers cover new Auth/capture refusal, late
  response exclusion and retained-policy fallback at the configured judge cutoff.
  Coding sessions continue. This relies on the machine clock; the owner's dated
  server expiry report is not a fresh service check. Quotas remain unverified;
  the demo deliberately shares retained calibration across testers. Existing nonjudge configs
  without cutoff preserve their lifecycle. See [access handling](../judge-access/README.md).
- **Comparison scope:** both arms disable foreign personal imports while retaining
  task-local rules/skills and normal tools/approvals. Without Presence is the
  configured baseline, not the user's whole everyday Muse setup. Configuration-
  preserving everyday integration is a recommendation, not an implemented mode.
  Historical evidence retains its original source/configuration identity.
- **Resources/benefit:** cumulative native usage and observed provider responses
  have different scopes. Output can include reasoning and tool arguments. Figures
  do not establish billing totals, causal savings or human benefit; cost and full
  overhead can be unavailable.
- **Optional Observer:** only the explicit action sends selected evidence to Muse.
  Embedded secrets/private information can remain despite filename filtering;
  review the [disclosure](OBSERVER-REPORT.md). Both protocols explicitly request zero
  provider retries and reject reported usage over one call while retaining usage.
  No actual retry was observed; no automatic assessment is implied.
- **Cleanup:** catchable INT/TERM/HUP use owned async cleanup. Uncertain installer
  termination retains configuration for checked recovery; file-cleanup failure has
  a distinct error. Original paths are not verified deletion targets. Force-kill/
  crashes cannot guarantee cleanup. See [recovery](JUDGE-QUICKSTART.md#installer-recovery).
- **Local trust:** loopback/Origin checks do not authenticate OS users/processes;
  local callers can obtain the bootstrap token. Use a trusted personal machine;
  no multi-user-host or remote gateway boundary is claimed. Native Windows is
  refused; WSL/Linux qualification remains as documented. See [local trust](JUDGE-QUICKSTART.md#local-trust-boundary).
- **Exports and rights:** evidence export has deterministic coverage, but does not
  restore native conversations. Reviewed historical redacted evidence is included under `evidence/`: 67 individual snapshots, covering 41/46 paired-resource cases, plus aggregate 31-rated/46-resource/34-timing results. The index retains 77 identities and metadata omissions; raw originals and individual ratings remain private. Historical runs span builds and do not establish final-release quality equivalence.
  [Provenance/notices](PROVENANCE.md) document reuse without a new eligibility or
  independent rights ruling. Owner evidence/release choices remain separate.
