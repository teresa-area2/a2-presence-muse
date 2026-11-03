// Downloads only the owner's already-public, fixed historical OP demo bundle.
// Call after typing consent, for the missing implicit default only. This does
// not contact OP, create a Muse session or supply a Muse/npm credential.
import fs from 'node:fs/promises';
import {constants,lstatSync,realpathSync,linkSync} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {parseJudgeAccess,readJudgeAccess} from './judge-access.mjs';

const SOURCE='https://raw.githubusercontent.com/teresa-area2/a2-presence-muse-hackathon/44be3b148654f5e9eb2bedca7746b5c9be91da2e/judge-access/temporary-credentials.json';
const EXPECTED_SHA256='3249788c906d90b9ffbf71de2ba92a9b2992bff82845c1cb49f7724e382d30ee';
const MAX_BYTES=16384,TIMEOUT_MS=10000;
const fail=message=>{throw Error(message);};
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino;
const owner=st=>!process.getuid||st.uid===process.getuid();
function stat(p){try{return lstatSync(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function safeDirectory(p,{owned=false}={}){const st=lstatSync(p);if(st.isSymbolicLink()||!st.isDirectory()||owned&&(!owner(st)||(st.mode&0o022)))fail('judge_public_access_destination_unsafe');return st;}
function destinationPins(destination){
 if(typeof destination!=='string'||!path.isAbsolute(destination)||path.normalize(destination)!==destination||destination.includes('\0')||path.basename(destination)!=='temporary-credentials.json')fail('judge_public_access_destination_invalid');
 const directory=path.dirname(destination),repository=path.dirname(directory);if(path.basename(directory)!=='judge-access')fail('judge_public_access_destination_invalid');
 let current=path.parse(directory).root;const pins=[];
 for(const part of directory.split(path.sep).filter(Boolean)){current=path.join(current,part);const st=safeDirectory(current,{owned:current===repository||current===directory});pins.push({path:current,dev:st.dev,ino:st.ino});}
 if(realpathSync(directory)!==directory)fail('judge_public_access_destination_unsafe');
 const git=path.join(repository,'.git'),metadata=lstatSync(git);if(metadata.isSymbolicLink()||!(metadata.isDirectory()||metadata.isFile())||!owner(metadata))fail('judge_public_access_destination_unsafe');
 const checked=()=>{for(const pin of pins){const st=safeDirectory(pin.path,{owned:pin.path===repository||pin.path===directory});if(!same(st,pin))fail('judge_public_access_destination_unsafe');}const current=stat(git);if(!current||current.isSymbolicLink()||!same(current,metadata)||!owner(current))fail('judge_public_access_destination_unsafe');if(realpathSync(directory)!==directory)fail('judge_public_access_destination_unsafe');};
 checked();return{directory,pins,checked};
}
function opOnly(value,now){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='open_presence,purpose,schema_version')fail('judge_public_access_bundle_invalid');
 parseJudgeAccess(value,{purpose:'start',now});
}
async function existing(destination,checked,now){
 const st=stat(destination);if(!st)return false;
 if(st.isSymbolicLink()||!st.isFile()||!owner(st)||(st.mode&0o077)||st.size>MAX_BYTES)fail('judge_public_access_destination_unsafe');
 const bundle=await readJudgeAccess(destination,{purpose:'start',now});if(bundle.cipher!==null)fail('judge_public_access_bundle_invalid');checked();
 const after=stat(destination);if(!after||!same(after,st)||after.size!==st.size||after.mtimeMs!==st.mtimeMs||after.isSymbolicLink()||(after.mode&0o077)||!owner(after))fail('judge_public_access_destination_unsafe');
 return true;
}

// Testable core: tests supply synthetic bytes and their digest, never real
// credentials. SOURCE remains fixed even here; production pins below cannot be
// changed by environment, a browser request or caller-supplied extra options.
export async function ensurePinnedJudgeAccess({destination,fetcher=globalThis.fetch,signal,expectedSha256,now=()=>Date.now(),timeoutMs=TIMEOUT_MS}={}){
 if(typeof fetcher!=='function'||!/^[a-f0-9]{64}$/.test(expectedSha256??'')||typeof now!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>TIMEOUT_MS)fail('judge_public_access_arguments_invalid');
 const controller=new AbortController();let timedOut=false,timer,temporary,handle,reader,published=false;
 const abort=()=>controller.abort();if(signal){if(typeof signal.addEventListener!=='function'||typeof signal.aborted!=='boolean')fail('judge_public_access_arguments_invalid');if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});}
 const cancelled=()=>{if(controller.signal.aborted)fail(timedOut?'judge_public_access_timeout':'judge_cancelled');};
 const aborted=new Promise((_,reject)=>{controller.signal.addEventListener('abort',()=>reject(Error(timedOut?'judge_public_access_timeout':'judge_cancelled')),{once:true});});
 // The abort promise is also observed when cancellation precedes a fetch/read.
 aborted.catch(()=>{});
 try{
  cancelled();const {directory,pins,checked}=destinationPins(destination);
  if(await existing(destination,checked,now())){cancelled();return destination;}
  timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  const response=await Promise.race([Promise.resolve().then(()=>fetcher(SOURCE,{method:'GET',redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal})),aborted]);cancelled();
  if(response?.status!==200||response.redirected===true||response.url&&response.url!==SOURCE)fail('judge_public_access_download_failed');
  const length=response.headers?.get?.('content-length');if(length!==null&&length!==undefined&&(!/^\d+$/.test(length)||Number(length)>MAX_BYTES))fail('judge_public_access_download_failed');
  reader=response.body?.getReader?.();if(!reader)fail('judge_public_access_download_failed');const chunks=[];let size=0;
  for(;;){const part=await Promise.race([reader.read(),aborted]);cancelled();if(part.done)break;if(!(part.value instanceof Uint8Array)||part.value.byteLength===0)fail('judge_public_access_download_failed');size+=part.value.byteLength;if(size>MAX_BYTES)fail('judge_public_access_download_failed');chunks.push(Buffer.from(part.value));}
  const bytes=Buffer.concat(chunks);if(createHash('sha256').update(bytes).digest('hex')!==expectedSha256)fail('judge_public_access_integrity_failed');
  let value;try{value=JSON.parse(bytes.toString('utf8'));}catch{fail('judge_public_access_bundle_invalid');}opOnly(value,now());cancelled();checked();
  if(stat(destination))fail('judge_public_access_destination_changed');
  temporary=path.join(directory,'.temporary-credentials.'+randomUUID()+'.tmp');handle=await fs.open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await handle.writeFile(bytes);await handle.sync();await handle.close();handle=null;
  cancelled();checked();try{linkSync(temporary,destination);published=true;}catch(e){if(e.code==='EEXIST')fail('judge_public_access_destination_changed');throw e;}
  try{await fs.unlink(temporary);temporary=null;const dir=await fs.open(directory,constants.O_RDONLY|constants.O_NOFOLLOW);try{if(!same(await dir.stat(),pins.at(-1)))fail('judge_public_access_destination_unsafe');await dir.sync();}finally{await dir.close();}}
  catch{fail('judge_public_access_save_unconfirmed');}
  return destination;
 }catch(e){
  if(controller.signal.aborted)fail(timedOut?'judge_public_access_timeout':'judge_cancelled');
  if(/^judge_[a-z_]+$/.test(e?.message??''))throw e;
  fail(published?'judge_public_access_save_unconfirmed':'judge_public_access_download_failed');
 }finally{
  clearTimeout(timer);signal?.removeEventListener?.('abort',abort);try{const cancelledReader=reader?.cancel();cancelledReader?.catch(()=>{});}catch{}
  await handle?.close().catch(()=>{});if(temporary)await fs.unlink(temporary).catch(e=>{if(e.code!=='ENOENT')fail(published?'judge_public_access_save_unconfirmed':'judge_public_access_cleanup_failed');});
 }
}
export async function ensurePublicJudgeAccess({destination,fetcher=globalThis.fetch,signal}={}){
 return ensurePinnedJudgeAccess({destination,fetcher,signal,expectedSha256:EXPECTED_SHA256});
}
