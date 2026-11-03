// Trusted, per-user evidence storage. Neither browser input nor checkout paths
// select this directory. Existing evidence is never moved or deleted here.
import fs from 'node:fs/promises';
import {lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function absolute(value){
 if(typeof value!=='string'||!value||value.includes('\0')||!path.isAbsolute(value)||path.normalize(value)!==value||value!==path.parse(value).root&&value.endsWith(path.sep))throw Error('evidence_home_invalid');
 return value;
}
export function resolveEvidenceHome({environment=process.env,homeDirectory=os.homedir()}={}){
 if(Object.hasOwn(environment,'A2_MUSE_EVIDENCE_HOME'))return absolute(environment.A2_MUSE_EVIDENCE_HOME);
 return absolute(path.join(absolute(homeDirectory),'.local','share','a2-presence-muse','evidence'));
}
const exists=p=>{try{return lstatSync(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}};
function noRepository(directory){
 if(exists(path.join(directory,'.git'))||exists(path.join(directory,'HEAD'))&&exists(path.join(directory,'objects'))&&exists(path.join(directory,'refs')))throw Error('evidence_home_inside_repository');
}
function parts(directory){let cur=path.parse(directory).root;return directory.slice(cur.length).split(path.sep).filter(Boolean).map(part=>cur=path.join(cur,part));}
function directoryStat(directory,{privateMode=false}={}){
 const st=lstatSync(directory);
 if(st.isSymbolicLink()||!st.isDirectory()||privateMode&&((st.mode&0o077)||(process.getuid&&st.uid!==process.getuid())))throw Error('evidence_home_unsafe');
 noRepository(directory);return st;
}
export async function prepareEvidenceHome({evidenceHome=resolveEvidenceHome()}={}){
 const home=absolute(evidenceHome),runsDirectory=path.join(home,'evidence-runs'),packagesDirectory=path.join(home,'evidence-packages');
 const paths=parts(home);if(!paths.length)throw Error('evidence_home_invalid');
 // Validate each existing ancestor before creating the next child. Recursive
 // mkdir would follow a pre-existing symlink before it could be rejected.
 directoryStat(path.parse(home).root);
 for(const directory of paths){
  try{await fs.mkdir(directory,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
  directoryStat(directory,{privateMode:directory===home});
 }
 for(const directory of [runsDirectory,packagesDirectory]){
  try{await fs.mkdir(directory,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
  directoryStat(directory,{privateMode:true});
 }
 const pinned=[...paths,runsDirectory,packagesDirectory].map(directory=>({path:directory,...directoryStat(directory,{privateMode:directory===home||directory===runsDirectory||directory===packagesDirectory})}));
 const assertCurrent=()=>{
  try{
   directoryStat(path.parse(home).root);
   for(const pin of pinned){const st=directoryStat(pin.path,{privateMode:pin.path===home||pin.path===runsDirectory||pin.path===packagesDirectory});if(st.dev!==pin.dev||st.ino!==pin.ino||realpathSync(pin.path)!==pin.path)throw Error('evidence_home_unsafe');}
  }catch(e){if(e.message==='evidence_home_inside_repository')throw e;throw Error('evidence_home_unsafe');}
 };
 assertCurrent();return{home,runsDirectory,packagesDirectory,assertCurrent};
}
