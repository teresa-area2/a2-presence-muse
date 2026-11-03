import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolveEvidenceHome,prepareEvidenceHome} from '../src/evidence-home.mjs';
import {buildEvidencePackage,createEvidencePackageStore} from '../src/evidence-package.mjs';
import {createEvidenceStore} from '../src/evidence-store.mjs';
const digest=v=>createHash('sha256').update(v).digest('hex');
async function fixture(t){const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'evidence-home-test-')));t.after(()=>fs.rm(root,{recursive:true,force:true}));return{root,home:path.join(root,'saved','evidence')};}
function pkg(){const run_id='10000000-0000-4000-8000-000000000001';return buildEvidencePackage({checkpoint:{run_id,session_generation:1,revision:1},identity:{run_id,session_generation:1},createdAt:'2026-11-03T14:00:00.000Z'});}

test('default evidence home is per user and independent of checkout or cwd',async t=>{
 const {root}=await fixture(t),first=path.join(root,'repo-one'),second=path.join(root,'repo-two');await fs.mkdir(first);await fs.mkdir(second);
 const module=new URL('../src/evidence-home.mjs',import.meta.url).href,script=`import {resolveEvidenceHome} from ${JSON.stringify(module)};console.log(resolveEvidenceHome({environment:{}}));`;
 const results=[first,second].map(cwd=>execFileSync(process.execPath,['--input-type=module','-e',script],{cwd,encoding:'utf8'}).trim());
 assert.equal(results[0],path.join(os.homedir(),'.local','share','a2-presence-muse','evidence'));assert.equal(results[0],results[1]);
});
test('only trusted absolute normalized explicit home is accepted without fallback',()=>{
 assert.equal(resolveEvidenceHome({environment:{A2_MUSE_EVIDENCE_HOME:'/absolute/saved'},homeDirectory:'/different'}),'/absolute/saved');
 for(const value of ['',undefined,null,'relative','/absolute/../other','/absolute/','/absolute/\0bad'])assert.throws(()=>resolveEvidenceHome({environment:{A2_MUSE_EVIDENCE_HOME:value},homeDirectory:'/valid'}),/home_invalid/);
});
test('preparation creates one private home for checkpoints and packages without Git metadata',async t=>{
 const {home}=await fixture(t),out=await prepareEvidenceHome({evidenceHome:home});
 assert.equal(out.home,home);assert.equal(out.runsDirectory,path.join(home,'evidence-runs'));assert.equal(out.packagesDirectory,path.join(home,'evidence-packages'));
 for(const p of [home,out.runsDirectory,out.packagesDirectory])assert.equal((await fs.lstat(p)).mode&0o777,0o700);
 assert.deepEqual(await fs.readdir(home),['evidence-packages','evidence-runs']);assert.equal(out.assertCurrent(),undefined);
});
test('unsafe existing permissions and symlink ancestors are refused without changing destinations',async t=>{
 const {root,home}=await fixture(t);await fs.mkdir(home,{recursive:true,mode:0o700});await fs.chmod(home,0o755);await assert.rejects(prepareEvidenceHome({evidenceHome:home}),/home_unsafe/);assert.equal((await fs.stat(home)).mode&0o777,0o755);
 const outside=path.join(root,'outside'),link=path.join(root,'link');await fs.mkdir(outside);await fs.symlink(outside,link);await assert.rejects(prepareEvidenceHome({evidenceHome:path.join(link,'new-home')}),/home_unsafe/);assert.deepEqual(await fs.readdir(outside),[]);
});
test('homes inside normal, worktree and bare repositories are refused before creating evidence',async t=>{
 const {root}=await fixture(t);
 for(const type of ['normal','worktree','bare']){
  const repo=path.join(root,type);await fs.mkdir(repo);
  if(type==='normal')await fs.mkdir(path.join(repo,'.git'));
  if(type==='worktree')await fs.writeFile(path.join(repo,'.git'),'gitdir: /elsewhere');
  if(type==='bare'){await fs.writeFile(path.join(repo,'HEAD'),'ref: refs/heads/main');await fs.mkdir(path.join(repo,'objects'));await fs.mkdir(path.join(repo,'refs'));}
  await assert.rejects(prepareEvidenceHome({evidenceHome:path.join(repo,'evidence')}),/home_inside_repository/);await assert.rejects(fs.access(path.join(repo,'evidence')),{code:'ENOENT'});
 }
});
test('replacement of a pinned ancestor and later Git initialization invalidate the destination',async t=>{
 const {home}=await fixture(t),out=await prepareEvidenceHome({evidenceHome:home}),parent=path.dirname(home);await fs.rename(parent,parent+'-old');await fs.mkdir(parent,{mode:0o700});await fs.rename(path.join(parent+'-old','evidence'),home);assert.throws(out.assertCurrent,/home_unsafe/);
 const other=await fixture(t),next=await prepareEvidenceHome({evidenceHome:other.home});await fs.mkdir(path.join(other.root,'.git'));assert.throws(next.assertCurrent,/home_inside_repository/);
});
test('shared package store saves private verified bytes once across two instances',async t=>{
 const {home}=await fixture(t),a=await createEvidencePackageStore({evidenceHome:home}),b=await createEvidencePackageStore({evidenceHome:home}),value=pkg();
 const results=await Promise.allSettled([a.save(value),b.save(value)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'EEXIST');
 const receipt=results.find(r=>r.status==='fulfilled').value,body=await fs.readFile(receipt.path);assert.equal(receipt.path,path.join(home,'evidence-packages',value.package_id+'.json'));assert.deepEqual(JSON.parse(body),value);assert.equal(receipt.sha256,digest(body));assert.equal(receipt.bytes,body.length);assert.equal((await fs.stat(receipt.path)).mode&0o777,0o600);assert.equal((await fs.readdir(path.dirname(receipt.path))).length,1);
});
test('independent checkpoint stores and explicit packages share one durable home',async t=>{
 const {home}=await fixture(t),prepared=await prepareEvidenceHome({evidenceHome:home}),a=await createEvidenceStore({directory:prepared.runsDirectory}),b=await createEvidenceStore({directory:prepared.runsDirectory});
 t.after(async()=>{await a.close();await b.close();});
 const ids=[a.begin(1),b.begin(1)];a.capture(ids[0],{status:'ready'});b.capture(ids[1],{status:'ready'});await Promise.all([a.flush(ids[0]),b.flush(ids[1])]);
 const checkpoint=await a.export(ids[0]),value=buildEvidencePackage({checkpoint,identity:{run_id:ids[0],session_generation:1},createdAt:'2026-11-03T14:00:00.000Z'}),store=await createEvidencePackageStore({evidenceHome:home}),saved=await store.save(value);
 assert.deepEqual((await fs.readdir(prepared.runsDirectory)).sort(),ids.map(id=>id+'.json').sort());assert.equal(saved.path,path.join(prepared.packagesDirectory,value.package_id+'.json'));assert.deepEqual(JSON.parse(await fs.readFile(saved.path,'utf8')).checkpoint.value,checkpoint);
});
test('shared package store rejects stale/async guards and changes made by the final guard',async t=>{
 const {home}=await fixture(t),store=await createEvidencePackageStore({evidenceHome:home}),dir=path.join(home,'evidence-packages');
 for(const isCurrent of [()=>false,()=>Promise.resolve(true),()=>{throw Error('synthetic_guard');}]){await assert.rejects(store.save(pkg(),{isCurrent}));assert.deepEqual(await fs.readdir(dir),[]);}
 await assert.rejects(store.save(pkg(),{isCurrent:()=>{mkdirSync(path.join(home,'.git'));return true;}}),/home_inside_repository/);assert.deepEqual(await fs.readdir(dir),[]);
});
test('shared package destination retains publication-unconfirmed durability reporting',async t=>{
 const {home}=await fixture(t),store=await createEvidencePackageStore({evidenceHome:home}),directory=path.join(home,'evidence-packages'),value=pkg(),original=fs.open.bind(fs);
 t.mock.method(fs,'open',async (...args)=>{if(args[0]===directory)throw Error('synthetic_sync_denial');return original(...args);});
 let error;try{await store.save(value);}catch(e){error=e;}
 assert.equal(error?.message,'evidence_publication_unconfirmed');assert.equal(error.package_id,value.package_id);assert.deepEqual(JSON.parse(await fs.readFile(error.published_path,'utf8')),value);assert.deepEqual((await fs.readdir(directory)).filter(f=>f.endsWith('.tmp')),[]);
});
test('ambiguous home and legacy repository selectors are refused',async()=>{await assert.rejects(createEvidencePackageStore({evidenceHome:'/saved',repositoryRoot:'/repo'}),/destination_ambiguous/);});
