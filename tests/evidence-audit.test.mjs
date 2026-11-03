import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {projectAudit, reproduce, sha256} from '../scripts/evidence-audit.mjs';

const hash = 'a'.repeat(64), checkpoint = 'b'.repeat(64);
function fixture() {
  const key = ['10000000-0000-4000-8000-000000000001', 1];
  const arm = (input, cache, output, rating, interruptions, seconds) => ({
    usage: {status: 'observed', coverage: 'observed', source: 'provider_trace', model_calls: 2,
      input_tokens: input, cache_read_tokens: cache, output_tokens: output},
    source_usage: {status: 'observed', coverage: 'observed', source: 'native', model_calls: 2,
      input_tokens: input, cache_read_tokens: cache, output_tokens: output},
    usage_normalization: {derived_analysis_projection: true, basis: 'explicit_native_trace_exact_agreement'},
    review: {effort_rating: rating, interruption_count: interruptions, completed_review_segments: 1}, approval_decisions: 1,
    elapsed: {status: 'completed', completed_seconds: seconds, incomplete_seconds: 0, total_seconds: seconds,
      completed_turns: 2, incomplete_turns: 0}, check: {}, delivery: {}, public_output: {}
  });
  const r = {comparison_key: key, selected_revision: 3, file_sha256: hash, checkpoint_sha256: checkpoint,
    source_file: '/PRIVATE/SECRET/source.json', recorded_at_utc: '2026-11-03T00:00:00Z', stratum: 'combined_rated',
    metadata: {model: 'muse-spark-1.3', evidence_mode: 'live', task_profile_id: null},
    pair: {status: 'closed', matched_context: false}, selection: {endpoint_role: 'provisional_saved_checkpoint',
      provisional_saved_endpoint: true, source_pair_operationally_closed: true, source_review_window_closed: false},
    participant_submissions: {}, arms: {without: arm(100, 80, 20, 4, 3, 10), with: arm(120, 20, 10, 2, 1, 12)},
    history_omitted: {}, requests: [], policy_events: [], readings: [], browser_views: []};
  return [{records: [r]}, {records: [{comparison_key: key, checkpoint_sha256: checkpoint, source_sha256: hash,
    selected_revision: 3, rated_inclusion: true, paired_resource_inclusion: true, complete_pair_timing: true}], conflicts: []},
  {files: [{comparison_key: key, sha256: hash, checkpoint_sha256: checkpoint, revision: 3, bytes: 42,
    checkpoint_bytes: 20, stable: true, identity_valid: true}]},
  {records: [{comparison_key: key, arm: 'with', check_id: 'SECRET_CHECK_ID', variants: [{metadata: {
    id: 'SECRET_CHECK_ID', at: '2026-11-03T00:00:00Z', status: 'stale', current: false, consumed: true,
    turn_ordinal: 1, summary: {state: 'failed', frozen_tests: {tests: 3, pass: 2, fail: 1}}},
    sources: [{source_sha256: hash, checkpoint_sha256: checkpoint, revision: 3}]}]}], conflicts: []}];
}

test('public rows independently reproduce ratings, input/cache arithmetic, time and paired denominators', () => {
  const a = projectAudit(...fixture()), s = reproduce(a);
  assert.equal(s.units.paired_ratings, 1); assert.equal(s.units.paired_resources, 1);
  assert.equal(s.units.complete_paired_timing, 1);
  const metric = id => s.metrics.find(m => m.metric_id === id);
  assert.equal(metric('average_effort_rating').without, 4); assert.equal(metric('average_effort_rating').with, 2);
  assert.equal(metric('average_noticed_interruptions').with, 1);
  assert.equal(metric('uncached_input_tokens').without, 20); assert.equal(metric('uncached_input_tokens').with, 100);
  assert.equal(metric('input_plus_output_tokens').without, 120); assert.equal(metric('input_plus_output_tokens').with, 130);
  assert.equal(metric('completed_turn_seconds').with, 12);
  assert.equal(a.records[0].arms.with.source_usage.source, 'native');
  assert.equal(a.records[0].arms.with.usage_normalization.basis, 'explicit_native_trace_exact_agreement');
});

test('closed projection strips incidental identifiers, secrets and arbitrary nested fields without dropping adverse checks', () => {
  const f = fixture();
  f[0].records[0].raw_typing = ['SECRET_KEYS']; f[0].records[0].metadata.secret = 'SECRET_CREDENTIAL';
  f[0].records[0].arms.with.review.narrative = 'SECRET_PERSONAL_TEXT';
  f[0].records[0].arms.with.usage.secret = 'SECRET_TOKEN';
  const a = projectAudit(...f), text = JSON.stringify(a);
  for (const value of ['SECRET', '/PRIVATE', '10000000-0000', '2026-11-03T00:00:00Z']) assert.ok(!text.includes(value), value);
  assert.equal(a.records[0].check_history[0].variants[0].check.summary.frozen_tests.fail, 1);
  assert.equal(a.records[0].check_history[0].variants[0].check.status, 'stale');
  assert.equal(a.records[0].selected.provisional, true);
  assert.equal(a.records[0].metadata.task_profile_id, null);
  assert.equal(a.records[0].exchanges.availability, 'not_present_in_selected_derivative');
});

test('unknown strings cannot pass through known enum fields', () => {
  const f = fixture(); f[0].records[0].arms.with.usage.source = 'SECRET_INJECTION';
  assert.throws(() => projectAudit(...f), /unrecognized_public_enum/);
  const version = fixture(); version[0].records[0].metadata.fixture_version = '1.0.4-SECRET';
  assert.throws(() => projectAudit(...version), /unrecognized_public_enum/);
});

test('presentation preserves hold/release mechanisms and relative intervals without epoch times or ledger IDs', () => {
  const f = fixture(); f[0].records[0].presentation_event_metadata = [{ledger_id: 'SECRET_LEDGER', arms: [{
    arm: 'with', coverage: 'observed', events_omitted: 2,
    events: [{event: 'held', kind: 'message', reason: 'defer', at_ms: 1793700000000, sequence: 1},
      {event: 'released', kind: 'message', reason: 'send', at_ms: 1793700002500, sequence: 2}]
  }]}];
  const a = projectAudit(...f), events = a.records[0].presentation_projections[0].arms[0].events;
  assert.equal(events[0].since_first_arm_event_ms, 0); assert.equal(events[1].since_first_arm_event_ms, 2500);
  assert.equal(events[0].event, 'held'); assert.equal(events[1].event, 'released');
  assert.equal(a.records[0].presentation_projections[0].arms[0].events_omitted, 2);
  for (const value of ['SECRET_LEDGER', '1793700000000']) assert.ok(!JSON.stringify(a).includes(value));
});

test('duplicates fail; identical run IDs in different generations remain separate cases', () => {
  const f = fixture(); f[0].records.push(structuredClone(f[0].records[0]));
  assert.throws(() => projectAudit(...f), /duplicate_comparison_key/);
  f[0].records[1].comparison_key[1] = 2;
  for (const n of [1, 2]) {const field = n === 1 ? 'records' : 'files'; const row = structuredClone(f[n][field][0]); row.comparison_key[1] = 2; f[n][field].push(row);}
  const a = projectAudit(...f); assert.equal(a.records.length, 2);
  assert.notEqual(a.records[0].case_id, a.records[1].case_id);
});

test('no favorable subset: missing ratings and one-arm usage remain explicit, with missing different from zero', () => {
  const f = fixture(), r = f[0].records[0];
  r.stratum = 'one_arm_observed_usage'; r.arms.with.review.effort_rating = null;
  Object.assign(r.arms.without.usage, {status: 'not_observed', input_tokens: null, output_tokens: null,
    cache_read_tokens: null, model_calls: null});
  Object.assign(f[1].records[0], {rated_inclusion: false, paired_resource_inclusion: false, complete_pair_timing: false});
  const a = projectAudit(...f), s = reproduce(a);
  assert.equal(a.records.length, 1); assert.equal(s.units.paired_resources, 0);
  assert.equal(a.records[0].arms.without.usage.input_tokens, null);
  assert.equal(s.metrics.find(x => x.metric_id === 'input_tokens').without, null);
});

test('source/eligibility conflicts and unmapped histories stop publication', () => {
  let f = fixture(); f[1].records[0].rated_inclusion = false;
  assert.throws(() => projectAudit(...f), /recomputed_eligibility_mismatch/);
  f = fixture(); f[2].files[0].sha256 = 'c'.repeat(64);
  assert.throws(() => projectAudit(...f), /selected_source_not_retained/);
  f = fixture(); f[3].records[0].comparison_key = ['other', 1];
  assert.throws(() => projectAudit(...f), /unmapped_history_case/);
});

test('published frozen audit reproduces every declared aggregate and verifies its public-byte hashes', async () => {
  const dir = new URL('../evidence/audit-2026-11-03/', import.meta.url);
  const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', dir), 'utf8'));
  for (const [name, hash] of Object.entries(manifest.files)) assert.equal(sha256(await fs.readFile(new URL(name, dir))), hash);
  const audit = JSON.parse(await fs.readFile(new URL('audit.json', dir), 'utf8'));
  const summary = reproduce(audit);
  assert.deepEqual(summary, JSON.parse(await fs.readFile(new URL('summary.json', dir), 'utf8')));
  assert.deepEqual(summary.units, {all_saved_comparison_keys: 82, paired_ratings: 33, paired_resources: 51,
    complete_paired_timing: 39, retained_source_hashes: 200, checkpoint_versions: 133});
  const expected = {average_effort_rating: [126 / 33, 56 / 33], average_noticed_interruptions: [159 / 33, 94 / 33],
    approval_decisions: [243, 227], input_tokens: [18491798, 18742436], output_tokens: [620534, 531988],
    cache_read_tokens: [16772341, 8258201], model_calls: [834, 795],
    uncached_input_tokens: [1719457, 10484235], input_plus_output_tokens: [19112332, 19274424]};
  for (const [id, values] of Object.entries(expected)) {
    const m = summary.metrics.find(x => x.metric_id === id); assert.deepEqual([m.without, m.with], values, id);
  }
  assert.equal(audit.records.reduce((n, r) => n + r.check_history.length, 0), 92);
  assert.equal(audit.records.reduce((n, r) => n + r.check_history.reduce((sum, h) => sum + h.variants.length, 0), 0), 124);
  assert.equal(audit.observer_overhead.length, 15);
  assert.equal(audit.observer_overhead.reduce((sum, r) => sum + r.variants[0].usage.model_calls, 0), 15);
  assert.equal(audit.records.reduce((n, r) => n + r.presentation_projections.length, 0), 102);
  assert.equal(audit.records.reduce((n, r) => n + r.presentation_projections.reduce((t, l) => t + l.arms.reduce((s, a) => s + a.events.length, 0), 0), 0), 1912);
});
