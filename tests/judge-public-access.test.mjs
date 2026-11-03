import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {ensurePublicJudgeAccess,ensurePinnedJudgeAccess} from '../src/judge-public-access.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const source='https://raw.githubusercontent.com/teresa-area2/a2-presence-muse-hackathon/44be3b148654f5e9eb2bedca7746b5c9be91da2e/judge-access/temporary-credentials.json';
const bundle=()=>({schema_version:1,purpose:'hackathon-judge-evaluation',open_presence:{environment:'production',client_id:'synthetic-demo-client',client_secret:'synthetic-demo-secret',expires_on:'2099-11-15'}});
const encode=value=>Buffer.from(JSON.stringify(value)+'\n');
const body=()=>encode(bundle());
async function fixture(t){const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'judge-public-test-'))),directory=path.join(root,'judge-access');await fs.mkdir(path.join(root,'.git'),{mode:0o700});await fs.mkdir(directory,{mode:0o700});t.after(()=>fs.rm(root,{recursive:true,force:true}));return{root,directory,destination:path.join(directory,'temporary-credentials.json')};}
const core=(destination,bytes,extra={})=>ensurePinnedJudgeAccess({destination,expectedSha256:sha(bytes),fetcher:async()=>new Response(bytes,{status:200}),...extra});
async function clean(directory){assert.deepEqual(await fs.readdir(directory),[]);}

test('missing default is fetched only from pinned HTTPS source, bounded and unauthenticated, then saved privately',async t=>{
 const f=await fixture(t),bytes=body();let seen;
 const result=await core(f.destination,bytes,{fetcher:async(url,options)=>{seen={url,options};return new Response(bytes,{status:200,headers:{'content-length':String(bytes.length)}});}});
 assert.equal(result,f.destination);assert.equal(seen.url,source);assert.equal(seen.options.redirect,'error');assert.equal(seen.options.credentials,'omit');assert.equal(seen.options.cache,'no-store');assert.equal(seen.options.method,'GET');assert.equal(seen.options.referrerPolicy,'no-referrer');assert.equal(seen.options.headers,undefined);assert.ok(seen.options.signal instanceof AbortSignal);
 assert.deepEqual(await fs.readFile(f.destination),bytes);assert.equal((await fs.stat(f.destination)).mode&0o777,0o600);assert.deepEqual(await fs.readdir(f.directory),['temporary-credentials.json']);
});
test('safe existing OP-only user file is preserved byte-for-byte without a download',async t=>{
 const f=await fixture(t),bytes=body();await fs.writeFile(f.destination,bytes,{mode:0o600});let calls=0;
 assert.equal(await ensurePublicJudgeAccess({destination:f.destination,fetcher:async()=>{calls++;throw Error('not called');}}),f.destination);assert.equal(calls,0);assert.deepEqual(await fs.readFile(f.destination),bytes);
});
test('production pin cannot be replaced by test digest or alternate remote configuration',async t=>{
 const f=await fixture(t),bytes=body();let url;
 await assert.rejects(ensurePublicJudgeAccess({destination:f.destination,expectedSha256:sha(bytes),sourceURL:'https://unexpected.invalid/',fetcher:async received=>{url=received;return new Response(bytes,{status:200});}}),/judge_public_access_integrity_failed/);assert.equal(url,source);await clean(f.directory);
});
test('hash mismatch never creates a destination or temporary file',async t=>{const f=await fixture(t);await assert.rejects(core(f.destination,body(),{expectedSha256:'0'.repeat(64)}),/integrity_failed/);await clean(f.directory);});
test('malformed JSON, foreign fields, npm access and invalid OP access are refused after hash verification',async t=>{
 for(const value of ['not json',JSON.stringify({...bundle(),cipher:{registry:'https://registry.npmjs.org/',token:'npm_synthetic',expires_at:'2099-01-01T00:00:00Z'}}),JSON.stringify({...bundle(),extra:'untrusted'}),JSON.stringify({...bundle(),open_presence:{...bundle().open_presence,client_id:'invalid:client'}})]){
  const f=await fixture(t),bytes=Buffer.from(value);await assert.rejects(core(f.destination,bytes),/^Error: judge_(?:public_access_bundle_invalid|op_access_invalid)$/);await clean(f.directory);
 }
});
test('expired access is rejected using normal judge cutoff',async t=>{const f=await fixture(t),b=bundle();b.open_presence.expires_on='2020-01-01';await assert.rejects(core(f.destination,encode(b)),/judge_op_access_expired/);await clean(f.directory);});
test('non200 and redirects never publish data or follow another URL',async t=>{
 for(const response of [new Response(body(),{status:404}),new Response(null,{status:302,headers:{location:'https://unexpected.invalid/'}}),{status:200,redirected:true,body:new Response(body()).body},{status:200,url:'https://unexpected.invalid/',body:new Response(body()).body}]){
  const f=await fixture(t);await assert.rejects(core(f.destination,body(),{fetcher:async()=>response}),/download_failed/);await clean(f.directory);
 }
});
test('declared or streamed oversized bodies are bounded and leave no file',async t=>{
 const oversized=Buffer.alloc(16385,32);
 for(const response of [new Response(body(),{headers:{'content-length':'16385'}}),new Response(oversized),new Response(body(),{headers:{'content-length':'not-a-number'}})]){
  const f=await fixture(t);await assert.rejects(core(f.destination,body(),{fetcher:async()=>response}),/download_failed/);await clean(f.directory);
 }
});
test('network errors are sanitized without leaking upstream diagnostics',async t=>{
 const f=await fixture(t);await assert.rejects(core(f.destination,body(),{fetcher:async()=>{throw Error('SYNTHETIC_PRIVATE_DIAGNOSTIC');}}),e=>e.message==='judge_public_access_download_failed');await clean(f.directory);
});
test('pre-abort makes no fetch and a hung fetch observes cancellation with no write',async t=>{
 const f=await fixture(t),pre=new AbortController();pre.abort();let calls=0;await assert.rejects(core(f.destination,body(),{signal:pre.signal,fetcher:async()=>{calls++;}}),/judge_cancelled/);assert.equal(calls,0);
 const controller=new AbortController();let start;const began=new Promise(r=>start=r),pending=core(f.destination,body(),{signal:controller.signal,fetcher:async()=>{start();return new Promise(()=>{});}});await began;controller.abort();await assert.rejects(pending,/judge_cancelled/);await clean(f.directory);
});
test('timeout bounds a fetcher that ignores AbortSignal',async t=>{
 const f=await fixture(t);await assert.rejects(core(f.destination,body(),{timeoutMs:10,fetcher:async()=>new Promise(()=>{})}),/judge_public_access_timeout/);await clean(f.directory);
});
test('abort during streaming cancels the pending read without publishing',async t=>{
 const f=await fixture(t),controller=new AbortController();let start;const began=new Promise(r=>start=r);
 const response=new Response(new ReadableStream({pull(){start();return new Promise(()=>{});}}));const pending=core(f.destination,body(),{signal:controller.signal,fetcher:async()=>response});await began;controller.abort();await assert.rejects(pending,/judge_cancelled/);await clean(f.directory);
});
test('symlinked destination and permissive existing access are refused unchanged',async t=>{
 const f=await fixture(t),outside=path.join(f.root,'outside');await fs.writeFile(outside,body(),{mode:0o600});await fs.symlink(outside,f.destination);await assert.rejects(core(f.destination,body()),/destination_unsafe/);assert.deepEqual(await fs.readFile(outside),body());await fs.unlink(f.destination);await fs.writeFile(f.destination,body(),{mode:0o644});await fs.chmod(f.destination,0o644);await assert.rejects(core(f.destination,body()),/destination_unsafe/);assert.deepEqual(await fs.readFile(f.destination),body());
});
test('symlinked ancestor, missing folder and wrong destination names are refused before fetch',async t=>{
 const f=await fixture(t),link=path.join(f.root,'link');await fs.symlink(f.root,link);let calls=0;const fetcher=async()=>{calls++;return new Response(body());};
 for(const destination of [path.join(link,'judge-access/temporary-credentials.json'),path.join(f.root,'other/temporary-credentials.json'),path.join(f.directory,'different.json')])await assert.rejects(core(destination,body(),{fetcher}));assert.equal(calls,0);await clean(f.directory);
});
test('concurrent file creation is not overwritten and no owned temporary remains',async t=>{
 const f=await fixture(t),original=Buffer.from('user file created during download');await assert.rejects(core(f.destination,body(),{fetcher:async()=>{await fs.writeFile(f.destination,original,{mode:0o600,flag:'wx'});return new Response(body());}}),/destination_changed/);assert.deepEqual(await fs.readFile(f.destination),original);assert.deepEqual(await fs.readdir(f.directory),['temporary-credentials.json']);
});
test('replaced destination directory during fetch is refused without writes',async t=>{
 const f=await fixture(t);await assert.rejects(core(f.destination,body(),{fetcher:async()=>{await fs.rename(f.directory,f.directory+'-old');await fs.mkdir(f.directory,{mode:0o700});return new Response(body());}}),/destination_unsafe/);await clean(f.directory);await clean(f.directory+'-old');
});
test('atomic publication refuses a destination created after the final absence check',async t=>{
 const f=await fixture(t),original=Buffer.from('concurrent user file'),open=fs.open.bind(fs);
 t.mock.method(fs,'open',async (...args)=>{const handle=await open(...args);if(args[0].endsWith('.tmp')){const write=handle.writeFile.bind(handle);handle.writeFile=async bytes=>{await write(bytes);await fs.writeFile(f.destination,original,{mode:0o600,flag:'wx'});};}return handle;});
 await assert.rejects(core(f.destination,body()),/destination_changed/);assert.deepEqual(await fs.readFile(f.destination),original);assert.deepEqual(await fs.readdir(f.directory),['temporary-credentials.json']);
});
test('directory-sync failure distinguishes an existing private file from confirmed success',async t=>{
 const f=await fixture(t),open=fs.open.bind(fs);t.mock.method(fs,'open',async (...args)=>{if(args[0]===f.directory)throw Error('synthetic_directory_sync_failure');return open(...args);});
 await assert.rejects(core(f.destination,body()),/judge_public_access_save_unconfirmed/);assert.deepEqual(await fs.readFile(f.destination),body());assert.equal((await fs.stat(f.destination)).mode&0o777,0o600);assert.deepEqual(await fs.readdir(f.directory),['temporary-credentials.json']);
});
