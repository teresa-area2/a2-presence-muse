// Read-only local requirements: versions and installed-browser metadata only.
// No login, auth-file read, install, service/model call, browser or socket.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {supportsJudgeNode} from './judge-platform.mjs';

const execute=promisify(execFile),TIMEOUT=5000;
const MUSE=new Set(['Muse Code 1.4.13 (1.4.13-R6996.1)','Muse Code 1.4.14 (1.4.14-R7309.1)']);
const clean=x=>typeof x==='string'&&x.length<=4096?x.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'').trim():'';
const FIXES={macos:'Use macOS for this judge journey; see the setup reference for Linux/WSL.',git:'Install Git, then repeat this check.',node:'Use Node 22.12+ (22.x) or 24.1+ (24.x), then repeat this check.',npm:'Use npm supplied with your supported Node installation, then repeat this check.',muse:'Use Muse Code 1.4.13/R6996.1 or 1.4.14/R7309.1; see the setup reference.',browser:'Install Google Chrome or Firefox in /Applications or ~/Applications.'};
function probeEnvironment(source,tool){
 const env={};for(const key of ['PATH','HOME','XDG_CONFIG_HOME','USER','LOGNAME','LANG','LC_ALL'])if(typeof source[key]==='string')env[key]=source[key];
 if(tool==='git')Object.assign(env,{GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:os.devNull});
 if(tool==='npm'){
  // npm11 refuses loading one file twice. These distinct random paths do not
  // exist and are never created; user/global token configs stay out of the probe.
  const empty=path.join(os.tmpdir(),'muse-requirements-'+randomUUID());
  Object.assign(env,{NPM_CONFIG_USERCONFIG:path.join(empty,'user.npmrc'),NPM_CONFIG_GLOBALCONFIG:path.join(empty,'global.npmrc'),NPM_CONFIG_OFFLINE:'true',NPM_CONFIG_UPDATE_NOTIFIER:'false',NPM_CONFIG_LOGS_MAX:'0',NPM_CONFIG_LOGLEVEL:'silent',NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false',NPM_CONFIG_IGNORE_SCRIPTS:'true',NO_UPDATE_NOTIFIER:'1'});
 }
 if(tool==='muse')env.MUSE_NO_AUTO_UPDATE='1';return env;
}
export async function checkJudgeRequirements({platform=process.platform,nodeVersion=process.version,environment=process.env,homeDirectory=os.homedir(),ops={}}={}){
 const runVersion=ops.runVersion??((command,args,options)=>execute(command,args,options)),stat=ops.stat??(p=>fs.stat(p));
 const probe=async(tool,parse)=>{
  try{const result=await runVersion(tool,['--version'],{encoding:'utf8',timeout:TIMEOUT,maxBuffer:4096,killSignal:'SIGTERM',cwd:path.parse(path.resolve('.')).root,env:probeEnvironment(environment,tool)});return parse(clean(result?.stdout));}catch{return null;}
 };
 const [git,npm,muse,browsers]=await Promise.all([
  probe('git',value=>/^git version (\d+\.\d+\.\d+)(?: \(Apple Git-\d+\))?$/.exec(value)?.[1]??null),
  probe('npm',value=>/^\d+\.\d+\.\d+$/.test(value)?value:null),
  probe('muse',value=>/^Muse Code \d+\.\d+\.\d+ \(\d+\.\d+\.\d+-R\d+\.\d+\)$/.test(value)?value:null),
  (async()=>{
   const roots=['/Applications',...(typeof homeDirectory==='string'&&path.isAbsolute(homeDirectory)?[path.join(homeDirectory,'Applications')]:[])],found=[];
   for(const [label,app,binary] of [['Chrome','Google Chrome.app','Google Chrome'],['Firefox','Firefox.app','firefox']]){
    for(const root of roots){try{if((await stat(path.join(root,app,'Contents/MacOS',binary))).isFile()){found.push(label);break;}}catch{}}
   }return found;
  })()
 ]);
 const node=supportsJudgeNode(nodeVersion)?String(nodeVersion).replace(/^v/,''):null;
 const row=(id,label,ok,version=null)=>({id,label,ok,version,fix:ok?null:FIXES[id]});
 const checks=[row('macos','macOS',platform==='darwin'),row('git','Git',git!==null,git),row('node','Node',node!==null,node),row('npm','npm',npm!==null,npm),row('muse','Muse Code',MUSE.has(muse),muse),row('browser','Browser',browsers.length>0,browsers.length?browsers.join(' / '):null)];
 return{ok:checks.every(r=>r.ok),checks,scope:'local_requirements_only',not_verified:['Muse login','account entitlement','billing or credits','model access','Presence connection','browser capture compatibility']};
}
export function formatJudgeRequirements(report){
 return report.checks.map(r=>(r.ok?'PASS ':'FAIL ')+(r.version?.startsWith(r.label+' ')?r.version:r.label+(r.version?' '+r.version:''))+(r.fix?'\n     Fix: '+r.fix:'')).join('\n')+'\n\n'+(report.ok?'Local requirements passed. Next: npm run judge:install.':'Fix the failed requirements, then run this check again.')+'\nINFO: Login, account/billing/model access and Presence are not verified by this check.\n';
}
export async function runJudgeRequirements({args=[],...options}={}){
 if(!Array.isArray(args)||args.length)return{exitCode:2,output:'Use: sh scripts/judge-requirements.sh (no flags).\n'};
 const report=await checkJudgeRequirements(options);return{exitCode:report.ok?0:1,output:formatJudgeRequirements(report),report};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await runJudgeRequirements({args:process.argv.slice(2)});process.stdout.write(result.output);process.exitCode=result.exitCode;
}
