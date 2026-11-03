import path from'node:path';import{fileURLToPath}from'node:url';import{assertJudgePlatform,assertJudgeNode,judgePlatformMessage}from'../src/judge-platform.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let privateAccess,app,requestedPort;
const controller=new AbortController(),abort=()=>controller.abort();
// Do not exit midway through setup: let each owned async operation settle, then
// close its resources in finally, even if interruption arrives before listen.
process.on('SIGINT',abort);process.on('SIGTERM',abort);process.on('SIGHUP',abort);
const check=()=>{if(controller.signal.aborted)throw Error('judge_cancelled');};
// Let the OS reserve the actual socket. A separate availability probe would
// race another launcher, and must never attach to or stop an existing service.
function listen(server,port){return new Promise((resolve,reject)=>{
 const cleanup=()=>{server.off('listening',ready);server.off('error',failed);};
 const ready=()=>{cleanup();resolve();},failed=error=>{cleanup();reject(error);};
 server.once('listening',ready);server.once('error',failed);
 try{server.listen(port,'127.0.0.1');}catch(error){failed(error);}
});}
try{
 assertJudgePlatform();
 assertJudgeNode();
 const {readJudgeAccess,prepareJudgeAccess,judgeArguments}=await import('../src/judge-access.mjs');
 const options=judgeArguments(process.argv.slice(2)),port=options.port??8930;
 requestedPort=port;
 if(options.consent){
  const access=options.access??path.join(root,'judge-access/temporary-credentials.json');
  // Only explicit consent enables the fixed public demo-access bootstrap.
  // A supplied access path is authoritative and must never fall back.
  if(options.access===null){const {ensurePublicJudgeAccess}=await import('../src/judge-public-access.mjs');await ensurePublicJudgeAccess({destination:access,signal:controller.signal});check();}
  const bundle=await readJudgeAccess(access,{purpose:'start'});check();privateAccess=await prepareJudgeAccess(bundle,{repoRoot:root});check();
 }
 const {buildStructuredLauncher,canonicalWorkspaceEnvironment}=await import('../structured-live.mjs'),{prepareCodingTaskProfiles}=await import('../src/coding-task-profiles.mjs');
 check();const environment=canonicalWorkspaceEnvironment({...process.env,...privateAccess?.environment,A2_MUSE_PRESENCE_SOURCE:'textbox',A2_MUSE_OP_LIVE:options.consent?'1':'0',A2_MUSE_CAPTURE_AUTHORIZED:options.consent?'1':'0'});
 const taskProfiles=await prepareCodingTaskProfiles({sourceRoot:root,localRoot:path.join(root,'.local'),environment});check();app=await buildStructuredLauncher({environment,taskProfiles,keepWorkspaceOpen:true,presentationGuidance:true,presentationVersion:3});check();
 let alternativePort=false;
 try{await listen(app.server,port);}catch(error){
  if(error.code!=='EADDRINUSE'||options.port!==null)throw error;
  check();await listen(app.server,0);alternativePort=true;
 }
 check();app.reconcile();
 if(alternativePort)console.log('Port 8930 is busy. Started a new workspace on an available port; the existing service is still running. Use the Judge workspace URL below.');
 console.log('Judge workspace: http://127.0.0.1:'+app.server.address().port+'/');console.log('Judge checkout: '+root);console.log('Open the printed URL in Chrome or Firefox. Keep this terminal open.');console.log(options.consent?'Live textbox Presence enabled by your explicit typing-metadata consent.':'Live Presence is off. Restart with --consent-typing after reading docs/JUDGE-QUICKSTART.md.');console.log('Open sessions starts no model turn. Send uses your own Muse entitlement. Ctrl-C closes this workspace.');
 await new Promise(resolve=>{if(controller.signal.aborted)resolve();else controller.signal.addEventListener('abort',resolve,{once:true});});
}catch(e){if(e.message!=='judge_cancelled'){console.error(judgePlatformMessage(e)??(e.code==='EADDRINUSE'?'Port '+requestedPort+' is already in use. Stop the earlier workspace from its original terminal, or rerun with --port 0 for an available port. Use the new printed URL; existing sessions stay with the earlier workspace.':/^judge_[a-z0-9_]+$/.test(e.message)?e.message:'judge_start_failed_see_docs'));process.exitCode=1;}}
finally{let failed=false;try{await app?.close();}catch{failed=true;}try{await privateAccess?.cleanup();}catch{failed=true;}process.off('SIGINT',abort);process.off('SIGTERM',abort);process.off('SIGHUP',abort);if(failed){console.error('judge_cleanup_unconfirmed');process.exitCode=1;}}
