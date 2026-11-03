# Presence impact assessment

**See Presence impact** is an optional assessment in **Testing and diagnostics**. It makes a separate request to Muse Spark 1.3 only when you choose the action; it does not run automatically as you type or finish a turn.

## What is shared

The request can include selected exchanges, work-file excerpts, Presence guidance and evidence, checks, usage and interaction metrics. Selected messages and files may contain private information or embedded credentials. Filename filtering excludes some sensitive files but does **not** reliably detect secrets inside text or code. Use a non-sensitive task and review your messages and files before clicking. There is no separate review of the exact packet before it is sent.

The coding sessions and this assessment are separate Meta/Muse requests. Open Presence receives interaction metadata through its own route. See [Privacy & Data Use](PRIVACY-DATA-USE.md) for the routes, consent and retention limits.

## How to read the result

The report compares recorded work, communication, timing and available resource use in relation to the Presence guidance for the relevant task step. It can show a takeaway, resource comparisons and paired excerpts. Missing or one-sided evidence is identified rather than treated as a matched result. Historical reports may cover fewer areas.

Resource figures can include cached and uncached input, reasoning and tool arguments; the assessment has its own usage. Counts do not establish billing costs, a causal improvement or human benefit. A validated report can still contain an incorrect interpretation. New work or changed ratings can make an assessment outdated.

An evidence export saves locally and does not itself send another model request. Exports can still contain private task information, including assessment text, so inspect them before sharing. Saving an export does not restore a closed native conversation.

## Limits and technical detail

Offline checks cover selection, grounding, privacy boundaries and freshness, but they do not prove the assessment is correct. The revised assessment prompt has not received a new provider-backed qualification. For packet contents, validation, execution limits and historical report behavior, see the [technical reference](OBSERVER-TECHNICAL.md).
