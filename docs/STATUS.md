# Qualification status

This demo is under active rehearsal. The checks below do not establish a complete independent judge journey or production readiness. For setup and supported routes, see the [Judge journey](JUDGE-QUICKSTART.md) and [platform matrix](PLATFORM-SUPPORT.md).

## What has been checked

- **Effort-scale clarification (4 November):** Both arms label every 1–5 value, repeat “Higher number = more effort,” and show semantic selected values. The same single-hue intensity scale, text labels, selection marks and focus styling are used on both sides. Numeric values, nulls, restored selections, action payloads and exports remain unchanged. The combined release passed 1,873 offline checks with no failures or skips; independent review also checked the compatibility upgrade for an already-running server. Fixed legacy markup is upgraded in the browser without restarting native sessions. This presentation change does not reinterpret historical ratings.
- **Update visibility correction (4 November):** The native JSONL → public events → pair snapshot → pane regression now verifies that held commentary is revealed when its own arm finishes, requests a native question/approval, is interrupted or enters recovery, including the continuation gap with no active turn. Previously shown text stays visible; new progress can still defer during active work. Truncated/cut-off native text is not held. All 1,869 offline checks passed on Node 22.12.0, with no skipped checks, and a separate review passed 66 focused checks. These are deterministic synthetic transport checks, not a new real-model run. Arbitrary commentary has no semantic required/optional marker; the native questions, approvals and final-answer paths are the protected channels.
- **Mac setup:** On Apple Silicon, a clean installation with no system Node on the path passed the checkout-local Node bootstrap, requirements, anonymous dependency install, build, and startup and shutdown without Presence consent. The Node archive is verified against a pinned checksum. Intel archive selection has fixture coverage but has not had the same real-machine qualification.
- **Browsers and platforms:** Chrome and Firefox are the judge rehearsal path, with working Mini capture reported by Teresa. Safari is not supported for this judge rehearsal after a reported Mini Screen Sharing capture failure; its exact version and cause are unverified. Native Windows harness launch is unsupported; Linux/WSL and Intel Mac full-journey limits remain in the [platform matrix](PLATFORM-SUPPORT.md). After opening the printed URL, click **Open sessions** and wait for both panes to show **Ready** before sending.
- **Automated tests:** The session-continuity release passed 1,854 offline tests on Node 22.12.0 and 136 focused checks on Node 24.1.0. An earlier setup release passed 1,818 offline tests on both Node versions. These checks do not replace a real user journey.
- **Muse continuity:** A real Muse 1.4.14 / Spark 1.3 check completed two prompts in each of the same two sessions. Both remained ready and recalled the first prompt. It used synthetic inputs and fallback guidance, without OP capture. The subscription notifications suspected in a tester's closure did not occur, so that tester's exact cause and fix remain unconfirmed.
- **Privacy and access:** Installation and startup without typing consent do not retrieve OP access. The first consented startup retrieves a pinned, already-public OP demo access file into an ignored local file. Real OP admission, current service configuration and quota still need a fresh judge rehearsal. The owner reports shared calibration across this demo; see [privacy and data use](PRIVACY-DATA-USE.md).
- **Historical evidence:** The [evidence](../evidence/README.md) contains all 82 saved cases as reviewed numeric derivatives, with 33 rated pairs, 51 paired resource records and 39 complete paired timings. Public records reproduce all ten aggregates; the earlier 67 snapshots remain separately archived. Ratings are from one person in an unblinded pilot; the resource cohort also includes unrated records with uncertain origins. Runs span tasks, models and builds and do not establish final-release quality or a causal benefit. Originals remain private; authorized individual numeric ratings, checks and usage are published after removal of incidental identifiers.

## Still to verify

- An independent judge using their own entitled Muse account, including real typing, OP guidance, coding, approvals, Check code and a saved export.
- The affected tester's retry of two prompts in the same session pair, to assess the reported closure on that account.
- A complete Linux or Windows/WSL judge journey. Native Windows harness launch is unsupported; an unavailable Linux sandbox is not a pass.
- OP retention, the end-to-end removal and recalibration procedure, and the complete recipient and transfer inventory. The separately drafted Open Presence policy is not yet approved or published.

## Interpreting the demo

Both agents use the same isolation of personal imports. Without Presence is the configured baseline, not the user's complete everyday Muse environment. Displayed resource counts do not establish billing totals, causal savings or human benefit. The optional Observer makes a separate request to Muse and can include private text or code; see its [disclosure](OBSERVER-REPORT.md).

Exports do not restore native conversations. Keep the app on a trusted personal machine: loopback and browser Origin checks do not authenticate other local users or processes. See [local trust](JUDGE-REFERENCE.md#local-trust-boundary) and [recovery](JUDGE-REFERENCE.md#installer-recovery).

[Provenance and notices](PROVENANCE.md) describe reused code and licensing.
