# Open Presence × Muse

A side-by-side coding workspace for exploring how Open Presence guidance can shape collaboration with Muse Code. Two separate Muse sessions work on the same task; eligible Presence guidance goes only to the **With Presence** session. You can converse with both, review approvals, check their work and compare reported resources.

## Try the demo

**[Follow the Judge journey](docs/JUDGE-QUICKSTART.md)** to set up, run a coding task and return your results. You need a Mac, Git, a supported Muse Code installation and your own entitled Muse account. Use Chrome or Firefox. The Mac setup prepares a verified Node runtime inside the checkout; it does not change your system Node or shell settings.

Read [Privacy & Data Use](docs/PRIVACY-DATA-USE.md) before enabling Presence. With your consent, the demo sends textbox interaction metadata to Open Presence, including while you type. Your coding messages and task context go separately to Muse. The optional **See Presence impact** action sends selected exchanges and code excerpts to Muse, which may contain private information.

The first consented startup retrieves temporary OP demo access automatically. The judge uses their own Muse account; no npm token is needed. The access is reported to expire on 15 November 2026, with a more conservative client cutoff. The demo uses shared calibration, so one tester's activity can influence later guidance. Details and current limits are in [judge access](judge-access/README.md) and the [privacy notice](docs/PRIVACY-DATA-USE.md).

Use a trusted personal machine. The local interface does not authenticate other processes or users on that machine. [Platform support](docs/PLATFORM-SUPPORT.md) describes tested routes and limits: the preferred path is macOS; the complete Linux and Windows/WSL judge journeys remain unqualified, and native Windows harness launch is unsupported.

## Work and compare

Choose a [prepared coding task](coding-tasks/README.md), open both sessions and start with a plan. Each agent works in a separate workspace. Review approvals in each pane, ask follow-up questions, then use **Check code** for prepared tasks. An unavailable check is not a pass. Your own task has no predefined frozen checks.

Both agents use isolated configurations with personal imports from other agent configurations disabled; task-local instructions, tools and normal approvals remain available. **Without Presence** is the configured baseline, not a copy of your complete everyday Muse setup. When guidance is unavailable, the Presence session uses ordinary fallback. Essential answers, errors and approvals remain visible.

The resource view reports available usage, which can include reasoning and tool arguments. Differences in counts do not establish cost savings, causation or human benefit. Review the [Observer disclosure](docs/OBSERVER-REPORT.md) before using its optional assessment.

## Evidence and project origins

The repository includes [redacted historical evidence](evidence/README.md) and an [aggregate summary](evidence/RESULTS.md). The ratings come from a one-person, unblinded pilot across different tasks, models and versions; historical results do not qualify every feature of this release. Inspect any locally exported evidence before sharing it; exports are saved locally and are not uploaded automatically.

The event work includes the Muse-specific experience and the current Presence, coding and evidence integration. An earlier Area2 demo informed its visual design. Agent Lab/Pulse and the Capsule validator are reused code; Cipher, Muse and Open Presence inference are external. See the [event build record](docs/EVENT-BUILD.md), [provenance](docs/PROVENANCE.md), and [dependencies and notices](docs/DEPENDENCIES.md).

For troubleshooting and advanced setup, see the [judge reference](docs/JUDGE-REFERENCE.md), [qualification status](docs/STATUS.md) and [setup guide](docs/SETUP.md).
