# Event build record

This record summarizes pre-existing foundations, then the progress and testing recorded for each day of the hackathon. It is a retrospective based on retained development records; the record does not independently establish the creation date of every line.

## Pre-existing and reused foundations

- **Open Presence inference and Cipher:** Existing services and SDK used by the integration; they were not created during the hackathon.
- **Earlier Area2 comparison demo:** A visual reference for the later experience.
- **Agent Lab/Pulse:** Selected reused code, including extraction and session foundations recorded on 24–25 October and later refinements on 28 October. The included snapshot therefore contains work from different dates.
- **Capsule validator:** A reused selected snapshot based on an upstream checkout with uncommitted local changes. Its base commit alone does not establish the date or derivation of the exact retained artifact.

On 31 October, distribution of the selected Area2-owned Lab/Pulse and validator files was authorized under Apache 2.0, preserving applicable third-party notices. The [provenance record](PROVENANCE.md) and [dependency notices](DEPENDENCIES.md) describe the selected components.

## Day-by-day progress and testing

### 26 October

**Progress:** Defined the collaboration-policy contract and began the coding-comparison experience after the kickoff.

**Testing:** The corrected policy passed 23 offline checks. A real parallel coding pair was cancelled before final handback, so it did not establish a complete workflow or comparable outcome.

### 27 October

**Progress:** Added setup checks, reproducible isolated workspaces for the two sides, and improvements to completion and cleanup.

**Testing:** One checkpoint passed 129 offline checks and 29 safety canaries, including macOS sandbox checks. Real comparisons exposed gaps in request attribution and latency; they did not establish a benefit from Presence.

### 28 October

**Progress:** Introduced supported Muse sessions in a side-by-side workspace, with recipient selection, repeated turns, approvals and request observation. Added task contracts and reference cases.

**Testing:** A real two-turn comparison observed guidance on the Presence side and isolation on the baseline side. A response had a substantive quality gap, so the run did not establish equivalent quality. Sixteen reference checks passed.

### 29 October

**Progress:** Continued the textbox-to-Open Presence integration, policy history, fallback, checkpoints and exports begun across 28–29 October. Prepared a clean source extraction and migration.

**Testing:** During 28–29 October, real Presence readings and policy changes were observed. Timing evidence did not establish that every answer used the newest reading. The migration checkpoint passed 517 offline checks and 30 focused checks.

### 30 October

**Progress:** Improved request attribution, capture timing and cadence, the comparison interface, and the Presence tracker and on-demand assessment.

**Testing:** Separate checkpoints passed 589 and 688 offline checks. A live assessment attempt failed safely; successful live assessment was not established at that checkpoint.

### 31 October

**Progress:** Added matched model selection and a coding-task battery, prepared selected reusable components in the repository, and continued work on steering and session continuity.

**Testing:** A task-catalog checkpoint passed 732 offline checks; starter tasks failed and reference solutions passed their checks as expected. Both sessions reached Ready during a startup check with no coding turn, which did not by itself qualify live coding.

### 1 November

**Progress:** Integrated Check code and feedback, expanded prepared and free-task flows, and continued the evidence and presentation work.

**Testing:** A checkpoint passed 1,002 offline checks and macOS sandbox reference checks. A separate real coding pair across 31 October–1 November finished with five public and 15 frozen checks passing on each side after feedback; the later histories differed. Another rehearsal remained partial because approvals were pending at its deadline.

### 2 November

**Progress:** Prepared judge setup and platform safeguards, developed the Linux code-check path, refined approvals and accounting, and documented the optional one-click assessment and its warning.

**Testing:** A Debian build/start and synthetic native-protocol check passed. Linux sandbox namespaces were denied in that environment, and hosted WSL2 was unavailable. A hosted Windows CLI synthetic check passed; the native Windows harness remained unsupported. These results did not establish a complete Linux, WSL or Windows judge journey.

### 3 November

**Progress:** Prepared the clean public judge repository, anonymous dependency installation, automatic project-local Node setup, simplified judge instructions and a session-continuity fix.

**Testing:** The continuity release passed 1,854 offline checks on Node 22.12 and 136 focused checks on Node 24.1. A real two-turn test kept both sessions ready, but did not reproduce the notification suspected in a tester's closure. A Mini export assessment reported 20 of 20 final checks passing on each side after feedback; the original export was not independently parsed here and the conversation histories differed. The complete independent tester journey and that tester's retry remained open at this checkpoint.

## Evidence boundaries

Offline checks, real model runs and human-reported experience are distinct evidence. Historical comparisons include partial or failed attempts and do not establish a causal benefit or cost saving. The published ratings are from one person in an unblinded pilot; the resource cohort also includes unrated records with uncertain origins. The records span tasks, models and versions, and uncached input increased in the recorded resource comparison.

## Related documentation

- [Source and dependency provenance](PROVENANCE.md)
- [Dependencies and distribution](DEPENDENCIES.md)
- [Qualification status](STATUS.md)
- [Historical evidence and method](../evidence/README.md)
