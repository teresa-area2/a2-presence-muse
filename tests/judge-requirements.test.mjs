import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {checkJudgeRequirements,formatJudgeRequirements,runJudgeRequirements} from '../src/judge-requirements.mjs';

const reviewed='Muse Code 1.4.14 (1.4.14-R7309.1)',home='/fake-requirements-user';
const versionOutput={git:'git version 2.50.1 (Apple Git-155)\n',npm:'11.2.0\n',muse:reviewed+'\n'};
function fake({versions={},browser='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',errors={}}={}){
 const calls=[],stats=[];return{calls,stats,options:{platform:'darwin',nodeVersion:'24.1.0',homeDirectory:home,environment:{PATH:'/usr/bin',HOME:home},ops:{runVersion:async(command,args,options)=>{calls.push({command,args,options});if(errors[command])throw errors[command];return{stdout:Object.hasOwn(versions,command)?versions[command]:versionOutput[command]};},stat:async file=>{stats.push(file);if(file===browser)return{isFile:()=>true};throw Object.assign(Error('SYNTHETIC_PRIVATE_PATH'),{code:'ENOENT'});}}}};
}
test('passing local requirements check reports versions without claiming account or service admission',async()=>{
 const f=fake(),r=await checkJudgeRequirements(f.options);assert.equal(r.ok,true);assert.equal(r.checks.length,6);assert.equal(r.checks.find(x=>x.id==='muse').version,reviewed);assert.deepEqual(f.calls.map(c=>c.command).sort(),['git','muse','npm']);
 const out=formatJudgeRequirements(r);assert.equal((out.match(/^PASS /gm)??[]).length,6);assert.match(out,/account\/billing\/model access and Presence are not verified/);assert.ok(!out.includes(home));assert.ok(r.not_verified.includes('Muse login'));
});
test('version probes have fixed commands, bounded output/time and credential-free allowlisted environments',async()=>{
 const f=fake();f.options.environment={PATH:'/safe/bin',HOME:home,XDG_CONFIG_HOME:'/normal/config',META_API_KEY:'SECRET_META',NPM_TOKEN:'SECRET_NPM',NODE_OPTIONS:'SECRET_OPTIONS',NODE_PATH:'SECRET_MODULE',MUSE_API_KEY:'SECRET_MUSE',NPM_CONFIG_USERCONFIG:'/private/user.npmrc',GIT_SSH_COMMAND:'SECRET_SSH',HTTPS_PROXY:'SECRET_PROXY'};await checkJudgeRequirements(f.options);
 for(const c of f.calls){assert.deepEqual(c.args,['--version']);assert.equal(c.options.timeout,5000);assert.equal(c.options.maxBuffer,4096);assert.equal(c.options.cwd,path.parse(path.resolve('.')).root);assert.equal(c.options.env.HOME,home);assert.equal(c.options.env.PATH,'/safe/bin');for(const key of ['META_API_KEY','NPM_TOKEN','NODE_OPTIONS','NODE_PATH','MUSE_API_KEY','GIT_SSH_COMMAND','HTTPS_PROXY'])assert.equal(c.options.env[key],undefined);assert.ok(!JSON.stringify(c.options.env).includes('SECRET_'));}
 const npm=f.calls.find(c=>c.command==='npm').options.env;assert.notEqual(npm.NPM_CONFIG_USERCONFIG,npm.NPM_CONFIG_GLOBALCONFIG);assert.equal(path.dirname(npm.NPM_CONFIG_USERCONFIG),path.dirname(npm.NPM_CONFIG_GLOBALCONFIG));assert.ok(path.isAbsolute(npm.NPM_CONFIG_USERCONFIG));await assert.rejects(fs.stat(npm.NPM_CONFIG_USERCONFIG),{code:'ENOENT'});await assert.rejects(fs.stat(npm.NPM_CONFIG_GLOBALCONFIG),{code:'ENOENT'});assert.equal(npm.NPM_CONFIG_OFFLINE,'true');assert.equal(npm.NPM_CONFIG_UPDATE_NOTIFIER,'false');assert.equal(npm.NPM_CONFIG_LOGS_MAX,'0');assert.equal(npm.NPM_CONFIG_IGNORE_SCRIPTS,'true');assert.equal(f.calls.find(c=>c.command==='muse').options.env.MUSE_NO_AUTO_UPDATE,'1');
});
test('browser discovery reads only fixed installed-app executable metadata including user Applications',async()=>{
 const browser=home+'/Applications/Firefox.app/Contents/MacOS/firefox',f=fake({browser}),r=await checkJudgeRequirements(f.options);assert.equal(r.ok,true);assert.equal(r.checks.find(c=>c.id==='browser').version,'Firefox');assert.ok(f.stats.includes(browser));assert.ok(f.stats.every(p=>p.endsWith('/Contents/MacOS/Google Chrome')||p.endsWith('/Contents/MacOS/firefox')));assert.ok(!f.stats.some(p=>/auth|credentials|\.config|Info.plist/.test(p)));
});
test('absent browsers fail with an installation fix and never launch a browser',async()=>{
 const f=fake({browser:'not-installed'}),r=await checkJudgeRequirements(f.options);assert.equal(r.ok,false);const c=r.checks.find(c=>c.id==='browser');assert.equal(c.ok,false);assert.match(c.fix,/Install Google Chrome or Firefox/);assert.equal(f.calls.length,3);
});
for(const command of ['git','npm','muse'])test('missing or timed-out '+command+' fails with a safe concrete fix',async()=>{
 const f=fake({errors:{[command]:Object.assign(Error('SYNTHETIC_PRIVATE_DIAGNOSTIC_TOKEN'),{code:command==='npm'?'ETIMEDOUT':'ENOENT'})}}),r=await checkJudgeRequirements(f.options);assert.equal(r.ok,false);const c=r.checks.find(c=>c.id===command);assert.equal(c.ok,false);assert.ok(c.fix);assert.ok(!formatJudgeRequirements(r).includes('SYNTHETIC_PRIVATE'));
});
test('unreviewed Muse build is rejected with its sanitized version only',async()=>{
 const f=fake({versions:{muse:'Muse Code 1.4.15 (1.4.15-R8000.1)\n'}}),r=await checkJudgeRequirements(f.options);assert.equal(r.checks.find(c=>c.id==='muse').ok,false);assert.match(formatJudgeRequirements(r),/1\.4\.13\/R6996\.1 or 1\.4\.14\/R7309\.1/);
});
test('both reviewed Muse builds are accepted while unexpected output never leaks',async()=>{
 for(const muse of ['Muse Code 1.4.13 (1.4.13-R6996.1)','Muse Code 1.4.14 (1.4.14-R7309.1)']){const f=fake({versions:{muse}});assert.equal((await checkJudgeRequirements(f.options)).ok,true);}
 const f=fake({versions:{git:'git version 2.50.1\nPRIVATE_TOKEN',npm:'11.2.0\nPRIVATE_TOKEN',muse:reviewed+'\nPRIVATE_TOKEN'}}),r=await checkJudgeRequirements(f.options);assert.equal(r.ok,false);assert.ok(!formatJudgeRequirements(r).includes('PRIVATE_TOKEN'));assert.ok(r.checks.filter(c=>['git','npm','muse'].includes(c.id)).every(c=>c.version===null));
});
test('Node bands and macOS are required independently of tool presence',async()=>{
 for(const nodeVersion of ['22.12.0','v22.20.1','24.1.0','v24.10.0']){const f=fake();f.options.nodeVersion=nodeVersion;assert.equal((await checkJudgeRequirements(f.options)).ok,true);}
 for(const nodeVersion of ['22.11.0','24.0.0','23.1.0','25.0.0','24.1.0-rc.1']){const f=fake();f.options.nodeVersion=nodeVersion;const r=await checkJudgeRequirements(f.options);assert.equal(r.ok,false);assert.equal(r.checks.find(c=>c.id==='node').ok,false);}
 const f=fake();f.options.platform='linux';const r=await checkJudgeRequirements(f.options);assert.equal(r.ok,false);assert.equal(r.checks.find(c=>c.id==='macos').ok,false);
});
test('invalid flags are rejected before every injected probe',async()=>{
 let calls=0;const ops={runVersion:async()=>{calls++;throw Error('unexpected');},stat:async()=>{calls++;throw Error('unexpected');}};const r=await runJudgeRequirements({args:['--install'],ops});assert.equal(r.exitCode,2);assert.match(r.output,/no flags/);assert.equal(calls,0);
});
test('CLI runner exit status follows all local requirements',async()=>{
 assert.equal((await runJudgeRequirements(fake().options)).exitCode,0);assert.equal((await runJudgeRequirements(fake({browser:'absent'}).options)).exitCode,1);
});

const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
async function shellFixture(t,version){
 const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'judge-req-test-'))),bin=path.join(root,'tools'),repo=path.join(root,'repo with spaces');await fs.mkdir(bin);await fs.mkdir(repo);await fs.mkdir(path.join(repo,'scripts'));await fs.copyFile(new URL('../scripts/judge-requirements.sh',import.meta.url),path.join(repo,'scripts/judge-requirements.sh'));
 const marker=path.join(root,'probe-marker'),node=path.join(bin,'node');await fs.writeFile(node,`#!/bin/sh\nif [ "\${1-}" = --version ]; then\n [ -z "\${META_API_KEY-}\${NPM_TOKEN-}\${NODE_OPTIONS-}" ] || exit 9\n printf '%s\\n' ${quote(version)};exit 0;fi\n [ -z "\${META_API_KEY-}\${NPM_TOKEN-}\${NODE_OPTIONS-}" ] || exit 9\n printf '%s\\n' "$@" > ${quote(marker)}\n`,{mode:0o700});
 t.after(()=>fs.rm(root,{recursive:true,force:true}));return{root,repo,marker,env:{...process.env,PATH:bin+':/usr/bin:/bin',META_API_KEY:'SYNTHETIC_KEY',NPM_TOKEN:'SYNTHETIC_TOKEN',NODE_OPTIONS:'SYNTHETIC_OPTIONS'}};
}
async function shellRun(f,args=[]){const c=spawn('/bin/sh',[path.join(f.repo,'scripts/judge-requirements.sh'),...args],{cwd:f.root,env:f.env,stdio:['ignore','pipe','pipe']});let out='',err='';c.stdout.on('data',b=>out+=b);c.stderr.on('data',b=>err+=b);return new Promise((resolve,reject)=>{c.once('error',reject);c.once('close',code=>resolve({code,out,err}));});}
for(const version of ['v22.12.0','v24.1.0'])test('shell preflight accepts '+version+' and finds module from any working folder without inherited tokens',async t=>{
 const f=await shellFixture(t,version),r=await shellRun(f);assert.equal(r.code,0,r.err);assert.equal(await fs.readFile(f.marker,'utf8'),path.join(f.repo,'src/judge-requirements.mjs')+'\n');
});
for(const version of ['missing','v24.0.0','v24.1.0-rc.1','v24.1'])test('shell gives a clear Node fix for '+version+' without npm, stack or provisioning',async t=>{
 const f=await shellFixture(t,version),r=await shellRun(f);assert.equal(r.code,1);assert.match(r.err,/FAIL Node/);assert.match(r.err,/22\.12.*24\.1/);assert.ok(!/Error:|at file:|SYNTHETIC_/.test(r.err+r.out));await assert.rejects(fs.stat(f.marker),{code:'ENOENT'});assert.deepEqual((await fs.readdir(f.repo)).sort(),['scripts']);
});
test('shell invalid arguments never invoke even a valid Node',async t=>{
 const f=await shellFixture(t,'v24.1.0');const r=await shellRun(f,['--install']);assert.equal(r.code,2);assert.match(r.err,/no flags/);await assert.rejects(fs.stat(f.marker),{code:'ENOENT'});
});
test('a truly absent Node gives a clear shell failure without requiring npm or awk',async t=>{
 const f=await shellFixture(t,'v24.1.0');await fs.unlink(path.join(f.env.PATH.split(':')[0],'node'));f.env.PATH=f.env.PATH.split(':')[0];const r=await shellRun(f);assert.equal(r.code,1);assert.match(r.err,/FAIL Node/);assert.doesNotMatch(r.err,/command not found|Error:|at file:/);assert.ok(!r.err.includes(f.repo));await assert.rejects(fs.stat(f.marker),{code:'ENOENT'});
});
test('actual npm version accepts distinct nonexistent configs without creating those paths',async()=>{
 const f=fake(),execute=promisify(execFile);f.options.environment={PATH:path.dirname(process.execPath)+':/usr/bin:/bin',HOME:os.homedir()};let npmOptions;
 f.options.ops.runVersion=async(command,args,options)=>{if(command!=='npm')return{stdout:versionOutput[command]};npmOptions=options;return execute(command,args,options);};
 const r=await checkJudgeRequirements(f.options);assert.equal(r.checks.find(c=>c.id==='npm').ok,true);assert.notEqual(npmOptions.env.NPM_CONFIG_USERCONFIG,npmOptions.env.NPM_CONFIG_GLOBALCONFIG);await assert.rejects(fs.stat(path.dirname(npmOptions.env.NPM_CONFIG_USERCONFIG)),{code:'ENOENT'});
});
