import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {StructuredPair} from '../src/structured-pair.mjs';
import {MusePublicEvents} from '../vendor/agent-lab/core/muse-public-events.mjs';

// The reviewed Muse1.4.13/1.4.14 experimental MSP schemas define these as
// connection-wide notifications: SubscriptionUsage and AccountState, with no
// sessionId. They are not server requests or per-session tokenUsage records.
const usageChange=()=>({method:'usage/changed',params:{observedAtMs:1700000000000,tier:'synthetic-test-tier',window:{resetsAtMs:1700000300000,usedPercent:1,windowDurationMins:300},weekly:{resetsAtMs:1700600000000,usedPercent:2}}});
const accountChange=()=>({method:'account/changed',params:{credentialRequired:true,state:'accountLogin'}});
const permission=()=>({reviewerAuthority:'human',reviewerAttached:true,axes:{filesystem:'sandboxed',network:'restricted',approval:'onRequest',reviewer:'human'}});
const id=n=>`00000000-0000-7000-8000-${String(n).padStart(12,'0')}`;
function fixture(){
 let sequence=10;const stops=[],receipts=[],requests=[],sessions={};
 for(const [index,name]of ['without','with'].entries()){
  let turn=0;const client=new EventEmitter();
  Object.assign(client,{sessionId:id(index+1),startCommandId:id(index+3),closed:false,stopping:false,turnIds:new Set(),approvals:new Map(),receipt:value=>receipts.push({name,value}),request:async(method,p)=>{
   assert.equal(method,'turn/start');requests.push({name,text:p.input[0].text});
   return{status:'accepted',commandId:p.commandId,turnId:id(100+index*10+(++turn)),disposition:'started',startedNewTurn:true};
  },stop:async()=>{client.stopping=true;stops.push(name);}});
  sessions[name]={client,ledger:new MusePublicEvents({arm:name,sessionId:client.sessionId,evidenceMode:'fixture'}),usage:{observe(){},snapshot:()=>({status:'not_observed'})}};
 }
 const pair=new StructuredPair({sessions,makeId:()=>id(++sequence)});
 function complete(name,text){
  const client=sessions[name].client,turnId=client.activeTurnId,sourceRange={stream:{kind:'session',id:client.sessionId},first:{id:'event-'+turnId,sequence:1},last:{id:'event-'+turnId,sequence:1}};
  client.emit('notification',{method:'item/completed',params:{sessionId:client.sessionId,item:{itemId:'answer-'+turnId,turnId,revision:1,kind:'agentMessage',status:'completed',messagePhase:'finalAnswer',text},sourceRange}});
  client.emit('notification',{method:'turn/completed',params:{sessionId:client.sessionId,turnId,terminal:'completed',sourceRange,viewCursor:'cursor-'+turnId}});
 }
 async function firstAnswer(){assert.equal((await pair.submit('Read TASK.md and propose a plan.')).status,'started');for(const name of ['without','with'])complete(name,'First plan');assertReady();}
 function assertReady(){assert.equal(pair.snapshot().status,'ready');for(const name of ['without','with']){assert.equal(pair.snapshot().arms[name].status,'ready');assert.equal(pair.arms[name].ready(),true);}}
 return{pair,sessions,stops,receipts,requests,complete,firstAnswer,assertReady};
}

for(const makeEvent of [usageChange,accountChange])test(`${makeEvent().method} after the first answer preserves both sessions and a second completed turn`,async t=>{
 const f=fixture();t.after(()=>f.pair.stop());await f.firstAnswer();
 for(const name of ['without','with'])f.sessions[name].client.emit('notification',makeEvent());
 f.assertReady();assert.deepEqual(f.stops,[]);assert.deepEqual(f.receipts,[]);
 assert.equal((await f.pair.submit('Implement that plan and explain the checks.')).status,'started');
 for(const name of ['without','with'])f.complete(name,'Second answer');
 f.assertReady();assert.deepEqual(f.stops,[]);assert.deepEqual(f.requests.map(x=>x.text),['Read TASK.md and propose a plan.','Read TASK.md and propose a plan.','Implement that plan and explain the checks.','Implement that plan and explain the checks.']);
 for(const name of ['without','with'])assert.deepEqual(f.pair.snapshot().arms[name].messages.filter(m=>m.author==='Muse').map(m=>m.text),['First plan','Second answer']);
 assert.equal(JSON.stringify(f.pair.snapshot()).includes('synthetic-test-tier'),false,'account-level metadata is not projected as a task message or token total');
});

test('connection-wide updates during working and idle states do not change turn ownership',async t=>{
 const f=fixture();t.after(()=>f.pair.stop());assert.equal((await f.pair.submit('Review this task.')).status,'started');
 const turns=Object.fromEntries(['without','with'].map(n=>[n,f.sessions[n].client.activeTurnId]));
 for(const name of ['without','with']){for(const makeEvent of [usageChange,accountChange])f.sessions[name].client.emit('notification',makeEvent());assert.equal(f.pair.arms[name].activeTurn(),turns[name]);f.complete(name,'Reviewed');}
 f.assertReady();assert.deepEqual(f.stops,[]);assert.deepEqual(f.receipts,[]);
});

for(const makeEvent of [usageChange,accountChange])test(`a server request named ${makeEvent().method} is never silently acknowledged`,async()=>{
 const f=fixture();await f.firstAnswer();
 f.sessions.with.client.emit('request',{id:77,...makeEvent()});await f.pair.stop();
 assert.deepEqual(f.receipts,[]);assert.equal(f.pair.snapshot().status,'closed');assert.ok(f.pair.error);assert.deepEqual(f.stops.sort(),['with','without']);
});

for(const makeEvent of [usageChange,accountChange])test(`malformed ${makeEvent().method} does not bypass the scope boundary`,async()=>{
 const f=fixture();await f.firstAnswer();const event=makeEvent();
 delete event.params[event.method==='usage/changed'?'tier':'credentialRequired'];
 f.sessions.with.client.emit('notification',event);await f.pair.stop();
 assert.equal(f.pair.snapshot().status,'closed');assert.ok(f.pair.arms.with.error);assert.deepEqual(f.receipts,[]);assert.deepEqual(f.stops.sort(),['with','without']);
});

for(const makeEvent of [usageChange,accountChange])test(`${makeEvent().method} cannot conceal a foreign session claim`,async()=>{
 const f=fixture();await f.firstAnswer();const event=makeEvent();event.params.sessionId=id(999);
 f.sessions.with.client.emit('notification',event);await f.pair.stop();
 assert.equal(f.pair.snapshot().status,'closed');assert.equal(f.pair.arms.with.error,'foreign_session');assert.deepEqual(f.receipts,[]);assert.deepEqual(f.stops.sort(),['with','without']);
});

test('a true foreign session event still closes both sessions after a completed answer',async()=>{
 const f=fixture();await f.firstAnswer();
 f.sessions.with.client.emit('notification',{method:'session/statusChanged',params:{sessionId:id(999),status:'idle',viewCursor:'foreign',permissionState:permission()}});await f.pair.stop();
 assert.equal(f.pair.snapshot().status,'closed');assert.equal(f.pair.arms.with.error,'foreign_session');assert.deepEqual(f.stops.sort(),['with','without']);
});

test('a completion for a foreign turn still closes both sessions',async()=>{
 const f=fixture();await f.pair.submit('Read task.');
 f.sessions.with.client.emit('notification',{method:'turn/completed',params:{sessionId:f.sessions.with.client.sessionId,turnId:id(999),terminal:'completed',viewCursor:'wrong-turn',sourceRange:{stream:{kind:'session',id:'stream'},first:{id:'foreign',sequence:1},last:{id:'foreign',sequence:1}}}});await f.pair.stop();
 assert.equal(f.pair.snapshot().status,'closed');assert.ok(f.pair.arms.with.error);assert.deepEqual(f.stops.sort(),['with','without']);
});

test('an explicit unsafe permission change still closes both sessions after a completed answer',async()=>{
 const f=fixture();await f.firstAnswer();const unsafe=permission();unsafe.axes.filesystem='unrestricted';
 f.sessions.with.client.emit('notification',{method:'session/statusChanged',params:{sessionId:f.sessions.with.client.sessionId,status:'idle',viewCursor:'changed',permissionState:unsafe}});await f.pair.stop();
 assert.equal(f.pair.snapshot().status,'closed');assert.equal(f.pair.arms.with.error,'permission_drift');assert.deepEqual(f.stops.sort(),['with','without']);
});
