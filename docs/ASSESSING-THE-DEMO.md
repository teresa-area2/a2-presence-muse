# How to assess the demo

Open Presence × Muse explores whether a coding agent can adjust how it communicates as interaction context changes. The goal is a more usable collaboration, while keeping the person in control of the task and normal approvals. The current evidence is exploratory; it does not establish a causal improvement in user experience or productivity.

## What the project does

1. Run two Muse Code sessions on the same prepared task. Choose the same available model for both and send to **Both** when you want to give them the same instruction.
2. With your consent, the textbox sends interaction metadata to Open Presence. Open Presence returns temporary guidance about depth, optional updates and conversation style; the workspace supplies eligible guidance to the **With Presence** session at supported request boundaries.
3. Compare the conversations, work and available resource information. The Pulse shows the collaboration policy, not a numerical personal-state measurement. If guidance is unavailable or withdrawn, the Presence side falls back to ordinary behavior.
4. Review each session's approvals. For prepared tasks, **Check code** runs the supplied and frozen checks in an available sandbox; **Send CI feedback** is a separate action. An unavailable check is not a pass.

Start with the [Judge journey](JUDGE-QUICKSTART.md), which covers account setup, consent, the first task and a private evidence export. The two workspaces are isolated, but their conversations can differ as you interact; differences in answers or counts alone do not prove the guidance caused an outcome.

## Why Muse matters

Muse Code and Meta's Muse models are the coding environment being explored: they conduct the conversations and coding work on both sides of the comparison. Muse Code was also used substantially in implementing and testing the project during the hackathon. Open Presence is an existing external service that supplies the adaptive guidance; it is not a Meta language model.

## Evidence and limits

- **Try it:** The [Judge journey](JUDGE-QUICKSTART.md) uses your own entitled Muse account on macOS. The [platform guide](PLATFORM-SUPPORT.md) explains browser and operating-system limitations.
- **Inspect Presence’s impact:** [Five recorded episodes](../evidence/impact-2026-11-03/README.md) compare compact plans, decision-first questions and optional-update handling with mixed/unverified cases. Review the actual final-answer excerpts and distinguish Muse response changes from browser gating and participant self-report. These historical examples do not qualify every final-release feature.
- **Review recorded results:** The [pilot results](../evidence/RESULTS.md) and [method](../evidence/METHOD.md) describe repeated, unblinded comparisons across different tasks, models and builds. The ratings are from one person; the resource cohort also includes unrated cases with uncertain origin. Input already includes cached input; uncached input increased in the recorded resource aggregate, and actual cost and full overhead are unknown.
- **See what was built:** The [event build record](EVENT-BUILD.md) summarizes daily progress and testing. The [provenance](PROVENANCE.md) and [dependencies](DEPENDENCIES.md) identify the pre-existing components and notices.
- **Understand data use:** The [privacy notice](PRIVACY-DATA-USE.md) explains the separate Open Presence and Muse routes, shared calibration and consent. The optional [Presence impact assessment](OBSERVER-REPORT.md) sends selected exchanges and work excerpts to Muse; they may contain private information or embedded credentials.
- **Check qualification:** The [status](STATUS.md) separates offline checks and observed runs from the full independent judge journey that is still to be verified.

Observed guidance delivery does not prove the model followed it, and historical tests do not establish general quality equivalence, a population effect, cost savings or benefit for every user.
