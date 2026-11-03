/** Offline, closed projection of a frozen researcher consolidation. Never reads Muse/OP. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const en = (value, choices) => value == null ? null : choices.includes(value) ? value : fail('unrecognized_public_enum');
const number = value => value == null ? null : typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fail('invalid_public_number');
const integer = value => value == null ? null : Number.isSafeInteger(value) && value >= 0 ? value : fail('invalid_public_integer');
const bool = value => value == null ? null : typeof value === 'boolean' ? value : fail('invalid_public_boolean');
const digest = (value, size = 64) => value == null ? null : new RegExp(`^[a-f0-9]{${size}}$`).test(value) ? value : fail('invalid_public_digest');
const counts = (value, keys) => Object.fromEntries(keys.map(key => [key, integer(value?.[key])]));
const models = ['muse-spark-1.3', 'muse-wonder-1.0'];
const categories = ['combined_rated', 'paired_usage_unrated', 'one_arm_observed_usage', 'no_paired_observed_work'];
const composite = value => {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== 'string' || !Number.isSafeInteger(value[1])) fail('invalid_private_composite_key');
  return JSON.stringify(value);
};
const controls = value => !object(value) ? null : {
  response_extent: en(value.response_extent, ['terse', 'standard', 'full']),
  unsolicited_update: en(value.unsolicited_update, ['send', 'defer']),
  conversation_style: en(value.conversation_style, ['conversational', 'self_contained'])
};
const usage = value => ({
  status: en(value?.status, ['observed', 'not_observed']),
  coverage: en(value?.coverage, ['observed', 'unknown', 'partial']),
  source: en(value?.source, ['native', 'provider_trace', 'unknown']),
  ...counts(value, ['model_calls', 'input_tokens', 'cache_read_tokens', 'output_tokens']),
  native_usage_status: en(value?.native_usage_status, ['observed', 'not_observed']),
  trace_status: en(value?.trace_status, ['observed', 'not_observed']),
  trace_coverage: en(value?.trace_coverage, ['observed', 'unknown', 'partial']),
  source_disagreement: en(value?.source_disagreement, ['same_observed_totals']),
  model_calls_source: en(value?.model_calls_source, ['provider_trace_completed_responses']),
  actual_billing_usd: null
});
const tests = value => !object(value) ? null : counts(value, ['tests', 'pass', 'fail', 'skipped', 'cancelled', 'todo']);
const check = value => ({
  status: en(value?.status, ['passed', 'failed', 'stale']), current: bool(value?.current),
  consumed: bool(value?.consumed), turn_ordinal: integer(value?.turn_ordinal),
  summary: {
    state: en(value?.summary?.state, ['passed', 'failed']),
    artifact_sha256: digest(value?.summary?.artifact_sha256),
    trusted_plan_hash: digest(value?.summary?.trusted_plan_hash),
    public_tests: tests(value?.summary?.public_tests), frozen_tests: tests(value?.summary?.frozen_tests)
  }
});
const arm = value => ({
  usage: usage(value.usage), source_usage: usage(value.source_usage),
  usage_normalization: {
    derived_analysis_projection: bool(value.usage_normalization?.derived_analysis_projection),
    basis: en(value.usage_normalization?.basis, ['original_saved_usage', 'explicit_native_trace_exact_agreement'])
  },
  review: {
    effort_rating: value.review?.effort_rating == null ? null : en(value.review.effort_rating, [1, 2, 3, 4, 5]),
    ...counts(value.review, ['interruption_count', 'completed_review_segments'])
  },
  approval_decisions: integer(value.approval_decisions),
  model: !value.model ? null : {
    requested_model: en(value.model.requested_model, models),
    observed_models: value.model.observed_models.map(model => en(model, models)),
    ...counts(value.model, ['requests_observed', 'unidentified_requests']),
    status: en(value.model.status, ['observed', 'not_observed'])
  },
  elapsed: {
    status: en(value.elapsed?.status, ['completed', 'not_started', 'partial', 'unknown']),
    completed_seconds: number(value.elapsed?.completed_seconds), incomplete_seconds: number(value.elapsed?.incomplete_seconds),
    total_seconds: number(value.elapsed?.total_seconds), ...counts(value.elapsed, ['completed_turns', 'incomplete_turns'])
  },
  last_turn_terminal: en(value.last_turn_terminal, ['completed', 'cancelled']),
  public_output: counts(value.public_output, ['final_messages', 'final_words', 'commentary_messages', 'commentary_words']),
  latest_check: check(value.check),
  ...counts(value, ['check_reports_retained', 'check_reports_omitted']),
  delivery: {
    status: en(value.delivery?.status, ['ambiguous', 'baseline_isolated', 'not_started', 'guidance_observed', 'fallback_observed', 'mixed_observed', 'unverified']),
    ...counts(value.delivery, ['turn_ordinal', 'requests_observed', 'public_finals']),
    response_linkage: en(value.delivery?.response_linkage, ['public_final_matched', 'unverified']),
    hook_linkage: en(value.delivery?.hook_linkage, ['read_marker_matched', 'unverified']),
    response_attribution: !value.delivery?.response_attribution ? null : {
      status: en(value.delivery.response_attribution.status, ['linked', 'partial', 'unverified']),
      ...counts(value.delivery.response_attribution, ['linked_finals', 'linked_responses'])
    }
  }
});

function observed(armValue) {
  const u = armValue.usage;
  return u.status === 'observed' && ['model_calls', 'input_tokens', 'cache_read_tokens', 'output_tokens'].every(key => Number.isSafeInteger(u[key]) && u[key] >= 0)
    && u.input_tokens + u.output_tokens > 0 && u.cache_read_tokens <= u.input_tokens;
}
export function eligibility(record) {
  const a = Object.values(record.arms);
  const paired_resources = a.length === 2 && a.every(observed);
  const paired_ratings = paired_resources && a.every(x => Number.isInteger(x.review.effort_rating) && x.review.effort_rating >= 1 && x.review.effort_rating <= 5 && Number.isSafeInteger(x.review.interruption_count) && x.review.interruption_count >= 0);
  const complete_paired_timing = paired_resources && a.every(x => x.elapsed.status === 'completed' && x.elapsed.incomplete_turns === 0 && Number.isFinite(x.elapsed.completed_seconds));
  return {paired_ratings, paired_resources, complete_paired_timing};
}

/** No arbitrary strings, original IDs, timestamps or extra fields pass this boundary. */
export function projectAudit(input, eligibilityLedger, sourceLedger, qualityLedger, observerLedger = {records: [], conflicts: []}) {
  const sorted = [...input.records].sort((a, b) => composite(a.comparison_key).localeCompare(composite(b.comparison_key), 'en'));
  const ids = new Map(sorted.map((r, i) => [composite(r.comparison_key), `case-${String(i + 1).padStart(3, '0')}`]));
  if (ids.size !== sorted.length) fail('duplicate_comparison_key');
  const selection = new Map(eligibilityLedger.records.map(r => [composite(r.comparison_key), r]));
  if (selection.size !== sorted.length || eligibilityLedger.conflicts.length) fail('eligibility_scope_conflict');
  if (qualityLedger.conflicts?.length || observerLedger.conflicts?.length) fail('history_conflict');
  for (const x of [...qualityLedger.records, ...observerLedger.records]) if (!ids.has(composite(x.comparison_key))) fail('unmapped_history_case');
  const sources = sourceLedger.files.map(s => ({
    case_id: ids.get(composite(s.comparison_key)) ?? fail('unmapped_source_case'),
    retained_source_sha256: digest(s.sha256), checkpoint_sha256: digest(s.checkpoint_sha256),
    source_bytes: integer(s.bytes), checkpoint_bytes: integer(s.checkpoint_bytes), revision: integer(s.revision),
    stable: bool(s.stable), identity_valid: bool(s.identity_valid)
  })).sort((a, b) => a.case_id.localeCompare(b.case_id) || a.retained_source_sha256.localeCompare(b.retained_source_sha256));
  const records = sorted.map(r => {
    const e = selection.get(composite(r.comparison_key));
    if (!e || e.checkpoint_sha256 !== r.checkpoint_sha256 || e.source_sha256 !== r.file_sha256 || e.selected_revision !== r.selected_revision) fail('selected_source_mismatch');
    const history = qualityLedger.records.filter(x => composite(x.comparison_key) === composite(r.comparison_key));
    const value = {
      case_id: ids.get(composite(r.comparison_key)), category: en(r.stratum, categories),
      selected: {
        retained_source_sha256: digest(r.file_sha256), checkpoint_sha256: digest(r.checkpoint_sha256), revision: integer(r.selected_revision),
        session_generation: integer(r.comparison_key[1]),
        endpoint_role: en(r.selection?.endpoint_role, ['provisional_saved_checkpoint', 'retrospective_saved_endpoint', 'source_closed_review_completed_endpoint']),
        provisional: bool(r.selection?.provisional_saved_endpoint),
        operationally_closed: bool(r.selection?.source_pair_operationally_closed),
        review_window_closed: bool(r.selection?.source_review_window_closed),
        participant_stop_independently_verified: bool(r.selection?.participant_stop_independently_verified)
      },
      metadata: {
        model: en(r.metadata.model, models),
        task_profile_id: en(r.metadata.task_profile_id, ['booking-rules', 'shared-expenses', 'notification-routing', 'free-task', 'save-conflicts', 'batch-import']),
        reported_evidence_mode: en(r.metadata.evidence_mode, ['live', 'simulated', 'offline']),
        fixture_version: en(r.metadata.fixture_version, ['1.0.1-draft', '1.0.3-draft', '1.0.4-draft']),
        fixture_commit: digest(r.metadata.fixture_commit, 40), task_source_commit: digest(r.metadata.source_commit, 40),
        reported_harness_fingerprint: digest(r.metadata.harness_fingerprint), verification_plan_hash: digest(r.metadata.verification_plan_hash)
      },
      pair: {status: en(r.pair.status, ['closed', 'ready']), matched_context: bool(r.pair.matched_context)},
      participant_identity_verified: false,
      participant_submissions: counts(r.participant_submissions, ['submissions', 'shared_submissions', 'partial_submissions', 'unconfirmed_submissions']),
      turn_actions: !r.turn_actions ? null : Object.fromEntries(['participant', 'coordinator', 'unattributed'].map(actor => [actor,
        Object.fromEntries(['without', 'with'].map(a => [a, counts(r.turn_actions[actor]?.[a], ['steering_accepted', 'interrupt_accepted', 'interrupt_unconfirmed'])]))])),
      arms: {without: arm(r.arms.without), with: arm(r.arms.with)},
      history_omitted: counts(r.history_omitted, ['policy', 'delivery', 'requests']),
      requests: r.requests.map(x => ({arm: en(x.arm, ['without', 'with']), ordinal: integer(x.ordinal), turn_ordinal: integer(x.turn_ordinal),
        status: en(x.status, ['ambiguous', 'guidance_observed', 'fallback_observed', 'unverified']), controls: controls(x.controls),
        contract: {version: integer(x.contract?.version), status: en(x.contract?.status, ['matched', 'withdrawn', 'unverified'])}})),
      policy_events: r.policy_events.map((x, i) => ({ordinal: i + 1, eligible: bool(x.eligible), controls: controls(x.controls)})),
      readings: r.readings.map((x, i) => ({ordinal: i + 1, controls: controls(x.controls), policy_change: en(x.policy_change, ['changed', 'first', 'unchanged'])})),
      browser_views: r.browser_views.map(x => ({coverage: en(x.coverage, ['observed', 'partial']), ...counts(x, ['held_current', 'held_total', 'released_automatic', 'released_manual'])})),
      presentation_projections: (r.presentation_event_metadata ?? []).map((ledger, i) => ({
        ledger_ordinal: i + 1, arms: ledger.arms.map(a => {
          const times = a.events.map(e => integer(e.at_ms)).filter(t => t != null);
          const first = times.length ? Math.min(...times) : null;
          return {arm: en(a.arm, ['without', 'with']), coverage: en(a.coverage, ['observed']), events_omitted: integer(a.events_omitted),
            events: a.events.map(e => ({...counts(e, ['sequence', 'revision', 'history_epoch', 'ordinal']),
              event: en(e.event, ['held', 'released', 'shown']), kind: en(e.kind, ['approval', 'message']),
              reason: en(e.reason, ['baseline', 'defer', 'disconnected', 'fallback', 'mandatory', 'not_held', 'send']),
              since_first_arm_event_ms: e.at_ms == null || first == null ? null : integer(e.at_ms - first), controls: controls(e.controls)}))};
        })
      })),
      presence_service_observations: {...counts(r.presence_overhead, ['attempt_records', 'attempts_omitted', 'reading_records', 'readings_omitted']),
        ...counts(r.presence_overhead?.service, ['auth_requests', 'capture_requests']),
        auth_elapsed_ms: number(r.presence_overhead?.service?.auth_elapsed_ms), capture_elapsed_ms: number(r.presence_overhead?.service?.capture_elapsed_ms)},
      check_history: history.map((x, i) => ({check_ordinal: i + 1, arm: en(x.arm, ['without', 'with']),
        variants: x.variants.map(v => ({check: check(v.metadata), retained_sources: v.sources.map(s => ({retained_source_sha256: digest(s.source_sha256), checkpoint_sha256: digest(s.checkpoint_sha256), revision: integer(s.revision)}))}))})),
      exchanges: {availability: 'not_present_in_selected_derivative', quoted_text: null}
    };
    value.eligibility = eligibility(value);
    const expected = {paired_ratings: e.rated_inclusion, paired_resources: e.paired_resource_inclusion, complete_paired_timing: e.complete_pair_timing};
    if (JSON.stringify(value.eligibility) !== JSON.stringify(expected)) fail('recomputed_eligibility_mismatch');
    if (!sources.some(s => s.case_id === value.case_id && s.retained_source_sha256 === value.selected.retained_source_sha256 && s.checkpoint_sha256 === value.selected.checkpoint_sha256 && s.revision === value.selected.revision)) fail('selected_source_not_retained');
    return value;
  });
  return {
    schema_version: 1, kind: 'presence_public_audit', classification: 'reviewed_numeric_derivative_not_original_exports',
    source_commitment_scope: 'reported_retained_private_source_and_checkpoint_bytes_not_independently_verified_here',
    records, sources,
    observer_overhead: observerLedger.records.map((r, i) => ({
      report_id: `observer-${String(i + 1).padStart(3, '0')}`, case_id: ids.get(composite(r.comparison_key)),
      variants: r.variants.map(v => ({
        kind: en(v.metadata.kind, ['legacy', 'rich']), status: en(v.metadata.status, ['completed', 'failed']),
        model: en(v.metadata.model, models), stale: bool(v.metadata.stale), error_present: bool(v.metadata.error_present),
        input_relation: en(v.metadata.input_relation, ['same_observed_sequence', 'different_observed_sequence']),
        usage: {...counts(v.metadata.usage, ['model_calls', 'input_tokens', 'output_tokens', 'cache_read_tokens']),
          elapsed_ms: number(v.metadata.usage?.elapsed_ms), reported_cost_usd: number(v.metadata.usage?.cost_usd)},
        retained_sources: v.sources.map(s => ({retained_source_sha256: digest(s.source_sha256), checkpoint_sha256: digest(s.checkpoint_sha256), revision: integer(s.revision)}))
      }))
    }))
  };
}

const metricSpecs = [
  ['average_effort_rating', 'paired_ratings', 'mean_rating', a => a.review.effort_rating],
  ['average_noticed_interruptions', 'paired_ratings', 'mean_count_per_run', a => a.review.interruption_count],
  ['approval_decisions', 'paired_resources', 'total', a => a.approval_decisions],
  ['input_tokens', 'paired_resources', 'total', a => a.usage.input_tokens],
  ['output_tokens', 'paired_resources', 'total', a => a.usage.output_tokens],
  ['cache_read_tokens', 'paired_resources', 'total', a => a.usage.cache_read_tokens],
  ['model_calls', 'paired_resources', 'total', a => a.usage.model_calls],
  ['uncached_input_tokens', 'paired_resources', 'total', a => a.usage.input_tokens - a.usage.cache_read_tokens],
  ['input_plus_output_tokens', 'paired_resources', 'total', a => a.usage.input_tokens + a.usage.output_tokens],
  ['completed_turn_seconds', 'complete_paired_timing', 'mean_complete_pairs', a => a.elapsed.completed_seconds]
];
export function reproduce(audit) {
  const seen = new Set();
  for (const r of audit.records) {
    if (seen.has(r.case_id)) fail('duplicate_public_case'); seen.add(r.case_id);
    if (JSON.stringify(eligibility(r)) !== JSON.stringify(r.eligibility)) fail('public_eligibility_mismatch');
  }
  return {
    units: {all_saved_comparison_keys: audit.records.length,
      paired_ratings: audit.records.filter(r => r.eligibility.paired_ratings).length,
      paired_resources: audit.records.filter(r => r.eligibility.paired_resources).length,
      complete_paired_timing: audit.records.filter(r => r.eligibility.complete_paired_timing).length,
      retained_source_hashes: new Set(audit.sources.map(s => s.retained_source_sha256)).size,
      checkpoint_versions: new Set(audit.sources.map(s => s.checkpoint_sha256)).size},
    metrics: metricSpecs.map(([metric_id, include, aggregation, get]) => {
      const rows = audit.records.filter(r => r.eligibility[include]);
      const values = ['without', 'with'].map(armName => {
        const sum = rows.reduce((total, r) => total + get(r.arms[armName]), 0);
        return !rows.length ? null : aggregation === 'total' ? sum : sum / rows.length;
      });
      return {metric_id, aggregation, eligible_paired_n: rows.length, without: values[0], with: values[1],
        percentage_change: values[0] ? 100 * (values[1] - values[0]) / values[0] : null,
        included_cases: rows.map(r => r.case_id)};
    })
  };
}

const encode = value => JSON.stringify(value, null, 2) + '\n';
async function main(args) {
  if (args[0] === 'reproduce' && args.length === 2) {
    const folder = path.resolve(args[1]);
    const manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'));
    if (Object.keys(manifest.files ?? {}).sort().join(',') !== 'audit.json,summary.json') fail('incomplete_public_manifest');
    for (const [name, expected] of Object.entries(manifest.files)) {
      if (!['audit.json', 'summary.json'].includes(name)) fail('unexpected_manifest_path');
      if (sha256(await fs.readFile(path.join(folder, name))) !== expected) fail('public_file_digest_mismatch');
    }
    const actual = reproduce(JSON.parse(await fs.readFile(path.join(folder, 'audit.json'), 'utf8')));
    if (encode(actual) !== await fs.readFile(path.join(folder, 'summary.json'), 'utf8')) fail('public_summary_mismatch');
    console.log(encode(actual)); return;
  }
  if (args[0] !== 'prepare' || args.length !== 3) fail('usage: node scripts/evidence-audit.mjs prepare PRIVATE_FREEZE NEW_OUTPUT | reproduce PUBLIC_AUDIT_FOLDER');
  const source = path.resolve(args[1]), output = path.resolve(args[2]);
  const names = ['input-records.json', 'eligibility-ledger.json', 'source-ledger.json', 'quality-history-ledger.json', 'metrics.json', 'observer-ledger.json'];
  const raw = Object.fromEntries(await Promise.all(names.map(async name => [name, await fs.readFile(path.join(source, name))])));
  const parsed = Object.fromEntries(names.map(name => [name, JSON.parse(raw[name])]));
  const audit = projectAudit(parsed[names[0]], parsed[names[1]], parsed[names[2]], parsed[names[3]], parsed['observer-ledger.json']);
  const summary = reproduce(audit);
  for (const expected of parsed['metrics.json'].groups.all_available.metrics) {
    const m = summary.metrics.find(x => x.metric_id === expected.metric_id);
    if (!m || m.eligible_paired_n !== expected.eligible_paired_n || ['without', 'with'].some(k => Math.abs(m[k] - expected[k]) > 1e-9)) fail('authoritative_metric_mismatch');
  }
  const encoded = {'audit.json': encode(audit), 'summary.json': encode(summary)};
  const manifest = {
    schema_version: 1, kind: 'presence_public_audit_manifest',
    freeze_cutoff_utc: parsed['eligibility-ledger.json'].cutoff_utc,
    source_derivative_sha256: Object.fromEntries(names.map(name => [name, sha256(raw[name])])),
    files: Object.fromEntries(Object.entries(encoded).map(([name, bytes]) => [name, sha256(bytes)])),
    transformations: ['Pseudonyms replace full run/generation identities; no short-prefix merges.',
      'Original IDs, source locators and individual timestamps removed; ordered policy/read sequences retained.',
      'Closed field/type/enum projection excludes arbitrary extra fields, narrative, secrets, typing, Capsules and reasoning.',
      'Authorized numeric ratings, usage, original usage and labelled analysis normalization retained.',
      'Every selected case retained, including unrated, one-arm, no-paired-work, failures and provisional endpoints.',
      'All retained quality-check variants and source commitments preserved; originals not rewritten.',
      'Browser event projections kept separately; epoch times replaced by intervals since each arm projection began.',
      'Observer numeric history kept separate from coding totals; narrative, coverage detail and per-response attribution arrays omitted.',
      'No quoted exchanges are present in these source derivatives; none reconstructed.',
      'Summary independently recomputed from published case rows and outcome-specific eligibility.'],
    original_files: 'Private; these are derived audit records, not raw exports or verified provider bills.',
    review_scope: 'Data projection and numeric reproduction only; no new user/model/provider/OP test.'
  };
  // A fresh destination prevents accidental replacement of a previously reviewed freeze.
  await fs.mkdir(output);
  for (const [name, bytes] of Object.entries({...encoded, 'manifest.json': encode(manifest)})) await fs.writeFile(path.join(output, name), bytes, {flag: 'wx', mode: 0o644});
  console.log(encode({units: summary.units, files: manifest.files}));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
