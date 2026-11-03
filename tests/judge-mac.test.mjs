import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';

const expected={arm64:'293dcc6c2408da21562d135b0412525e381bb6fe150d688edb58fe850d0f3e13',x64:'52bc25dd026db7247c3c00439afdb83e95087248267f02d6c1a7250d1f896173'};
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
async function executable(file,body){await fs.writeFile(file,'#!/bin/sh\nset -eu\n'+body+'\n',{mode:0o700});}
async function fixture(t,{host='v25.0.0',arch='arm64',system='Darwin'}={}){
 const base=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'judge-mac-test-'))),root=path.join(base,'checkout with spaces'),bin=path.join(base,'tools');await fs.mkdir(root);await fs.mkdir(bin);await fs.mkdir(path.join(root,'scripts'));
 await fs.copyFile(new URL('../scripts/judge-mac.sh',import.meta.url),path.join(root,'scripts/judge-mac.sh'));
 const logs={exec:path.join(base,'node.args'),npm:path.join(base,'npm.args'),cwd:path.join(base,'cwd'),env:path.join(base,'path'),curl:path.join(base,'curl.args'),tar:path.join(base,'tar.args')};
 await executable(path.join(bin,'uname'),`case "$1" in -s) printf '%s\\n' ${quote(system)} ;; -m) printf '%s\\n' ${quote(arch)} ;; *) exit 2 ;; esac`);
 const nodeScript=version=>`if [ "\${1-}" = --version ]; then printf '%s\\n' ${quote(version)}; exit 0; fi\nprintf '%s\\n' "$@" > ${quote(logs.exec)}\npwd -P > ${quote(logs.cwd)}\nprintf '%s' "$PATH" > ${quote(logs.env)}`;
 const npmScript=`printf '%s\\n' "$@" > ${quote(logs.npm)}\npwd -P > ${quote(logs.cwd)}\nprintf '%s' "$PATH" > ${quote(logs.env)}`;
 await executable(path.join(bin,'node'),nodeScript(host));await executable(path.join(bin,'npm'),npmScript);
 await executable(path.join(bin,'curl'),`printf '%s\\n' "$@" > ${quote(logs.curl)}\nexit 7`);
 const env={...process.env,PATH:bin+':/usr/bin:/bin:/usr/sbin:/sbin'};t.after(()=>fs.rm(base,{recursive:true,force:true}));
 const runtime=path.join(root,'.local','judge-node-22.12.0-'+(arch==='x86_64'?'x64':arch));
 const seed=async()=>{await fs.mkdir(path.join(runtime,'bin'),{recursive:true,mode:0o700});await fs.chmod(path.join(root,'.local'),0o700);await fs.chmod(runtime,0o700);await executable(path.join(runtime,'bin/node'),nodeScript('v22.12.0'));await executable(path.join(runtime,'bin/npm'),npmScript);await fs.writeFile(path.join(runtime,'.verified-sha256'),expected[arch==='x86_64'?'x64':arch]+'\n',{mode:0o600});};
 return{base,root,bin,env,logs,runtime,seed,nodeScript,npmScript,script:path.join(root,'scripts/judge-mac.sh')};
}
function run(f,args,{cwd=f.base}={}){
 const child=spawn('/bin/sh',[f.script,...args],{cwd,env:f.env,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
 return{child,done:new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal,out,err}));})};
}
async function absent(p){await assert.rejects(fs.stat(p),{code:'ENOENT'});}
async function downloadedFixture(f,{checksum=true,slow=false}={}){
 const arch=f.runtime.endsWith('-x64')?'x64':'arm64',bundle='node-v22.12.0-darwin-'+arch;
 await executable(path.join(f.bin,'curl'),`printf '%s\\n' "$@" > ${quote(f.logs.curl)}\n${slow?`trap 'printf stopped > ${quote(path.join(f.base,'curl.stopped'))}; exit 143' 1 2 15\nprintf started > ${quote(path.join(f.base,'curl.started'))}\nwhile :; do sleep 0.05; done`:`while [ "$#" -gt 0 ]; do if [ "$1" = --output ]; then output=$2; shift 2; else shift; fi; done\nprintf synthetic-archive > "$output"`}`);
 await executable(path.join(f.bin,'shasum'),`printf '%s  archive\\n' ${quote(checksum?expected[arch]:'0'.repeat(64))}`);
 // Download tests stub checksum/tar and never contact a network or execute a
 // real downloaded runtime. Coordinator separately qualifies official bytes.
 const template=path.join(f.base,'downloaded-node-template'),npmTemplate=path.join(f.base,'downloaded-npm-template');await executable(template,f.nodeScript('v22.12.0'));await executable(npmTemplate,f.npmScript);
 await executable(path.join(f.bin,'tar'),`printf '%s\\n' "$@" >> ${quote(f.logs.tar)}\nif [ "$1" = -tzf ]; then printf '%s\\n' ${quote(bundle+'/')} ${quote(bundle+'/bin/node')}; exit 0; fi\n[ "$1" = -xzf ] && [ "$3" = -C ]\nmkdir -p "$4/${bundle}/bin"\ncp ${quote(template)} "$4/${bundle}/bin/node"\ncp ${quote(npmTemplate)} "$4/${bundle}/bin/npm"`);
}

for(const host of ['v22.12.0','v22.21.0','v24.1.0','v24.10.0'])test('supported host '+host+' is reused without download or local provisioning',async t=>{
 const f=await fixture(t,{host}),before=await fs.readFile(path.join(f.bin,'node')),result=await run(f,['install']).done;
 assert.equal(result.code,0,result.err);assert.match(result.out,/global Node is unchanged/);assert.equal(await fs.readFile(f.logs.npm,'utf8'),'run\njudge:install\n');await absent(f.logs.curl);await absent(path.join(f.root,'.local'));assert.deepEqual(await fs.readFile(path.join(f.bin,'node')),before);assert.equal(await fs.readFile(f.logs.cwd,'utf8'),f.root+'\n');assert.equal((await fs.readFile(f.logs.env,'utf8')).split(':')[0],f.bin);
});
for(const host of ['v22.11.0','v23.5.0','v24.0.0','v25.0.0','missing','v24.1.0-rc.1','v24.1','v24.1.0-junk'])test('unsupported host '+host+' selects known private22 and forwards exact start flags',async t=>{
 const f=await fixture(t,{host:host==='missing'?'not-a-node-version':host});await f.seed();const before=await fs.readFile(path.join(f.bin,'node')),result=await run(f,['start','--port','0','--consent-typing']).done;
 assert.equal(result.code,0,result.err);assert.equal(await fs.readFile(f.logs.exec,'utf8'),'--experimental-strip-types\n'+path.join(f.root,'scripts/judge-start.mjs')+'\n--port\n0\n--consent-typing\n');assert.equal((await fs.readFile(f.logs.env,'utf8')).split(':')[0],path.join(f.runtime,'bin'));await absent(f.logs.curl);await absent(f.logs.npm);assert.deepEqual(await fs.readFile(path.join(f.bin,'node')),before);
});
test('verified synthetic download installs atomically for reuse without global changes',async t=>{
 const f=await fixture(t);await downloadedFixture(f);const before=await fs.readFile(path.join(f.bin,'node')),result=await run(f,['install']).done;assert.equal(result.code,0,result.err);
 const args=await fs.readFile(f.logs.curl,'utf8');assert.ok(args.startsWith('--disable\n'));assert.ok(args.includes('https://nodejs.org/dist/v22.12.0/node-v22.12.0-darwin-arm64.tar.gz'));assert.match(args,/--proto\n=https/);assert.match(args,/--max-time\n120/);assert.equal((await fs.stat(f.runtime)).mode&0o777,0o700);assert.equal(await fs.readFile(path.join(f.runtime,'.verified-sha256'),'utf8'),expected.arm64+'\n');assert.deepEqual(await fs.readdir(path.join(f.root,'.local')),['judge-node-22.12.0-arm64']);assert.deepEqual(await fs.readFile(path.join(f.bin,'node')),before);
 await fs.unlink(f.logs.curl);assert.equal((await run(f,['start']).done).code,0);await absent(f.logs.curl);
});
test('x64 selects its own fixed archive and checksum',async t=>{
 const f=await fixture(t,{arch:'x86_64'});await downloadedFixture(f);const result=await run(f,['install']).done;assert.equal(result.code,0,result.err);assert.match(await fs.readFile(f.logs.curl,'utf8'),/node-v22\.12\.0-darwin-x64\.tar\.gz/);assert.equal(await fs.readFile(path.join(f.runtime,'.verified-sha256'),'utf8'),expected.x64+'\n');
});
test('checksum failure never inspects extracts or executes downloaded content and cleans owned files',async t=>{
 const f=await fixture(t);await downloadedFixture(f,{checksum:false});const result=await run(f,['install']).done;assert.equal(result.code,1);assert.match(result.err,/checksum did not match/);await absent(f.logs.tar);await absent(f.logs.npm);await absent(f.logs.exec);await absent(f.runtime);assert.deepEqual(await fs.readdir(path.join(f.root,'.local')),[]);
});
test('download failure leaves no private lock or temporary runtime',async t=>{
 const f=await fixture(t),result=await run(f,['install']).done;assert.equal(result.code,1);assert.match(result.err,/Node download failed/);await absent(f.runtime);assert.deepEqual(await fs.readdir(path.join(f.root,'.local')),[]);
});
test('failed archive inspection never proceeds to extraction or execution',async t=>{
 const f=await fixture(t);await downloadedFixture(f);await executable(path.join(f.bin,'tar'),`printf '%s\\n' "$@" >> ${quote(f.logs.tar)}\n[ "\${TAR_OPTIONS-}" = '' ]\nexit 4`);f.env.TAR_OPTIONS='--unsafe-synthetic-option';const result=await run(f,['install']).done;assert.equal(result.code,1);assert.match(result.err,/archive could not be inspected/);assert.ok((await fs.readFile(f.logs.tar,'utf8')).startsWith('-tzf\n'));assert.ok(!(await fs.readFile(f.logs.tar,'utf8')).includes('-xzf'));await absent(f.logs.npm);await absent(f.logs.exec);await absent(f.runtime);assert.deepEqual(await fs.readdir(path.join(f.root,'.local')),[]);
});
test('unsafe cache or symlinked local destination is refused without deleting existing data',async t=>{
 const f=await fixture(t);await f.seed();await fs.chmod(f.runtime,0o755);const marker=path.join(f.runtime,'keep');await fs.writeFile(marker,'preserve');let result=await run(f,['start']).done;assert.equal(result.code,1);assert.match(result.err,/cache is incomplete or unsafe/);assert.equal(await fs.readFile(marker,'utf8'),'preserve');assert.equal((await fs.stat(f.runtime)).mode&0o777,0o755);await absent(f.logs.curl);
 const other=await fixture(t),foreign=path.join(other.base,'foreign');await fs.mkdir(foreign);await fs.symlink(foreign,path.join(other.root,'.local'));result=await run(other,['install']).done;assert.equal(result.code,1);assert.match(result.err,/not a safe private directory/);assert.deepEqual(await fs.readdir(foreign),[]);await absent(other.logs.curl);
});
test('invalid arguments fail before provisioning and preserve the caller environment',async t=>{
 const f=await fixture(t),original=process.env.PATH;for(const args of [[],['install','--port','0'],['start','--port'],['start','--port','65536'],['start','--port','-1'],['start','--port','x'],['start','--port','1','--port','2'],['start','--consent-typing','--consent-typing'],['start','--access','private.json'],['start','--url','https://unexpected.invalid/']]){
  const result=await run(f,args).done;assert.equal(result.code,2,JSON.stringify(args));assert.match(result.err,/Use:/);
 }await absent(f.logs.curl);await absent(path.join(f.root,'.local'));assert.equal(process.env.PATH,original);
});
test('nonMac systems are rejected without provisioning',async t=>{
 const f=await fixture(t,{system:'Linux'}),result=await run(f,['install']).done;assert.equal(result.code,1);assert.match(result.err,/helper is for macOS/);await absent(f.logs.curl);await absent(path.join(f.root,'.local'));
});
test('termination stops owned download and cleans only its owned private folders',async t=>{
 const f=await fixture(t);await downloadedFixture(f,{slow:true});const process=run(f,['install']);t.after(()=>process.child.kill('SIGTERM'));
 const until=Date.now()+3000;while(Date.now()<until){try{await fs.stat(path.join(f.base,'curl.started'));break;}catch{await new Promise(r=>setTimeout(r,10));}}
 await fs.stat(path.join(f.base,'curl.started'));process.child.kill('SIGTERM');const result=await process.done;assert.equal(result.code,130);assert.equal(await fs.readFile(path.join(f.base,'curl.stopped'),'utf8'),'stopped');assert.deepEqual(await fs.readdir(path.join(f.root,'.local')),[]);await absent(f.runtime);
});
