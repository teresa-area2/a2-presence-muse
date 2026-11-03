// Offline quantitative support for the overall assessment. No services or model calls.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {reproduce} from '../../scripts/evidence-audit.mjs';

const bytes = await fs.readFile(new URL('../audit-2026-11-03/audit.json', import.meta.url));
const audit = JSON.parse(bytes), records = audit.records;
const primary = reproduce(audit); // Rechecks identities and outcome eligibility.
const count = rows => rows.reduce((out, value) => {out[value] = (out[value] ?? 0) + 1; return out;}, {});
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const median = values => {const v = [...values].sort((a, b) => a - b), m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;};
const dir = (without, withValue) => withValue < without ? 'lower_with' : withValue > without ? 'higher_with' : 'equal';
const directions = (rows, get) => {
  const out = {lower_with: 0, equal: 0, higher_with: 0};
  for (const r of rows) out[dir(get(r.arms.without), get(r.arms.with))]++;
  return out;
};
const paired = (rows, get, aggregation = 'sum') => {
  const without = rows.map(r => get(r.arms.without)), withValues = rows.map(r => get(r.arms.with));
  const total = values => aggregation === 'mean' ? mean(values) : values.reduce((a, b) => a + b, 0);
  const w = total(without), v = total(withValues);
  return {paired_n: rows.length, without: w, with: v, percentage_change: w ? 100 * (v - w) / w : null,
    directions: directions(rows, get)};
};
const rated = records.filter(r => r.eligibility.paired_ratings), resources = records.filter(r => r.eligibility.paired_resources), timed = records.filter(r => r.eligibility.complete_paired_timing);
const metrics = {
  approval_decisions: a => a.approval_decisions, input_tokens: a => a.usage.input_tokens,
  output_tokens: a => a.usage.output_tokens, cache_read_tokens: a => a.usage.cache_read_tokens,
  model_calls: a => a.usage.model_calls, uncached_input_tokens: a => a.usage.input_tokens - a.usage.cache_read_tokens,
  input_plus_output_tokens: a => a.usage.input_tokens + a.usage.output_tokens
};
const resourceSummary = rows => ({paired_n: rows.length, included_cases: rows.map(r => r.case_id),
  metrics: Object.fromEntries(Object.entries(metrics).map(([name, get]) => [name, paired(rows, get)]))});
const joint = count(rated.map(r => dir(r.arms.without.review.effort_rating, r.arms.with.review.effort_rating) + '/' + dir(r.arms.without.review.interruption_count, r.arms.with.review.interruption_count)));
const requests = records.flatMap(r => r.requests.filter(q => q.arm === 'with'));
const events = r => r.presentation_projections.flatMap(l => l.arms.flatMap(a => a.events));
const allEvents = records.flatMap(events);
const hasEarlierFailure = r => r.check_history.some(c => c.variants.some(v => (v.check.summary.frozen_tests?.fail ?? 0) > 0));
const hasCommonCurrentPass = r => {
  const a = r.arms.without.latest_check, b = r.arms.with.latest_check;
  return a.current === true && b.current === true && a.summary.state === 'passed' && b.summary.state === 'passed'
    && Boolean(a.summary.trusted_plan_hash) && a.summary.trusted_plan_hash === b.summary.trusted_plan_hash;
};
const bothLower = rated.filter(r => r.arms.with.review.effort_rating < r.arms.without.review.effort_rating && r.arms.with.review.interruption_count < r.arms.without.review.interruption_count);
const ratedTimed = rated.filter(r => r.eligibility.complete_paired_timing);
const responses = JSON.parse(await fs.readFile(new URL('../impact-2026-11-03/response-excerpts.json', import.meta.url), 'utf8')).responses;
const out = {
  schema_version: 1, kind: 'presence_overall_quantitative_evidence',
  source_audit_sha256: createHash('sha256').update(bytes).digest('hex'),
  scope: primary.units, category_counts: count(records.map(r => r.category)),
  missingness: {outside_paired_ratings: records.length - rated.length,
    outside_paired_resources: records.length - resources.length,
    outside_complete_timing: records.length - timed.length,
    resource_pairs_without_complete_timing: resources.length - timed.length},
  provisional_saved_endpoints: {all_cases: records.filter(r => r.selected.provisional).length,
    rated: rated.filter(r => r.selected.provisional).length,
    resources: resources.filter(r => r.selected.provisional).length,
    complete_timing: timed.filter(r => r.selected.provisional).length},
  experience: {
    effort_rating: paired(rated, a => a.review.effort_rating, 'mean'),
    noticed_interruptions: paired(rated, a => a.review.interruption_count, 'mean'),
    effort_then_interruption_joint_directions: joint,
    both_lower_cases: bothLower.map(r => r.case_id),
    provisional_rated_endpoints: rated.filter(r => r.selected.provisional).length,
    independent_usefulness_or_accepted_work_value_measure: null
  },
  resources: {all_available: resourceSummary(resources), same_rated_cases: resourceSummary(rated)},
  joint_experience_tradeoffs: {
    rated_n: rated.length, both_reported_outcomes_lower_n: bothLower.length,
    both_lower_and_higher_input_cases: bothLower.filter(r => r.arms.with.usage.input_tokens > r.arms.without.usage.input_tokens).map(r => r.case_id),
    both_lower_and_more_model_calls_cases: bothLower.filter(r => r.arms.with.usage.model_calls > r.arms.without.usage.model_calls).map(r => r.case_id),
    complete_rated_timing_n: ratedTimed.length,
    both_lower_and_longer_complete_elapsed_cases: bothLower.filter(r => r.eligibility.complete_paired_timing && r.arms.with.elapsed.completed_seconds > r.arms.without.elapsed.completed_seconds).map(r => r.case_id),
    both_lower_and_recorded_current_common_pass_cases: bothLower.filter(hasCommonCurrentPass).map(r => r.case_id)
  },
  timing: {...paired(timed, a => a.elapsed.completed_seconds, 'mean'),
    median_paired_with_without_ratio: median(timed.filter(r => r.arms.without.elapsed.completed_seconds > 0).map(r => r.arms.with.elapsed.completed_seconds / r.arms.without.elapsed.completed_seconds))},
  behavior_coverage: {
    inventory_cases: records.length, cases_with_readings: records.filter(r => r.readings.length).length,
    retained_readings: records.reduce((n, r) => n + r.readings.length, 0),
    cases_with_retained_with_request_rows: records.filter(r => r.requests.some(q => q.arm === 'with')).length,
    retained_with_request_rows: requests.length, recorded_request_labels: count(requests.map(q => q.status)),
    resource_cases_with_retained_with_request_rows: resources.filter(r => r.requests.some(q => q.arm === 'with')).length,
    endpoint_public_final_matched_cases: records.filter(r => r.arms.with.delivery.response_linkage === 'public_final_matched').length,
    endpoint_read_marker_matched_cases: records.filter(r => r.arms.with.delivery.hook_linkage === 'read_marker_matched').length,
    cases_with_reviewed_final_excerpts: new Set(responses.map(r => r.case_id)).size,
    reviewed_final_excerpts: responses.length, complete_exchanges_in_reviewed_catalog: 0,
    browser_projections: records.reduce((n, r) => n + r.presentation_projections.length, 0),
    cases_with_recorded_held_event: records.filter(r => events(r).some(e => e.event === 'held')).length,
    presentation_event_labels_nonadditive: count(allEvents.map(e => e.event)),
    cohort_semantic_adherence_estimate: null
  },
  quality: {
    recorded_current_common_pass_resource_pairs: resources.filter(hasCommonCurrentPass).length,
    recorded_current_common_pass_rated_pairs: rated.filter(hasCommonCurrentPass).length,
    resource_pairs_with_retained_earlier_frozen_failure: resources.filter(hasEarlierFailure).length,
    rated_pairs_with_retained_earlier_frozen_failure: rated.filter(hasEarlierFailure).length,
    general_quality_equivalence_established: false
  },
  interpretation: {independent_people_from_case_count: false, causal_estimate: false,
    cross_outcome_groups_overlap: true, browser_projections_nonadditive: true,
    missing_evidence_is_zero_effect: false, actual_billing: null, full_presence_overhead: null,
    single_net_benefit_score: null, new_trials: 0}
};
const encoded = JSON.stringify(out, null, 2) + '\n';
if (process.argv[2] === '--verify') {
  if (await fs.readFile(new URL('./quantitative-evidence.json', import.meta.url), 'utf8') !== encoded) throw Error('overall_quantitative_evidence_mismatch');
  console.log('Overall quantitative evidence matches the frozen public audit.');
} else if (process.argv.length === 2) process.stdout.write(encoded);
else throw Error('usage: node evidence/overall-2026-11-03/reproduce.mjs [--verify]');
