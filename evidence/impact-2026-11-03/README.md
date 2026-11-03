# Supporting examples of Presence’s impact

The question is **what Presence changes in Muse's collaboration, and whether that
helps the developer while maintaining useful, correct work**. Tokens and time are
trade-offs to assess alongside that goal; saving them is not prescribed.

The strongest evidence here is favorable reported experience and a demonstrated
browser mechanism for holding optional updates. Response examples show differences
consistent with some guidance, alongside mixed and unlinked cases. They do not
establish a causal benefit or reliable model adherence across the cohort.

The [overall Presence impact assessment](../overall-2026-11-03/README.md) draws
its conclusion from all eligible pairs. The episodes below support that assessment;
they do not replace the whole-cohort analysis.

## Five concrete episodes

These are **five episodes from two historical comparisons**, selected for available
response evidence and policy contrast. They are not five independent trials or a
representative sample. Both comparisons retain missing instruction/linkage details.
The [example records](examples.json) give exact case, turn, request, policy and
source references; [11 reviewed final-answer excerpts](response-excerpts.json)
let you inspect the recorded output. Participant prompts and complete exchanges
are unavailable in this reviewed source set.

| Episode | Available policy and observed difference | What it supports |
| --- | --- | --- |
| E1 · Depth / Format | Save conflicts, case-076, turn 1: the With request records **terse · send · self-contained**. Its final gives a compact four-step plan. Without develops five steps, separate validation and risks/questions. Both wait for permission. | A difference consistent with terse guidance. Prompt omissions and unmatched histories limit attribution. |
| E2 · Mixed depth | Same case, turn 4: despite **terse · send · conversational**, With gives a detailed repair explanation with regressions, complexity and limits. Both arms acknowledge the boundary between self-run and frozen checks. | A counterexample to treating terse as a fixed length cap. Necessary technical detail can justify a longer response; usefulness was not separately rated. |
| E3 · Conversation | Accessible-website task, case-014, turn 1: under **full · send · conversational**, With asks three decisions before developing the plan. Without develops a provisional component plan and also asks questions. | Decision-first versus plan-first interaction. It does not establish that asking questions is unique to Presence or which approach was better. |
| E4 · Unresolved format | Later in case-014, With uses a paragraph-based handback and Without uses component/validation lists. The final-turn request attribution is ambiguous. | A visible formatting difference whose relationship to policy is unverified. It is not counted as demonstrated compliance. |
| E5 · Updates and counterexample | Connected browser projection 1 holds optional message ordinals 4, 5, 8 and 9 under **defer**, keeps final message 10 visible, then records releases. Projections 2 and 3 show those messages as disconnected/visible. | Demonstrated browser presentation behavior with actual update opportunities, including its disconnected-view limit. This is separate from Muse changing its text or reducing noticed interruptions. |

Format is derived from the existing depth, update and conversation controls; it
is not a fourth OP signal. These historical examples do not qualify every
presentation feature of the final release.

## What the responses actually said

In E1, With ends its compact plan:

> Waiting for your go-ahead before making any changes.

The baseline also preserves that boundary, with separate `Goal`, `Approach / Steps`,
`Validation Plan` and risk/question sections. Presence did not supply permission.

In E3, With begins:

> Para planificar bien la web con todos sus componentes necesito cerrar 3 decisiones clave antes de proponerte la estructura:

That is: three decisions before the component plan. The baseline instead supplies
a provisional plan with assumptions and questions. The missing participant prompt
prevents judging which was more appropriate.

In E2, the longer With repair response begins:

> Fixed — the three draft-mutation failures are addressed, and my own test run passes; no new frozen result is claimed.

Model statements about tests and task completion remain **model reports**, not
independent verification. The [response catalog](response-excerpts.json) retains
the available redacted final text, with hashes and source pointers. The
[examples](examples.json) distinguish the earlier saved linkage metadata from
provider execution, causality and semantic correctness.

## How this relates to developer experience and resources

For case-076, reported effort is **4 → 2** and noticed interruptions **4 → 3**.
At the same time, complete elapsed seconds increase **112.80 → 118.86**, and
uncached input increases **35,888 → 220,770**. Saved common frozen passes are stale.
This is a mixed account: lower reported burden alongside greater processing and
longer elapsed work. It does not establish the additional processing's value or
current technical quality.

For case-014, reported effort is **4 → 1** and interruptions **4 → 2**. The case is
flagged matched, but identical instructions are not independently verified; latest
common checks are missing and the With review has no completed segment. The
ratings cannot be attributed specifically to the four held messages.

Across the frozen cohort, effort is lower in **29/33** rated pairs and interruptions
lower in **25/33**, equal in four and higher in four. Output is lower across
**51** paired resource records, while total input and uncached input are higher.
See [all results](../RESULTS.md) for the exact denominators and trade-offs. More
processing can support useful depth or verification; lower counts alone do not
establish better collaboration. Independent usefulness and accepted-work value
were not rated.

## Coverage and limits

The [all-case coverage matrix](coverage.json) accounts for all **82** cases and
separates policy, request delivery, response evidence, browser presentation,
self-report, quality and resources. Missing or unlinked evidence remains unknown.
The [coverage summary](coverage-summary.json) records 770 retained With request
rows, including 723 guidance-labelled rows. Those are not interchangeable with
795 eligible With model calls, nor are they an adherence rate.

Only two comparisons have the reviewed final excerpts used here. There is no
cohort-wide semantic-adherence estimate, general correctness-equivalence result,
causal/population benefit or verified billing saving. Earlier failures, provisional
endpoints and separate observer usage remain in the [method](../METHOD.md).

The numeric freeze remains **3 November 2026, 20:23:08 UTC / 21:23:08 Madrid**:
33 rated pairs, 51 resource pairs and 39 complete paired timings. These examples
add no trials or participants. [The manifest](manifest.json) separates public-file
hashes from commitments to private reviewed sources. This publication changes
neither the original audit nor the running demo and required no new model, OP,
evaluator or participant test.
