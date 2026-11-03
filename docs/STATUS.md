# Qualification status

This demo is under active rehearsal. The checks below do not establish a complete independent judge journey or production readiness. For setup and supported routes, see the [Judge journey](JUDGE-QUICKSTART.md) and [platform matrix](PLATFORM-SUPPORT.md).

## What has been checked

- **Mac setup:** On Apple Silicon, a clean installation with no system Node on the path passed the checkout-local Node bootstrap, requirements, anonymous dependency install, build, and startup and shutdown without Presence consent. The Node archive is verified against a pinned checksum. Intel archive selection has fixture coverage but has not had the same real-machine qualification.
- **Automated tests:** The session-continuity release passed 1,854 offline tests on Node 22.12.0 and 136 focused checks on Node 24.1.0. An earlier setup release passed 1,818 offline tests on both Node versions. These checks do not replace a real user journey.
- **Muse continuity:** A real Muse 1.4.14 / Spark 1.3 check completed two prompts in each of the same two sessions. Both remained ready and recalled the first prompt. It used synthetic inputs and fallback guidance, without OP capture. The subscription notifications suspected in a tester's closure did not occur, so that tester's exact cause and fix remain unconfirmed.
- **Privacy and access:** Installation and startup without typing consent do not retrieve OP access. The first consented startup retrieves a pinned, already-public OP demo access file into an ignored local file. Real OP admission, current service configuration and quota still need a fresh judge rehearsal. The owner reports shared calibration across this demo; see [privacy and data use](PRIVACY-DATA-USE.md).
- **Historical evidence:** The [evidence](../evidence/README.md) contains 67 redacted snapshots and an aggregate from a one-person, unblinded pilot. Runs span tasks, models and builds and do not establish final-release quality or a causal benefit. Raw originals and individual ratings remain private.

## Still to verify

- An independent judge using their own entitled Muse account, including real typing, OP guidance, coding, approvals, Check code and a saved export.
- The affected tester's retry of two prompts in the same session pair, to assess the reported closure on that account.
- A complete Linux or Windows/WSL judge journey. Native Windows harness launch is unsupported; an unavailable Linux sandbox is not a pass.
- OP retention, the end-to-end removal and recalibration procedure, and the complete recipient and transfer inventory. The separately drafted Open Presence policy is not yet approved or published.

## Interpreting the demo

Both agents use the same isolation of personal imports. Without Presence is the configured baseline, not the user's complete everyday Muse environment. Displayed resource counts do not establish billing totals, causal savings or human benefit. The optional Observer makes a separate request to Muse and can include private text or code; see its [disclosure](OBSERVER-REPORT.md).

Exports do not restore native conversations. Keep the app on a trusted personal machine: loopback and browser Origin checks do not authenticate other local users or processes. See [local trust](JUDGE-REFERENCE.md#local-trust-boundary) and [recovery](JUDGE-REFERENCE.md#installer-recovery).

[Provenance and notices](PROVENANCE.md) describe reused code and licensing; they do not constitute an organizer's eligibility ruling.
