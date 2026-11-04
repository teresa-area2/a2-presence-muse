import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {MuseMsp} from '../vendor/agent-lab/core/muse-msp.mjs';
import {MusePublicEvents} from '../vendor/agent-lab/core/muse-public-events.mjs';
import {StructuredPair} from '../src/structured-pair.mjs';
import {SessionUsage} from '../src/session-usage.mjs';
import {mountSessionPane} from '../web/session-panes.mjs';

// Inert DOM and native JSONL transport: no process, model, OP call or live state.
class Node {
 constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this.events={};this._text='';this.scrollTop=0;this.scrollHeight=500;this.clientHeight=500;}
 set textContent(text){this._text=String(text);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const node of nodes)this.insertBefore(node,null);}
 insertBefore(node,before){if(node===before)return node;node.remove();const index=before===null?this.children.length:this.children.indexOf(before);assert.ok(index>=0);this.children.splice(index,0,node);node.parentNode=this;return node;}
 remove(){if(this.parentNode){const rows=this.parentNode.children;rows.splice(rows.indexOf(this),1);this.parentNode=null;}}
 replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this._text='';this.children=[];this.append(...nodes);}
 setAttribute(key,value){this.attrs[key]=String(value);}
 addEventListener(key,fn){this.events[key]=fn;}
 focus(){}
}
const doc={createElement:tag=>new Node(tag,doc),createDocumentFragment:()=>new Node('fragment',doc),createTextNode:text=>{const n=new Node('#text',doc);n.textContent=text;return n;}};
const uuid=n=>`00000000-0000-7000-8000-${String(n).padStart(12,'0')}`;
const now=Date.parse('2026-11-04T09:00:00Z');
const presence={source:{eligible:true,read_at:new Date(now).toISOString(),received_at:new Date(now).toISOString(),guidance_lifetime:'active_session',controls:{response_extent:'standard',unsolicited_update:'defer',conversation_style:'conversational'}}};
function fixture(t){
 let seq=0,turn=10;
 const sessions=Object.fromEntries(['without','with'].map((arm,index)=>{
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(_chunk,_encoding,done){done();}});
  const client=new MuseMsp({child});client.sessionId=uuid(index+1);client.stop=async()=>{client.closed=true;client.stopping=true;};
  return[arm,{client,ledger:new MusePublicEvents({arm,sessionId:client.sessionId,evidenceMode:'fixture'}),usage:new SessionUsage(client.sessionId)}];
 }));
 const pair=new StructuredPair({sessions,makeId:()=>uuid(++seq+100),nativeQuestions:true});
 t.after(()=>pair.stop());
 const sourceRange=()=>{const n=++seq;return{stream:{kind:'fixture',id:'stream'},first:{id:`event-${n}`,sequence:n},last:{id:`event-${n}`,sequence:n}};};
 const notify=(arm,method,fields)=>sessions[arm].client.consume(JSON.stringify({jsonrpc:'2.0',method,params:{sessionId:sessions[arm].client.sessionId,...fields}})+'\n');
 const start=(arm='with')=>{pair.arms[arm].prepare();pair.arms[arm].bindTurn(uuid(++turn));};
 const message=(text,{arm='with',phase='commentary',...flags}={})=>notify(arm,'item/completed',{item:{itemId:`message-${++seq}`,turnId:sessions[arm].client.activeTurnId,kind:'agentMessage',status:'completed',revision:1,messagePhase:phase,text,...flags},sourceRange:sourceRange()});
 const complete=(arm='with')=>notify(arm,'turn/completed',{turnId:sessions[arm].client.activeTurnId,terminal:'completed',sourceRange:sourceRange()});
 const container=new Node('div',doc),pane=mountSessionPane({container,arm:'with',onDecide:()=>{}});
 const render=(options={})=>{const state={...pair.snapshot(),session_generation:1,presence};pane.render(state,{connected:true,pendingDecisions:new Map(),now,...options});return state;};
 render();
 return{pair,sessions,start,message,complete,notify,render,pane,text:()=>container.textContent};
}

test('native commentary is revealed when its real turn completes and never hidden again',async t=>{
 const f=fixture(t);f.start();f.message('Reviewing the save path.');f.render();assert.equal(f.pane.metrics().held_current,1);
 f.message('Choose a conflict resolution before I proceed.');const running=f.render();
 assert.equal(running.arms.with.messages[1].phase,'commentary');
 assert.equal(Object.hasOwn(running.arms.with.messages[1],'decisionNeeded'),false);
 f.complete();const ready=f.render();assert.equal(ready.arms.with.status,'ready');
 assert.match(f.text(),/Choose a conflict resolution before I proceed/);
 assert.equal(f.pane.metrics().held_current,0);
 assert.equal(f.pane.metrics().released_manual,0);
 const releases=f.pane.presentation().events.filter(e=>e.event==='released');
 assert.equal(releases.length,2);assert.ok(releases.every(e=>e.reason==='not_held'));
 f.start();f.message('Checking the new implementation.');f.render();
 assert.match(f.text(),/Choose a conflict resolution before I proceed/);
 assert.equal(f.pane.metrics().held_current,1);
});

test('native approval immediately reveals preceding commentary and remains actionable',async t=>{
 const f=fixture(t);f.start();f.message('A required command needs review.');f.render();
 const client=f.sessions.with.client,approvalId='approval-with';
 client.consume(JSON.stringify({jsonrpc:'2.0',id:200,method:'approval/request',params:{sessionId:client.sessionId,turnId:client.activeTurnId,approvalId,currentRequirementId:{approvalId,sourceIndex:0},subject:{kind:'shell',command:'node --test'},availableChoices:[{choiceId:'once',label:'Allow once',decision:'approved',scope:'once'}]}})+'\n');
 const state=f.render();assert.equal(state.arms.with.status,'approval');
 assert.match(f.text(),/A required command needs review/);assert.match(f.text(),/Allow once/);
 assert.equal(f.pane.metrics().held_current,0);
});

test('native question immediately reveals preceding commentary and keeps its question visible',async t=>{
 const f=fixture(t);f.start();f.message('I need your choice before continuing.');f.render();
 const client=f.sessions.with.client;
 client.consume(JSON.stringify({jsonrpc:'2.0',id:201,method:'userInput/request',params:{sessionId:client.sessionId,turnId:client.activeTurnId,userInputId:'question-with',itemId:'question-item',toolCallId:'question-call',toolName:'request_user_input',viewCursor:'fixture-cursor',questions:[{id:'choice',header:'Conflict',question:'Which edit should be retained?',selection:{mode:'single'},options:[{label:'Local',description:'Keep local edits.'},{label:'Remote',description:'Keep remote edits.'}]}]}})+'\n');
 const state=f.render();assert.equal(state.arms.with.status,'question');
 assert.match(f.text(),/I need your choice before continuing/);assert.match(f.text(),/Which edit should be retained/);
 assert.equal(f.pane.metrics().held_current,0);
});

test('native finals and incomplete committed commentary are never held',async t=>{
 const f=fixture(t);f.start();
 f.message('Required final answer.',{phase:'finalAnswer'});
 f.message('Incomplete decision text.',{cutOff:true});
 f.message('Truncated required detail.',{truncated:true});
 const state=f.render();assert.equal(state.arms.with.messages[1].cut_off,true);assert.equal(state.arms.with.messages[2].truncated,true);
 for(const text of ['Required final answer.','Incomplete decision text.','Truncated required detail.'])assert.ok(f.text().includes(text),text);
 assert.equal(f.pane.metrics().held_current,0);
});

test('the other arm finishing cannot release this arm while it is still working',async t=>{
 const f=fixture(t);f.start('without');f.start('with');f.message('Progress is still ongoing.');f.render();
 f.complete('without');f.render();assert.equal(f.pane.metrics().held_current,1);
 f.complete('with');f.render();assert.match(f.text(),/Progress is still ongoing/);assert.equal(f.pane.metrics().held_current,0);
});

test('interrupt, recovery and a running continuation without an active turn release text',async t=>{
 for(const boundary of ['interrupt','recovery','continuation']){
  const f=fixture(t);f.start();f.message(`Pending text at ${boundary}.`);f.render();assert.equal(f.pane.metrics().held_current,1);
  if(boundary==='interrupt')f.pair.arms.with.interruptExpected.add(f.sessions.with.client.activeTurnId);
  if(boundary==='continuation')f.pair.arms.with.waitingContinuation=true;
  f.render({pendingRecovery:boundary==='recovery'});
  assert.match(f.text(),new RegExp(`Pending text at ${boundary}`));assert.equal(f.pane.metrics().held_current,0);
 }
});

test('an error closes the owned native pair and reveals its preceding text',async t=>{
 const f=fixture(t);f.start();f.message('The save operation cannot continue.');f.render();
 f.notify('with','turn/completed',{turnId:f.sessions.with.client.activeTurnId,terminal:'failed',sourceRange:{stream:{kind:'fixture',id:'error-stream'},first:{id:'error-event',sequence:1},last:{id:'error-event',sequence:1}}});
 await f.pair.stop();const state=f.render();assert.equal(state.status,'closed');assert.equal(state.error,'session_failed');
 assert.match(f.text(),/The save operation cannot continue/);assert.equal(f.pane.metrics().held_current,0);
});
