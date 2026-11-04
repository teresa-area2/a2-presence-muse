const ARMS=['without','with'];
const title=arm=>arm==='with'?'With Presence':'Without Presence';
const metric=(name,label)=>'<div><dt>'+label+'</dt><dd>'+ARMS.map(arm=>'<span class="v-'+arm+'" id="measure-'+name+'-'+arm+'">—</span>').join('')+'</dd></div>';
const EFFORT_LABELS=Object.freeze(['Very little effort','Little effort','Moderate effort','High effort','Very high effort']);
const effortText=score=>Number.isInteger(score)&&score>=1&&score<=5?EFFORT_LABELS[score-1]+' ('+score+'/5)':'Not reported';
function ratingControlsHtml(arm){
 const guide='effort-scale-guide-'+arm;
 return '<div class="rating-heading"><strong>'+title(arm)+'</strong><button class="secondary" type="button" data-measure-arm="'+arm+'" data-measure-action="review">Start review</button></div>'+
  '<fieldset class="effort-rating" aria-describedby="'+guide+'"><legend>How much effort did working with this side require?</legend><p class="effort-scale-note" id="'+guide+'">Higher number = more effort</p><div class="effort-scale">'+
  EFFORT_LABELS.map((label,index)=>{const score=index+1;return '<button class="secondary" type="button" data-measure-arm="'+arm+'" data-measure-action="effort" data-measure-score="'+score+'" aria-label="'+title(arm)+' effort '+score+' of 5 — '+label+'" aria-pressed="false"><span class="effort-score-number">'+score+'</span><span class="effort-score-label">'+label+'</span></button>';}).join('')+
  '</div><p class="rating-value" id="rating-effort-summary-'+arm+'" role="status">Not reported</p></fieldset>'+
  '<fieldset class="interruption-rating"><legend>Interruptions you noticed</legend><p class="rating-value" id="rating-interruptions-summary-'+arm+'" role="status">Not reported</p><div class="interruption-actions"><button class="secondary" type="button" data-measure-arm="'+arm+'" data-measure-action="none" aria-pressed="false">None (0)</button><button class="secondary" type="button" data-measure-arm="'+arm+'" data-measure-action="interruption">+1 noticed</button></div></fieldset>'+
  '<div class="rating-footer"><button class="ghost" type="button" data-measure-arm="'+arm+'" data-measure-action="clear">Clear ratings</button></div>';
}
const ratingHtml=arm=>'<div class="rating" data-review-arm="'+arm+'" role="group" aria-label="Measure '+title(arm)+'">'+ratingControlsHtml(arm)+'</div>';
export function sessionMeasurementHtml(){return '<details class="card about-numbers" id="session-measurement"><summary>Effort and experience</summary><p class="footnote" id="measurement-summary" role="status">No participant actions recorded.</p><dl class="result-metrics">'+metric('messages','Your messages sent')+metric('characters','Your prompt characters')+metric('approvals','Approval decisions')+metric('questions','Your accepted question actions')+metric('steering','Your steering instructions')+metric('interrupts','Your interrupt requests')+metric('turn','Turn elapsed (incl. approvals)')+metric('review','Your review window')+metric('effort','Your effort')+metric('interruptions','Interruptions you noticed')+'</dl><div class="review-cards">'+ARMS.map(ratingHtml).join('')+'</div><p class="footnote">Optional: time your review of each answer separately. Turn time includes approval and tool waits; partial means a turn stopped without confirmed completion. Review windows measure elapsed review time, not attention. Effort and interruptions are your own reports; approvals are not interruptions. Completed shared sends count once in your completed total and once per receiving agent; partial and wholly unconfirmed sends are separate. Actions use the client’s explicit attribution label; other clients are separate. Live values belong to this pair; see the evidence status below for saving and export. Messages, raw keys and capsule bodies are excluded.</p><p id="measurement-status" class="footnote" role="status"></p></details>';}
export function reviewAction({action,arm,score,measurement}){
 if(!ARMS.includes(arm))throw Error('measurement_arm_invalid');const value=measurement?.review?.arms?.[arm];
 if(action==='review')return {arm,action:measurement?.review?.active_arm===arm?'stop':'start'};
 if(action==='effort'&&Number.isInteger(score)&&score>=1&&score<=5)return {arm,action:'feedback',effort:value?.effort_rating===score?null:score};
 if(action==='none')return {arm,action:'feedback',interruptions:0};
 if(action==='interruption')return {arm,action:'feedback',interruptions:Math.min(100,(value?.interruption_count??0)+1)};
 if(action==='clear')return {arm,action:'feedback',effort:null,interruptions:null};
 throw Error('measurement_action_invalid');
}
export function measurementValues(measurement,arms={},extraElapsed=0){
 const number=n=>Number.isFinite(n)?new Intl.NumberFormat().format(n):'—';
 return Object.fromEntries(ARMS.map(arm=>{const actions=measurement?.actions?.participant?.arms?.[arm],review=measurement?.review?.arms?.[arm];const elapsed=arms?.[arm]?.elapsed;return [arm,{turn:Number.isFinite(elapsed?.total_seconds)?(elapsed.total_seconds+(Number.isFinite(elapsed.in_flight_seconds)&&Number.isFinite(extraElapsed)&&extraElapsed>0?extraElapsed:0)).toFixed(1)+'s'+(elapsed.status==='partial'?' · partial':Number.isFinite(elapsed.in_flight_seconds)?' · running':''):'—',messages:number(actions?.messages),characters:number(actions?.characters),approvals:number(actions?.approval_decisions),questions:number(measurement?.question_effort?.participant?.[arm]?.accepted),steering:number(measurement?.turn_actions?.participant?.[arm]?.steering_accepted),interrupts:number(measurement?.turn_actions?.participant?.[arm]?.interrupt_accepted),review:Number.isFinite(review?.review_window_seconds)?review.review_window_seconds.toFixed(1)+'s':'—',effort:effortText(review?.effort_rating),interruptions:review?.interruption_count==null?'Not reported':number(review.interruption_count)}];}));
}
export function mountSessionMeasurement(container,{post,onState,now=()=>performance.now()}){
 // A running server may retain its older HTML renderer. Upgrade only this
 // panel's fixed rating markup before binding handlers; stored state is applied
 // by render as usual. Fresh markup and later renders keep their controls.
 const ratingRows=[];
 for(const arm of ARMS){
  const control=container.querySelector('[data-measure-arm="'+arm+'"][data-measure-action="effort"]');
  const row=control?.closest?.('.rating');
  if(row){
   row.setAttribute?.('data-review-arm',arm);
   if(!row.querySelector('.interruption-rating'))row.innerHTML=ratingControlsHtml(arm);
   ratingRows.push(row);
  }
 }
 if(!container.querySelector('.review-cards')&&ratingRows.length===2){
  const cards=container.ownerDocument?.createElement('div');
  if(cards){cards.className='review-cards';ratingRows[0].before(cards);cards.append(...ratingRows);}
 }
 const effortTerm=container.querySelector('#measure-effort-with')?.closest?.('div')?.querySelector?.('dt');
 if(effortTerm)effortTerm.textContent='Your effort';
 const summary=container.querySelector('summary');if(summary)summary.textContent='Effort and experience';
 let current=null,connected=false,pending=false,snapshotAt=null;
 const $=id=>container.querySelector('#'+id);
 function render(state,options={}){
  const at=now();if(state!==current&&(state?.version===undefined||state.version!==current?.version))snapshotAt=at;
  current=state;connected=options.connected===true;const m=state?.measurement,extra=connected&&Number.isFinite(at)&&Number.isFinite(snapshotAt)&&at>=snapshotAt?(at-snapshotAt)/1000:0,values=measurementValues(m,state?.arms,extra);
  for(const arm of ARMS)for(const [field,value] of Object.entries(values[arm]))$('measure-'+field+'-'+arm).textContent=value;
  for(const arm of ARMS){
   const effort=$('rating-effort-summary-'+arm),interruptions=$('rating-interruptions-summary-'+arm);
   const interruptionText=values[arm].interruptions==='Not reported'?'Not reported':values[arm].interruptions+' noticed';
   if(effort&&effort.textContent!==values[arm].effort)effort.textContent=values[arm].effort;
   if(interruptions&&interruptions.textContent!==interruptionText)interruptions.textContent=interruptionText;
  }
  const a=m?.actions,p=a?.participant;
  $('measurement-summary').textContent=p?'Your sends: '+p.submissions+' complete ('+p.shared_submissions+' shared), '+p.partial_submissions+' partial, '+p.unconfirmed_submissions+' unconfirmed. Coordinator: '+a.coordinator.submissions+' complete, '+a.coordinator.partial_submissions+' partial, '+a.coordinator.unconfirmed_submissions+' unconfirmed. Unattributed: '+a.unattributed.submissions+' complete, '+a.unattributed.partial_submissions+' partial, '+a.unattributed.unconfirmed_submissions+' unconfirmed.':'No participant actions recorded.';
  for(const button of container.querySelectorAll('[data-measure-action]')){
   const arm=button.dataset.measureArm,action=button.dataset.measureAction,active=m?.review?.active_arm;
   button.disabled=!connected||pending||!Number.isSafeInteger(state?.session_generation)||state.session_generation<1||(action==='review'&&active!==null&&active!==arm);
   if(action==='review')button.textContent=active===arm?'Finish review':'Start review';
   if(action==='effort')button.setAttribute('aria-pressed',String(m?.review?.arms?.[arm]?.effort_rating===Number(button.dataset.measureScore)));
   if(action==='none')button.setAttribute('aria-pressed',String(m?.review?.arms?.[arm]?.interruption_count===0));
  }
 }
 container.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-measure-action]');if(!button||!container.contains(button)||button.disabled||pending)return;
  const generation=current?.session_generation,body=reviewAction({action:button.dataset.measureAction,arm:button.dataset.measureArm,score:Number(button.dataset.measureScore),measurement:current?.measurement});
  pending=true;render(current,{connected});$('measurement-status').textContent='Saving your assessment…';
  try{const out=await post('human-review',{...body,generation});onState(out.state);$('measurement-status').textContent=out.state?.session_generation===generation?'Recorded for this pair.':'The pair changed; check its current measurements.';}
  catch{$('measurement-status').textContent='That assessment could not be confirmed. Check the values before trying again.';}
  finally{pending=false;render(current,{connected});}
 });
 return {render};
}
