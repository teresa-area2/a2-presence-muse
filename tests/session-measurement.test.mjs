import test from 'node:test';import assert from 'node:assert/strict';
import {SessionMeasurement,measurementActor} from '../src/session-measurement.mjs';
import {reviewAction,measurementValues,sessionMeasurementHtml,mountSessionMeasurement} from '../web/session-measurement.mjs';
test('shared participant send counts one action and one confirmed receipt per arm, without text retention',()=>{
 const m=new SessionMeasurement();m.submitted({actor:'participant',text:'señal 🌿',outcome:{status:'started'}});const s=m.snapshot(),p=s.actions.participant;
 assert.equal(p.submissions,1);assert.equal(p.shared_submissions,1);assert.equal(p.characters,7);assert.equal(p.arms.with.messages,1);assert.equal(p.arms.without.characters,7);
 assert.ok(!JSON.stringify(m).includes('señal'));assert.ok(!JSON.stringify(s).includes('señal'));s.actions.participant.submissions=9;assert.equal(m.snapshot().actions.participant.submissions,1);
});
test('coordinator and omitted actors never become participant effort',()=>{
 const m=new SessionMeasurement();for(const actor of ['coordinator',undefined])m.submitted({actor,text:'a',target:'with',outcome:{status:'started'}});
 const s=m.snapshot();assert.equal(s.actions.participant.submissions,0);assert.equal(s.actions.coordinator.submissions,1);assert.equal(s.actions.unattributed.arms.with.messages,1);assert.equal(s.actions.unattributed.arms.without.messages,0);
 for(const actor of [null,'human','fixture',true,{}])assert.throws(()=>measurementActor(actor),/measurement_actor_invalid/);
});
test('partial and unknown dispatches count only confirmed arm acknowledgements, never a matched shared send',()=>{
 const m=new SessionMeasurement();m.submitted({actor:'participant',text:'abc',target:'both',outcome:{status:'partial_or_unconfirmed',arms:{without:{status:'started'},with:{status:'unknown'}}}});
 m.submitted({actor:'participant',text:'abc',outcome:{status:'partial_or_unconfirmed',arms:{without:{status:'unknown'},with:{status:'unknown'}}}});
 const p=m.snapshot().actions.participant;assert.equal(p.submissions,0);assert.equal(p.shared_submissions,0);assert.equal(p.partial_submissions,1);assert.equal(p.partial_characters,3);assert.equal(p.unconfirmed_submissions,1);assert.equal(p.unconfirmed_characters,3);assert.equal(p.characters,0);assert.equal(p.arms.without.messages,1);assert.equal(p.arms.without.characters,3);assert.equal(p.arms.with.messages,0);assert.equal(p.submissions+p.partial_submissions+p.unconfirmed_submissions,2,'each outcome enters exactly one global category');
});
test('only accepted native approval decisions count and one requirement cannot double count across actors',()=>{
 const m=new SessionMeasurement(),d={actor:'participant',arm:'with',approvalId:'approval',requirementId:{approvalId:'approval',sourceIndex:0}};
 m.decided({...d,result:undefined});assert.equal(m.snapshot().actions.participant.arms.with.approval_decisions,0);
 m.decided({...d,result:{status:'accepted'}});m.decided({...d,actor:'coordinator',result:{status:'accepted'}});
 assert.equal(m.snapshot().actions.participant.arms.with.approval_decisions,1);assert.equal(m.snapshot().actions.coordinator.arms.with.approval_decisions,0);
 m.decided({...d,requirementId:{approvalId:'approval',sourceIndex:1},result:{status:'accepted'}});assert.equal(m.snapshot().actions.participant.arms.with.approval_decisions,2);
 assert.equal(m.snapshot().review.arms.with.interruption_count,null,'approvals never imply perceived interruptions');
});
test('reuse of HumanReview retains explicit unknown/zero and exclusive measured windows',()=>{
 let now=0;const m=new SessionMeasurement({now:()=>now});m.feedback({arm:'with',action:'start'});now=500;
 assert.equal(m.snapshot().review.arms.with.review_window_seconds,.5);assert.throws(()=>m.feedback({arm:'without',action:'start'}),/already_active/);
 m.feedback({arm:'with',action:'stop'});m.feedback({arm:'with',action:'feedback',effort:3,interruptions:0});
 assert.equal(m.snapshot().review.arms.with.interruption_count,0);assert.equal(m.snapshot().review.arms.without.interruption_count,null);
 const before=m.snapshot();assert.throws(()=>m.feedback({arm:'with',action:'feedback',effort:8}),/invalid/);assert.deepEqual(m.snapshot(),before);
});
test('UI measurement actions are explicit self-reports, null is distinct from zero, and resources are not resummed',()=>{
 const m=new SessionMeasurement();assert.deepEqual(reviewAction({action:'none',arm:'without',measurement:m.snapshot()}),{arm:'without',action:'feedback',interruptions:0});
 assert.deepEqual(reviewAction({action:'effort',arm:'with',score:3,measurement:m.snapshot()}),{arm:'with',action:'feedback',effort:3});
 m.feedback({arm:'with',action:'feedback',effort:3,interruptions:0});assert.equal(reviewAction({action:'effort',arm:'with',score:3,measurement:m.snapshot()}).effort,null);
 const v=measurementValues(m.snapshot());assert.equal(v.with.interruptions,'0');assert.equal(v.without.interruptions,'Not reported');assert.equal(v.with.review,'—');assert.equal(v.with.effort,'Moderate effort (3/5)');
 assert.ok(!('usage' in m.snapshot()));assert.match(m.snapshot().resources,/without_adding_native_and_trace/);
 assert.match(sessionMeasurementHtml(),/Higher number = more effort/);assert.match(sessionMeasurementHtml(),/not attention/);assert.ok(!sessionMeasurementHtml().includes('<form'));
});
test('actual measurement control handler gates pending/disconnected actions and uses the current generation',async()=>{
 const fields=new Map(),buttons=['without','with'].flatMap(arm=>['review','effort','none','interruption','clear'].map(action=>({dataset:{measureArm:arm,measureAction:action,...(action==='effort'?{measureScore:'3'}:{})},setAttribute(){},closest(){return this;}})));
 let listener,release,posted;const container={querySelector:id=>{if(!fields.has(id))fields.set(id,{textContent:''});return fields.get(id);},querySelectorAll:()=>buttons,contains:e=>buttons.includes(e),addEventListener:(name,fn)=>{listener=fn;}};
 const measurement=new SessionMeasurement(),first={session_generation:1,measurement:measurement.snapshot()},panel=mountSessionMeasurement(container,{post:(route,body)=>{posted={route,body};return new Promise(r=>{release=r;});},onState:state=>panel.render(state,{connected:true})});
 panel.render(first,{connected:false});assert.ok(buttons.every(b=>b.disabled));panel.render(first,{connected:true});const button=buttons.find(b=>b.dataset.measureArm==='with'&&b.dataset.measureAction==='effort');const pending=listener({target:button});assert.ok(buttons.every(b=>b.disabled));assert.deepEqual(posted,{route:'human-review',body:{arm:'with',action:'feedback',effort:3,generation:1}});
 measurement.feedback({arm:'with',action:'feedback',effort:3});release({state:{session_generation:1,measurement:measurement.snapshot()}});await pending;assert.ok(buttons.every(b=>!b.disabled));assert.equal(fields.get('#measure-effort-with').textContent,'Moderate effort (3/5)');assert.equal(fields.get('#measure-interruptions-with').textContent,'Not reported');
});

test('paired elapsed display distinguishes unknown, completed, running and stopped partial turn time',()=>{
 const m=new SessionMeasurement();assert.equal(measurementValues(m.snapshot()).with.turn,'—');const values=measurementValues(m.snapshot(),{without:{elapsed:{status:'complete',total_seconds:2.25,in_flight_seconds:null}},with:{elapsed:{status:'partial',total_seconds:3,in_flight_seconds:null}}});assert.equal(values.without.turn,'2.3s');assert.equal(values.with.turn,'3.0s · partial');assert.equal(measurementValues(m.snapshot(),{with:{elapsed:{status:'in_progress',total_seconds:1,in_flight_seconds:1}}}).with.turn,'1.0s · running');assert.equal(measurementValues(m.snapshot(),{with:{elapsed:{status:'in_progress',total_seconds:1,in_flight_seconds:1}}},2).with.turn,'3.0s · running');assert.equal(measurementValues(m.snapshot(),{without:{elapsed:{status:'complete',total_seconds:2,in_flight_seconds:null}}},5).without.turn,'2.0s');
});


test('question effort counts acknowledged explicit replies separately from messages and approvals',()=>{
 const m=new SessionMeasurement();m.questioned({actor:'participant',arm:'with',userInputId:'p1',action:'clarify',clarification:{format:'text',content:'Keep 🌿'},result:{status:'accepted'}});m.questioned({actor:'participant',arm:'with',userInputId:'p1',action:'clarify',clarification:'duplicate',result:{status:'accepted'}});m.questioned({actor:'coordinator',arm:'without',userInputId:'p2',action:'cancel',result:{status:'accepted'}});m.questioned({actor:'participant',arm:'without',userInputId:'p3',action:'answer',result:{status:'unknown'}});
 const s=m.snapshot();assert.deepEqual(s.question_effort.participant.with,{accepted:1,unconfirmed:0,characters:6});assert.equal(s.question_effort.coordinator.without.accepted,1);assert.equal(s.question_effort.participant.without.unconfirmed,1);assert.equal(s.actions.participant.submissions,0);assert.equal(s.actions.participant.arms.with.approval_decisions,0);assert.ok(!JSON.stringify(s).includes('Keep'));assert.equal(measurementValues(s).with.questions,'1');
});


test('native steering and interrupt acknowledgements stay distinct from questions, approvals and perceived interruptions',()=>{
 const m=new SessionMeasurement();
 m.submitted({actor:'participant',target:'both',text:'Consider edits',outcome:{status:'forwarded',arms:{without:{status:'steered'},with:{status:'steered'}}}});
 m.interrupted({actor:'coordinator',target:'both',expectedTurns:{without:'w0',with:'w1'},outcome:{status:'accepted',arms:{without:{status:'interrupt_requested'},with:{status:'interrupt_requested'}}}});
 m.interrupted({actor:'participant',target:'with',expectedTurns:{with:'w1'},outcome:{arms:{with:{status:'interrupt_requested'}}}});
 m.interrupted({actor:'participant',target:'with',expectedTurns:{with:'w2'},outcome:{arms:{with:{status:'unknown'}}}});
 m.submitted({actor:'participant',target:'with',text:'not sent',outcome:{status:'not_started',arms:{with:{status:'not_started'}}}});
 const s=m.snapshot();assert.equal(s.actions.participant.submissions,1);assert.equal(s.actions.participant.unconfirmed_submissions,0);
 assert.equal(s.turn_actions.participant.with.steering_accepted,1);assert.equal(s.turn_actions.coordinator.with.interrupt_accepted,1);assert.equal(s.turn_actions.participant.with.interrupt_accepted,0,'duplicate receipt is not another action');assert.equal(s.turn_actions.participant.with.interrupt_unconfirmed,1);
 assert.equal(s.actions.participant.arms.with.approval_decisions,0);assert.equal(s.review.arms.with.interruption_count,null);
 assert.ok(!JSON.stringify(s).includes('Consider edits'));assert.ok(!JSON.stringify(s).includes('w1'));
});


test('both effort scales state each numeric meaning and repeat the direction accessibly',()=>{
 const html=sessionMeasurementHtml(),labels=['Very little effort','Little effort','Moderate effort','High effort','Very high effort'];
 assert.equal((html.match(/How much effort did working with this side require\?/g)??[]).length,2);
 assert.equal((html.match(/Higher number = more effort/g)??[]).length,2);
 for(const arm of ['without','with'])for(const [i,label]of labels.entries()){
  const side=arm==='with'?'With Presence':'Without Presence',score=i+1;
  assert.ok(html.includes('data-measure-arm="'+arm+'" data-measure-action="effort" data-measure-score="'+score+'" aria-label="'+side+' effort '+score+' of 5 — '+label+'"'),arm+' '+label);
 }
 assert.equal((html.match(/class="effort-scale"/g)??[]).length,2);
});

test('semantic display preserves every effort value and unreported state without recoding',()=>{
 const labels=['Very little effort','Little effort','Moderate effort','High effort','Very high effort'],m=new SessionMeasurement();
 for(const score of [null,1,2,3,4,5]){
  for(const arm of ['without','with'])m.feedback({arm,action:'feedback',effort:score});
  const before=m.snapshot(),values=measurementValues(before);
  for(const arm of ['without','with']){
   assert.equal(values[arm].effort,score===null?'Not reported':labels[score-1]+' ('+score+'/5)');
   assert.equal(before.review.arms[arm].effort_rating,score);
   for(const next of [1,2,3,4,5])assert.deepEqual(reviewAction({action:'effort',arm,score:next,measurement:before}),{arm,action:'feedback',effort:next===score?null:next});
  }
  assert.deepEqual(m.snapshot(),before);
 }
});

test('rendering restored ratings retains selection and never posts a new assessment',()=>{
 const fields=new Map(),buttons=['without','with'].flatMap(arm=>[1,2,3,4,5].map(score=>({dataset:{measureArm:arm,measureAction:'effort',measureScore:String(score)},attributes:{},setAttribute(name,value){this.attributes[name]=value;}})));
 const container={querySelector:id=>{if(!fields.has(id))fields.set(id,{textContent:''});return fields.get(id);},querySelectorAll:()=>buttons,addEventListener(){}};
 let posts=0;const panel=mountSessionMeasurement(container,{post(){posts++;},onState(){}}),m=new SessionMeasurement();
 m.feedback({arm:'without',action:'feedback',effort:2});m.feedback({arm:'with',action:'feedback',effort:4});
 const state={session_generation:7,measurement:m.snapshot()},before=structuredClone(state);
 for(const connected of [true,false,true])panel.render(state,{connected});
 assert.equal(posts,0);assert.deepEqual(state,before);
 assert.equal(fields.get('#measure-effort-without').textContent,'Little effort (2/5)');assert.equal(fields.get('#measure-effort-with').textContent,'High effort (4/5)');
 for(const button of buttons)assert.equal(button.attributes['aria-pressed'],String(Number(button.dataset.measureScore)===(button.dataset.measureArm==='with'?4:2)));
});
