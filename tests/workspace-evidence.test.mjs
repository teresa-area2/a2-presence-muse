import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createWorkspaceEvidenceStores} from '../src/workspace-evidence.mjs';
import {buildEvidencePackage} from '../src/evidence-package.mjs';

async function fixture(t){const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'workspace-evidence-')));t.after(()=>fs.rm(root,{recursive:true,force:true}));return{root,home:path.join(root,'saved-evidence')};}
test('two checkout configurations save checkpoints and exports to the same user evidence home',async t=>{
 const {root,home}=await fixture(t),first=path.join(root,'checkout-one'),second=path.join(root,'checkout-two');
 await fs.mkdir(first);await fs.mkdir(second);
 const a=await createWorkspaceEvidenceStores({environment:{A2_MUSE_EVIDENCE_HOME:home,A2_MUSE_EVIDENCE_REPOSITORY_ROOT:first}});
 const b=await createWorkspaceEvidenceStores({environment:{A2_MUSE_EVIDENCE_HOME:home,A2_MUSE_EVIDENCE_REPOSITORY_ROOT:second}});
 t.after(()=>a.evidenceStore.close());t.after(()=>b.evidenceStore.close());
 assert.equal(a.home,b.home);assert.equal(a.evidencePackageStore.destination,'shared_user_evidence_home');
 const ids=[];
 for(const storage of [a,b]){
  const id=storage.evidenceStore.begin(1);ids.push(id);storage.evidenceStore.capture(id,{});
  const checkpoint=await storage.evidenceStore.export(id);
  const pkg=buildEvidencePackage({checkpoint,identity:{run_id:id,session_generation:1},createdAt:'2026-11-03T14:00:00.000Z'});
  const receipt=await storage.evidencePackageStore.save(pkg);
  assert.equal(path.dirname(receipt.path),path.join(home,'evidence-packages'));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(home,'evidence-runs',id+'.json'),'utf8')),checkpoint);
 }
 assert.equal(new Set(ids).size,2);assert.equal((await fs.readdir(path.join(home,'evidence-runs'))).length,2);
 assert.equal((await fs.readdir(path.join(home,'evidence-packages'))).length,2);
 assert.deepEqual(await fs.readdir(first),[]);assert.deepEqual(await fs.readdir(second),[]);
});
test('replaced shared-home ancestor prevents subsequent checkpoint writes',async t=>{
 const {root,home}=await fixture(t),parent=path.join(root,'private');await fs.mkdir(parent,{mode:0o700});
 const selected=path.join(parent,'evidence'),s=await createWorkspaceEvidenceStores({evidenceHome:selected});
 const id=s.evidenceStore.begin(1);s.evidenceStore.capture(id,{});await s.evidenceStore.flush(id);
 const file=path.join(selected,'evidence-runs',id+'.json'),before=await fs.readFile(file);
 await fs.rename(parent,parent+'-old');await fs.mkdir(parent,{mode:0o700});await fs.rename(path.join(parent+'-old','evidence'),selected);
 s.evidenceStore.capture(id,{});await assert.rejects(s.evidenceStore.flush(id),/evidence_save_failed/);
 assert.deepEqual(await fs.readFile(file),before);await assert.rejects(s.evidenceStore.close(),/evidence_save_failed/);
});
test('unsafe configured destination fails without silently saving to the checkout',async t=>{
 const {root}=await fixture(t);await assert.rejects(createWorkspaceEvidenceStores({environment:{A2_MUSE_EVIDENCE_HOME:'relative',A2_MUSE_EVIDENCE_REPOSITORY_ROOT:root}}),/evidence_home_invalid/);
 await assert.rejects(createWorkspaceEvidenceStores({evidenceHome:null}),/evidence_home_invalid/);
 assert.deepEqual(await fs.readdir(root),[]);
});
