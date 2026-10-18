(function(){
"use strict";
/* projects come from app/projects.js; data from data/*.js */
var PSEL;try{PSEL=JSON.parse(localStorage.getItem("hubSel")||"null");}catch(e){}
PSEL=PSEL||{p:"halden",snap:"final"};
var PROJ,SEED,VARS,GUIDES,SNAPS,SNAP,KEY,S,REF;
var ROLES=[{k:"pm",n:"Project manager",tab:"documents"},{k:"eng",n:"Engineer",tab:"findings"},{k:"des",n:"Designer",tab:"findings"}];
var TODAY=new Date();TODAY.setHours(0,0,0,0);REF=TODAY;



/* ================= STATE ================= */
function fresh(){return JSON.parse(JSON.stringify(SEED));}
function loadProject(pid,snap,keepUi){
  var ui=S?{role:S.role,tab:S.tab}:null;
  PROJ=window.HUB_PROJECTS.find(function(p){return p.id===pid;})||window.HUB_PROJECTS[0];
  var L=PROJ.load(snap);SEED=L.seed;GUIDES=L.guides;SNAPS=L.snaps;SNAP=L.snap||null;
  VARS=(SEED.variables||[]).map(function(v){return [v.name,v.value,v.units,v.source];});
  REF=SNAP?new Date(SNAP.date+"T00:00:00"):TODAY;
  KEY="hub3."+PROJ.id+(SNAP?"."+SNAP.id:"");
  try{S=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){S=null;}
  if(!S||!S.findings) S=fresh();
  if(keepUi&&ui){S.role=ui.role;S.tab=ui.tab;}
  S.role=S.role||"pm"; S.tab=S.tab||"documents"; if(S.tab==="calcs")S.tab="guides";
  if(!GUIDES.some(function(g){return g.id===S.guide;})) S.guide=GUIDES[0].id;
  if(S.tab==="correspondence"&&!S.correspondence) S.tab="documents";
  if(S.tab==="timeline"&&!SNAPS) S.tab="documents";
  PSEL={p:PROJ.id,snap:SNAP?SNAP.id:PSEL.snap};try{localStorage.setItem("hubSel",JSON.stringify(PSEL));}catch(e){}
  sel=null;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
var sel=null, openForm=null, resetArmed=false, rt, docHist=null, corrKind="";
loadProject(PSEL.p,PSEL.snap);

/* ================= HELPERS ================= */
var $=function(id){return document.getElementById(id);};
var esc=function(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");};
var F=function(id){return S.findings.find(function(f){return f.id===id;})||(S.history||[]).find(function(f){return f.id===id;});};
var D=function(id){return S.docs.find(function(d){return d.id===id;});};
var role=function(){return ROLES.find(function(r){return r.k===S.role;});};
function days(d){var t=new Date(d+"T00:00:00");return Math.round((t-REF)/864e5);}
function fmtDate(d){var t=new Date(d+"T00:00:00");return t.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
var ST={superseded:"Superseded",answered:"Answered",waiting:"Awaiting answer",proposed:"To check",dismissed:"Dismissed",verified:"Verified",unverified:"Unverified",rejected:"Rejected",accepted:"Accepted",review:"Under review",received:"Received",requested:"Requested",open:"Open",progress:"In progress",done:"Done",resolved:"Resolved",high:"High",medium:"Medium"};
function pip(s){return '<span class="pip p-'+s+'">'+(ST[s]||s)+'</span>';}
var CAT={requirement:"Requirement",constraint:"Constraint",risk:"Risk",recommendation:"Recommendation",action:"Action"};
function openConf(fid){return S.conflicts.filter(function(c){return c.st==="open"&&(c.a===fid||c.b===fid);});}

/* ================= LCD ================= */
function pad(n,w){var s=String(n);var g="";for(var i=s.length;i<w;i++)g+="8";return '<span class="ghost">'+g+'</span>'+s;}
function renderLCD(){
  var acc=S.docs.filter(function(d){return d.status==="accepted";}).length;
  var unv=S.findings.filter(function(f){return f.st==="unverified";}).length;
  var oc=S.conflicts.filter(function(c){return c.st==="open";}).length;
  var oa=S.actions.filter(function(a){return a.st!=="done";}).length;
  var od=S.actions.filter(function(a){return a.st!=="done"&&days(a.due)<0;}).length;
  var dd=days(S.project.ddEnd);
  var cells=[
    ["Documents accepted",pad(acc,1)+'<small style="font-size:.5em">/'+S.docs.length+'</small>',S.docs.length-acc+" still open",false],
    ["Findings",pad(S.findings.length,2),"across "+S.docs.filter(function(d){return d.status!=="requested";}).length+" reports received",false],
    ["Unverified",pad(unv,2),(function(){var n=S.findings.filter(function(f){return f.st==="unverified"&&f.src&&f.src!=="answer-key";}).length;return n?n+" new from AI runs":"awaiting engineer";})(),unv>0],
    ["Open conflicts",pad(oc,2),S.conflicts.filter(function(c){return c.st==="resolved";}).length+" resolved",oc>0],
    ["Open actions",pad(oa,2),od?od+" overdue":"none overdue",od>0],
    dd>=0?["Due diligence ends","D-"+pad(dd,2),fmtDate(S.project.ddEnd),dd<14]:["Due diligence","Closed",(SNAP?"as of "+fmtDate(SNAP.date):"ended "+fmtDate(S.project.ddEnd)),false]
  ];
  $("lcd").innerHTML=cells.map(function(c){return '<div class="cell'+(c[3]?" alert":"")+'"><span class="lab">'+c[0]+'</span><span class="num">'+c[1]+'</span><span class="sub">'+c[2]+'</span></div>';}).join("");

}

/* ================= TABS ================= */
var TABS=[
 {k:"documents",n:"Documents",c:function(){return S.docs.length;}},
 {k:"findings",n:function(){return S.role==="des"?"Constraints":"Findings";},c:function(){return S.role==="des"?designerFindings().length:S.findings.length;}},
 {k:"conflicts",n:"Conflicts",c:function(){var o=S.conflicts.filter(function(c){return c.st==="open";}).length,p=S.conflicts.filter(function(c){return c.st==="proposed";}).length;return o+(p?" +"+p+" to check":"");}},
 {k:"actions",n:"Actions",c:function(){return S.actions.filter(function(a){return a.st!=="done";}).length;}},
 {k:"decisions",n:"Decisions",c:function(){return S.decisions.length;}},
 {k:"correspondence",n:"Correspondence",show:function(){return !!S.correspondence;},c:function(){var o=S.correspondence.filter(function(q){return !q.a;}).length;return S.correspondence.length+(o?" ("+o+" open)":"");}},
 {k:"timeline",n:"Timeline",show:function(){return !!SNAPS;}},
 {k:"variables",n:"Project variables",c:function(){return VARS.length;}},
 {k:"brief",n:"Design brief"},
 {k:"guides",n:"Design guides",c:function(){return GUIDES.length;}},
 {k:"about",n:"About this demo"}
];
function renderTabs(){
  $("tabs").innerHTML=TABS.filter(function(t){return !t.show||t.show();}).map(function(t){var n=typeof t.n==="function"?t.n():t.n;var c=t.c?'<span class="ct">'+t.c()+'</span>':"";
    return '<button class="tab'+(t.locked?" locked":"")+'" role="tab" data-tab="'+t.k+'" aria-selected="'+(S.tab===t.k)+'">'+esc(n)+c+'</button>';}).join("");
}
$("tabs").addEventListener("click",function(e){var b=e.target.closest(".tab");if(!b)return;S.tab=b.getAttribute("data-tab");save();render();});

/* ================= VIEWS ================= */
var filt={q:"",disc:"",st:"",cat:"",src:""};
function designerFindings(){return S.findings.filter(function(f){return f.st==="verified"&&(f.cat==="constraint"||f.cat==="requirement"||f.cat==="recommendation");});}

function vDocHist(){
  var P=window.HUB_CC,raw=P.docs.find(function(x){return x.id===docHist;}),d=D(docHist);
  var vs=raw.versions.filter(function(v){return !SNAP||v.date<=SNAP.date;});
  var h='<div class="toolbar"><button class="btn" data-hist="">Back to documents</button></div><h2>'+esc(raw.title)+': revision history</h2><p class="lead">'+esc(raw.author)+'. Each version, what the author said changed, and what changed in the findings.</p>';
  var prev=null;
  vs.forEach(function(v,i){
    var inV=P.findings.filter(function(f){return f.doc===raw.id&&f.vers.indexOf(v.ver)>=0;});
    var added=inV.filter(function(f){return !prev||f.vers.indexOf(prev.ver)<0;});
    var dropped=prev&&!/^(Addendum|Amendment)/i.test(v.ver)?P.findings.filter(function(f){return f.doc===raw.id&&f.vers.indexOf(prev.ver)>=0&&f.vers.indexOf(v.ver)<0;}):[];
    var sup=added.filter(function(f){return f.supersedes;});
    var pdf=PROJ.pdf?PROJ.pdf({doc:raw.id,ver:v.ver}):null;
    h+='<article class="conf"><header><b>'+esc(v.ver)+'</b><span class="hint">'+fmtDate(v.date)+', '+v.pages+' pages'+(pdf?' · <a class="ref" href="'+pdf+'" target="_blank" rel="noopener">Open PDF</a>':'')+'</span></header><div style="padding:10px 14px">'+
      (v.changes?'<p style="margin:0 0 8px"><b>Revision summary:</b> '+esc(v.changes)+'</p>':(i===0?'<p class="hint" style="margin:0 0 8px">First issue.</p>':''))+
      (i>0?'<ul class="chg">'+sup.map(function(f){var o=P.findings.find(function(x){return x.id===f.supersedes;});return '<li><span class="pip p-progress">Changed</span> '+esc(o?o.text:f.supersedes)+' <b>→</b> <span class="ref" data-f="'+f.id+'">'+esc(f.text)+'</span></li>';}).join("")+
        added.filter(function(f){return !f.supersedes;}).map(function(f){return '<li><span class="pip p-verified">Added</span> <span class="ref" data-f="'+f.id+'">'+esc(f.text)+'</span></li>';}).join("")+
        dropped.filter(function(f){return !sup.some(function(x){return x.supersedes===f.id;});}).map(function(f){return '<li><span class="pip p-open">Removed</span> '+esc(f.text)+'</li>';}).join("")+'</ul>':'<p class="hint" style="margin:0">'+inV.length+' findings in this version.</p>')+'</div></article>';
    prev=v;
  });
  return h;
}
function vDocuments(){
  if(docHist&&window.HUB_CC&&PROJ.id==="cotton-creek") return vDocHist();
  var h='<h2>Document tracker</h2><p class="lead">Every due-diligence report on the project, its status, and how many of its findings have been checked.</p><div class="docgrid">';
  S.docs.forEach(function(d){
    var fs=S.findings.filter(function(f){return f.doc===d.id;}),v=fs.filter(function(f){return f.st==="verified";}).length,u=fs.filter(function(f){return f.st==="unverified";}).length;
    var conf=S.conflicts.filter(function(c){return c.st==="open"&&(F(c.a).doc===d.id||F(c.b).doc===d.id);}).length;
    if(d.status==="requested"){h+='<div class="doc pending"><span class="code">'+esc(d.code)+'</span><span class="t">'+esc(d.title)+'</span><span class="m">'+esc(d.author)+'</span>'+pip("requested")+'<span class="m">Not yet received'+(SNAP?" as of "+fmtDate(SNAP.date):"")+'</span></div>';return;}
    h+='<button class="doc" data-doc="'+d.id+'"><span class="code">'+esc(d.code)+'</span><span class="t">'+esc(d.title)+'</span><span class="m">'+esc(d.author)+'<br>'+esc(d.ver)+', received '+fmtDate(d.date)+'</span>'+pip(d.status)+
      '<span class="bar" title="'+v+' verified, '+u+' unverified"><i style="width:'+(fs.length?v/fs.length*100:0)+'%"></i><b style="left:'+(fs.length?v/fs.length*100:0)+'%;width:'+(fs.length?u/fs.length*100:0)+'%"></b></span>'+
      '<span class="m">'+fs.length+' findings, '+v+' verified'+(conf?', <span class="flag">'+conf+' in conflict</span>':'')+'</span>'+((d.history||[]).length>1?'<span class="m hist" data-hist="'+d.id+'" role="button" tabindex="0">'+d.history.length+' versions: see what changed</span>':'')+'</button>';
  });
  h+='</div>';
  if(S.role==="pm"){
    var risks=S.findings.filter(function(f){return f.cat==="risk"&&f.st!=="rejected";});
    h+='<h2 style="margin-top:22px">Risk register</h2><p class="lead">Risks pulled from the reports. Open conflicts are flagged.</p><div class="scroll"><table><thead><tr><th>ID</th><th>Risk</th><th>Source</th><th>Status</th></tr></thead><tbody>'+
      risks.map(function(f){return '<tr data-f="'+f.id+'"'+(sel===f.id?' class="sel"':'')+'><td class="id">'+f.id+'</td><td>'+esc(f.text)+(openConf(f.id).length?' <span class="flag">conflict</span>':'')+'</td><td>'+esc(D(f.doc).code)+', p. '+f.pg+'</td><td>'+pip(f.st)+'</td></tr>';}).join("")+'</tbody></table></div>';
  }
  return h;
}

function srcBadge(f){var b="";if(f.src&&f.src!=="answer-key")b+=' <span class="badge">AI '+esc(f.src.replace("run-","run "))+'</span>';if(f.dupOf&&f.st==="unverified")b+=' <span class="badge warnb">possible duplicate</span>';return b;}
function vFindings(){
  var des=S.role==="des", list=des?designerFindings():S.findings.slice();
  var discs=[];S.findings.forEach(function(f){if(discs.indexOf(f.disc)<0)discs.push(f.disc);});
  list=list.filter(function(f){
    if(filt.src&&(f.src||"answer-key")!==filt.src)return false; if(filt.disc&&f.disc!==filt.disc)return false; if(filt.st&&f.st!==filt.st)return false; if(filt.cat&&f.cat!==filt.cat)return false;
    if(filt.q){var q=filt.q.toLowerCase();if((f.text+" "+f.id+" "+D(f.doc).title).toLowerCase().indexOf(q)<0)return false;}
    return true;});
  if(S.role==="eng") list.sort(function(a,b){return (a.st==="unverified"?0:1)-(b.st==="unverified"?0:1);});
  var h='<h2>'+(des?"Constraints to design to":"Findings")+'</h2><p class="lead">'+(des?"Verified requirements, constraints and recommendations from every report, with sources. Unverified items stay hidden until the engineer checks them.":S.role==="eng"?"Your review queue: unverified findings first, including what the latest AI run added. Open one to check it against its source page, then verify or reject it.":"Everything the reports say, pulled out and cited.")+'</p>';
  h+='<div class="toolbar"><input type="search" id="fq" placeholder="Search findings" value="'+esc(filt.q)+'" aria-label="Search findings">'+
     '<select id="fdisc" aria-label="Discipline"><option value="">All disciplines</option>'+discs.map(function(d){return '<option'+(filt.disc===d?" selected":"")+'>'+d+'</option>';}).join("")+'</select>'+
     (des?'':'<select id="fst" aria-label="Status"><option value="">Any status</option>'+["unverified","verified","rejected"].map(function(s){return '<option value="'+s+'"'+(filt.st===s?" selected":"")+'>'+ST[s]+'</option>';}).join("")+'</select>')+
     (des?'':'<select id="fsrc" aria-label="Source"><option value="">Any source</option><option value="answer-key"'+(filt.src==="answer-key"?" selected":"")+'>Original findings</option>'+(S.runs||[]).map(function(r){return '<option value="'+r.id+'"'+(filt.src===r.id?" selected":"")+'>New from AI '+r.id.replace("run-","run ")+'</option>';}).join("")+'</select>')+
     '<select id="fcat" aria-label="Type"><option value="">All types</option>'+Object.keys(CAT).map(function(c){return '<option value="'+c+'"'+(filt.cat===c?" selected":"")+'>'+CAT[c]+'</option>';}).join("")+'</select></div>';
  h+='<div class="scroll"><table><thead><tr><th>ID</th><th>Finding</th><th>Type</th><th>Discipline</th><th>Source</th>'+(des?'':'<th>Status</th>')+'</tr></thead><tbody>';
  h+=list.length?list.map(function(f){return '<tr data-f="'+f.id+'"'+(sel===f.id?' class="sel"':'')+'><td class="id">'+f.id+'</td><td>'+esc(f.text)+(openConf(f.id).length?' <span class="flag">conflict</span>':'')+srcBadge(f)+'</td><td>'+CAT[f.cat]+'</td><td>'+f.disc+'</td><td style="white-space:nowrap">'+esc(D(f.doc).code)+', p. '+f.pg+'</td>'+(des?'':'<td>'+pip(f.st)+(f.review&&f.st==="rejected"?'<div class="hint">'+esc(f.review.reason)+'</div>':'')+'</td>')+'</tr>';}).join(""):'<tr><td colspan="6" class="hint">No findings match. Clear a filter to see more.</td></tr>';
  return h+'</tbody></table></div>';
}

function side(fid){var f=F(fid),d=D(f.doc);return '<div class="side" data-f="'+f.id+'" tabindex="0"><div class="m">'+esc(d.code)+' '+esc(f.ver||d.ver)+', p. '+f.pg+' · '+f.id+'</div>'+esc(f.text)+'</div>';}
function vConflicts(){
  var h='<h2>Conflicts</h2><p class="lead">Places where two reports disagree. Each stays open until a decision settles it.</p>';
  var props=S.conflicts.filter(function(c){return c.st==="proposed";}),dism=S.conflicts.filter(function(c){return c.st==="dismissed";}).length;
  if(props.length){h+='<h3 style="margin:6px 0 4px">Proposed by cross-check <span class="ct">'+props.length+'</span></h3><p class="lead">Pairs of findings from different reports that describe the same place or item. The cross-check can’t tell whether they truly disagree; confirm the real conflicts and dismiss the rest.</p>';
    props.forEach(function(c){h+='<article class="conf proposed"><header><b>'+c.id+'. '+esc(c.title.replace(/^Check: /,""))+'</b>'+pip("proposed")+'</header><div class="vs">'+side(c.a)+'<div class="x" aria-hidden="true">?</div>'+side(c.b)+'</div><footer><span style="flex:1;min-width:220px">'+esc(c.note)+'</span><button class="btn go" data-confirm="'+c.id+'"'+(S.role==="des"?' disabled':'')+'>Confirm conflict</button><button class="btn" data-dismiss="'+c.id+'"'+(S.role==="des"?' disabled':'')+'>Dismiss</button></footer></article>';});
    h+='<h3 style="margin:18px 0 8px">Logged conflicts</h3>';}
  var list=S.conflicts.filter(function(c){return c.st==="open"||c.st==="resolved";}).sort(function(a,b){return (a.st==="open"?0:1)-(b.st==="open"?0:1);});
  if(dism) h+='<p class="hint">'+dism+' proposal'+(dism>1?"s":"")+' dismissed.</p>';
  list.forEach(function(c){
    var acts=S.actions.filter(function(a){return a.link===c.id;});
    var dec=c.decision?S.decisions.find(function(x){return x.id===c.decision;}):null;
    h+='<article class="conf'+(c.st==="resolved"?" resolved":"")+'"><header><b>'+c.id+'. '+esc(c.title)+'</b><span style="display:flex;gap:12px">'+pip(c.sev)+pip(c.st)+'</span></header>'+
      '<div class="vs">'+side(c.a)+'<div class="x" aria-hidden="true">≠</div>'+side(c.b)+'</div>'+
      '<footer><span style="flex:1;min-width:220px">'+esc(c.note)+(acts.length?'<br>Action: '+acts.map(function(a){return a.id+' ('+a.role+', due '+fmtDate(a.due)+')';}).join("; "):'')+(dec?'<br>Decision '+dec.id+': '+esc(dec.text):'')+'</span>'+
      (c.st==="open"?(openForm===c.id?'<span style="display:flex;gap:8px;flex:1 1 100%;flex-wrap:wrap"><input type="text" id="decTxt" placeholder="What did the team decide?" style="flex:1;min-width:220px" aria-label="Decision"><button class="btn go" data-savedec="'+c.id+'">Save decision</button><button class="btn" data-canceldec="1">Cancel</button></span>':'<button class="btn" data-resolve="'+c.id+'"'+(S.role==="des"?' disabled title="Switch to Project manager or Engineer to resolve"':'')+'>Log decision</button>'):'')+'</footer></article>';
  });
  return h;
}

function vActions(){
  var mine=S.role==="pm"?"Project manager":S.role==="eng"?"Engineer":"Designer";
  var list=S.actions.slice().sort(function(a,b){var o={open:0,progress:1,done:2};return (o[a.st]-o[b.st])||a.due.localeCompare(b.due);});
  var h='<h2>Action items</h2><p class="lead">Who owes what, and when. Items for your role ('+mine+') are marked. Click a status to move it forward.</p><div class="scroll"><table><thead><tr><th>ID</th><th>Action</th><th>Owner</th><th>Due</th><th>From</th><th>Status</th></tr></thead><tbody>';
  h+=list.map(function(a){var dd=days(a.due),late=a.st!=="done"&&dd<0;
    return '<tr data-link="'+a.link+'"><td class="id">'+a.id+'</td><td>'+(a.role===mine?'<b>'+esc(a.text)+'</b>':esc(a.text))+'</td><td>'+a.role+'</td><td style="white-space:nowrap">'+fmtDate(a.due)+(late?' <span class="flag">late</span>':(a.st!=="done"&&dd<=5?' <span class="stale">'+dd+'d</span>':''))+'</td><td class="id">'+a.link+'</td><td><button class="btn" data-cycle="'+a.id+'" style="padding:3px 8px">'+pip(a.st)+'</button></td></tr>';}).join("");
  return h+'</tbody></table></div>';
}

function vDecisions(){
  var h='<h2>Decision log</h2><p class="lead">What the team decided and why, tied to the finding or conflict behind it.</p><div class="scroll"><table><thead><tr><th>ID</th><th>Date</th><th>Decision</th><th>By</th><th>About</th></tr></thead><tbody>';
  h+=S.decisions.slice().sort(function(a,b){return b.date.localeCompare(a.date);}).map(function(d){return '<tr data-link="'+d.link+'"><td class="id">'+d.id+'</td><td style="white-space:nowrap">'+fmtDate(d.date)+'</td><td>'+esc(d.text)+'</td><td>'+d.who+'</td><td class="id">'+d.link+'</td></tr>';}).join("");
  return h+'</tbody></table></div>';
}

function vVariables(){
  var h='<h2>Project variables</h2><p class="lead">The numbers the design guides read. Each one comes from a finding; values tied to an open conflict are marked so nobody designs to a number that is about to change.</p><div class="scroll"><table class="vars"><thead><tr><th>Variable</th><th>Value</th><th>Units</th><th>Source</th><th>Check</th></tr></thead><tbody>';
  h+=VARS.map(function(v){var f=F(v[3]);var oc=f?openConf(f.id):[];var unv=f&&f.st!=="verified";
    return '<tr'+(f?' data-f="'+f.id+'"':'')+'><td>'+v[0]+'</td><td class="v">'+v[1]+'</td><td>'+v[2]+'</td><td class="id">'+(f?f.id+' ('+D(f.doc).code+', p. '+f.pg+')':'Project setup')+'</td><td>'+(oc.length?'<span class="flag">In conflict '+oc.map(function(c){return c.id;}).join(", ")+'</span>':unv?'<span class="stale">Unverified</span>':'<span class="pip p-verified">Ready</span>')+'</td></tr>';}).join("");
  return h+'</tbody></table></div>';
}

function briefHTML(){
  var by={};designerFindings().forEach(function(f){(by[f.disc]=by[f.disc]||[]).push(f);});
  var oc=S.conflicts.filter(function(c){return c.st==="open";});
  var h='<div class="brief"><h2>Project design brief: '+esc(S.project.name)+'</h2><div class="src">'+esc(S.project.location)+', '+S.project.acres+' ac. Generated '+TODAY.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})+' from verified findings only.</div>';
  Object.keys(by).sort().forEach(function(k){h+='<h3>'+k+'</h3><ul>'+by[k].map(function(f){return '<li>'+esc(f.text)+' <span class="src">['+esc(D(f.doc).code)+' '+esc(D(f.doc).ver)+', p. '+f.pg+']</span></li>';}).join("")+'</ul>';});
  if(oc.length) h+='<h3>Open conflicts (design around these)</h3><ul>'+oc.map(function(c){return '<li><b>'+c.id+'</b> '+esc(c.title)+': '+esc(c.note)+'</li>';}).join("")+'</ul>';
  var unv=S.findings.filter(function(f){return f.st==="unverified";}).length;
  if(unv) h+='<p class="src">'+unv+' findings are still unverified and are not included.</p>';
  return h+'<p class="disc">Demonstration tool with a fictional project. Not for construction or professional use.</p></div>';
}
function vBrief(){return '<div class="toolbar" style="justify-content:space-between"><div><h2 style="margin:0">Design brief</h2><p class="lead" style="margin:2px 0 0">The single reference the design team works from, built from verified findings.</p></div><button class="btn" id="doPrint">Print or save as PDF</button></div>'+briefHTML();}


function VV(name){var v=VARS.find(function(x){return x[0]===name;});return v;}
function linkify(t){return esc(t).replace(/F-[A-Z0-9]+-\d{2}/g,function(m){return F(m)?'<span class="ref" data-f="'+m+'" tabindex="0">'+m+'</span>':m;}).replace(/conflict (C\d)/g,'<span class="ref" data-gotab="conflicts">conflict $1</span>');}
function guideConf(g){return S.conflicts.filter(function(c){return c.st==="open"&&(g.links.indexOf(c.a)>=0||g.links.indexOf(c.b)>=0);});}
function vGuides(){
  var g=GUIDES.find(function(x){return x.id===S.guide;})||GUIDES[0];
  var h='<div class="glayout"><nav class="glist" aria-label="Design guides">'+GUIDES.map(function(x){var n=guideConf(x).length;return '<button class="gbtn" data-guide="'+x.id+'" aria-current="'+(x.id===g.id)+'"><span>'+esc(x.name)+'</span>'+(n?'<span class="cf" title="Open conflicts">'+n+'</span>':'')+'</button>';}).join("")+'</nav><div>';
  h+='<div class="fict"><b>Fictional project.</b> '+esc(S.project.name)+' and every value, criterion, detail number and company in this guide are invented to demonstrate how the tool works. This is not design guidance; real projects follow the governing agency manuals and a licensed engineer.</div>';
  h+='<div class="ghead"><h2>'+esc(g.name)+'</h2><p class="lead">'+esc(g.short)+'. Solutions to drop in, how to build them, what to watch for, and where the details live.</p></div>';
  if(g.inputs.length){h+='<h3 style="margin:10px 0 0;font-size:1rem">Project inputs</h3><div class="chips">'+g.inputs.map(function(n){var v=VV(n);if(!v)return "";var f=F(v[3]);var oc=f?openConf(f.id):[];var cls=oc.length?" bad":(f&&f.st!=="verified"?" warn":"");
    return '<div class="chip'+cls+'"'+(f?' data-f="'+f.id+'" style="cursor:pointer"':'')+' title="'+(oc.length?"In open conflict":f&&f.st!=="verified"?"Unverified":"Verified")+'"><span>'+esc(n)+'</span><b>'+esc(v[1])+' '+esc(v[2])+'</b></div>';}).join("")+'</div>';}
  var oc=guideConf(g), unv=g.links.map(F).filter(function(f){return f&&f.st==="unverified";});
  h+='<div class="checks"><h3>Checks against project documents</h3><ul>';
  if(!oc.length&&!unv.length) h+='<li>No open conflicts or unverified findings affect this guide.</li>';
  oc.forEach(function(c){h+='<li><span class="flag">'+c.id+' '+esc(c.title)+'.</span> '+esc(c.note)+' <span class="ref" data-gotab="conflicts">Open conflicts</span></li>';});
  if(unv.length) h+='<li><span class="stale">'+unv.length+' related finding'+(unv.length>1?'s are':' is')+' unverified:</span> '+unv.map(function(f){return '<span class="ref" data-f="'+f.id+'">'+f.id+'</span>';}).join(", ")+'. Treat those values as provisional.</li>';
  h+='</ul></div>';
  g.sections.forEach(function(sec){
    h+='<section class="gsec"><h3>'+esc(sec.name)+'</h3><p>'+linkify(sec.intro)+'</p>';
    (sec.figs||[]).forEach(function(k){h+='<figure class="gfig" data-fig="'+k+'"></figure>';});
    sec.sol.forEach(function(o){
      h+='<article class="sol"><div class="hd"><b>'+esc(o.n)+'</b><p>'+linkify(o.use)+'</p></div><div class="col"><h4>How to build it</h4><ul>'+o.build.map(function(b){return '<li>'+linkify(b)+'</li>';}).join("")+'</ul></div>'+
        '<div class="col"><h4>Watch for</h4>'+(o.watch.length?'<ul>'+o.watch.map(function(b){return '<li>'+linkify(b)+'</li>';}).join("")+'</ul>':'<p class="hint" style="margin:0">Nothing project-specific.</p>')+'</div><div class="det"><b>Details and specs:</b> '+linkify(o.det)+'</div></article>';
    });
    h+='</section>';
  });
  (g.calc||[]).forEach(function(k){h+=calcHTML(k,g.id);});
  return h+'</div></div>';
}
var CALC={weir:{L:2,H:1.5,C:3.0,d:12,h:4,cd:0.6},pipe:{d:24,s:0.5,n:0.013,q:14},earth:{pond:41.2,cut:38000,fill:96000,shrink:15,bad:1450},taper:{spd:45,w:12}};
function calcHTML(k,gid){
  var c=CALC[k];
  if(k==="pipe"){var san=gid==="san";if(san&&c._m!=="san"){c.d=8;c.s=0.5;c.q=0.6;c._m="san";}if(!san&&c._m==="san"){c.d=24;c.s=0.5;c.q=14;c._m="";}
    return '<div class="calc" data-ck="pipe" data-mode="'+(san?"san":"storm")+'"><h3>Pipe check: full-flow capacity</h3><p class="h">Manning’s equation for a circular pipe flowing full. Demo limits: '+(san?'8 in minimum, at least 2 ft/s.':'24 in minimum, 3 to 10 ft/s.')+'</p><div class="in">'+
      '<label>Diameter (in)<select data-c="d">'+[8,10,12,15,18,21,24,27,30,36,42,48,54,60].map(function(x){return '<option'+(x==c.d?" selected":"")+'>'+x+'</option>';}).join("")+'</select></label>'+
      '<label>Slope (%)<input data-c="s" type="number" step="0.01" value="'+c.s+'"></label><label>Manning’s n<input data-c="n" type="number" step="0.001" value="'+c.n+'"></label><label>Design flow (cfs)<input data-c="q" type="number" step="0.1" value="'+c.q+'"></label></div><div class="calcOut"></div></div>';}
  if(k==="weir") return '<div class="calc" data-ck="weir"><h3>Outlet structure check: weir and orifice</h3><p class="h">Release from the control structure. Compare the total with the allowable outflow ('+esc((VV("Allowable 100-yr outflow")||VV("Allowable release to Cotton Creek")||["","?"])[1])+' cfs). Coefficients vary with shape; demo values.</p><div class="in">'+
      '<label>Weir length (ft)<input data-c="L" type="number" step="0.5" value="'+c.L+'"></label><label>Head on weir (ft)<input data-c="H" type="number" step="0.1" value="'+c.H+'"></label><label>Weir C<input data-c="C" type="number" step="0.05" value="'+c.C+'"></label>'+
      '<label>Orifice diameter (in)<input data-c="d" type="number" step="1" value="'+c.d+'"></label><label>Head on orifice (ft)<input data-c="h" type="number" step="0.1" value="'+c.h+'"></label><label>Orifice Cd<input data-c="cd" type="number" step="0.01" value="'+c.cd+'"></label></div><div class="calcOut"></div></div>';
  if(k==="earth") return '<div class="calc" data-ck="earth"><h3>Earth balance</h3><p class="h">Rough site balance with pond spoil as the main source. 1 ac-ft = 1,613 CY. Demo inputs; replace with the grading model’s numbers.</p><div class="in">'+
      '<label>Pond volume (ac-ft)<input data-c="pond" type="number" step="0.1" value="'+c.pond+'"></label><label>Other cut (CY)<input data-c="cut" type="number" step="500" value="'+c.cut+'"></label><label>Fill needed (CY)<input data-c="fill" type="number" step="500" value="'+c.fill+'"></label><label>Shrinkage (%)<input data-c="shrink" type="number" step="1" value="'+c.shrink+'"></label><label>Unsuitable (CY)<input data-c="bad" type="number" step="50" value="'+c.bad+'"></label></div><div class="calcOut"></div></div>';
  if(k==="taper") return '<div class="calc" data-ck="taper"><h3>Taper length</h3><p class="h">Texas MUTCD-style formulas: L = WS²/60 at 40 mph or less, L = WS at 45 mph or more. Verify against the current manual.</p><div class="in">'+
      '<label>Posted speed (mph)<input data-c="spd" type="number" step="5" value="'+c.spd+'"></label><label>Lateral shift (ft)<input data-c="w" type="number" step="1" value="'+c.w+'"></label></div><div class="calcOut"></div></div>';
  return "";
}
function figVars0(){var num=function(id){var f=F(id);return f?parseFloat(f.val):NaN;};var pv=(F("F-GEO-03")||{val:"7 / 6"}).val.split("/");var tc=CALC.taper,L=tc.spd<=40?tc.w*tc.spd*tc.spd/60:tc.w*tc.spd;
  return {pondDepth:num("F-DIA-04"),gw:num("F-GEO-01"),slope:4,pcc:parseFloat(pv[0]),lss:parseFloat(pv[1]),taper:L,calc:CALC.earth};}
function renderFigs(){if(!window.HUB_FIGS)return;var v=PROJ.figVars?Object.assign(figVars0(),PROJ.figVars(S)):figVars0();document.querySelectorAll("[data-fig]").forEach(function(el){var fn=window.HUB_FIGS[el.getAttribute("data-fig")];if(fn)el.innerHTML=fn(v)+'<figcaption>Schematic for the fictional demo project. Not to scale; not a design detail.</figcaption>';});}
function fmtN(x,d){return isFinite(x)?x.toLocaleString("en-US",{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d==null?0:d}):"—";}
function runCalc(){document.querySelectorAll(".calc").forEach(runOne);renderFigs();}
function runOne(box){
  var out=box.querySelector(".calcOut");if(!out)return;
  var k=box.getAttribute("data-ck"),c=CALC[k];
  box.querySelectorAll("[data-c]").forEach(function(el){var v=parseFloat(el.value);if(isFinite(v))c[el.getAttribute("data-c")]=v;});
  if(k==="weir"){var Qw=c.C*c.L*Math.pow(Math.max(c.H,0),1.5),A=Math.PI*Math.pow(c.d/12,2)/4,Qo=c.cd*A*Math.sqrt(2*32.2*Math.max(c.h,0)),tot=Qw+Qo,allow=parseFloat(String((VV("Allowable 100-yr outflow")||VV("Allowable release to Cotton Creek")||[0,"NaN"])[1]).replace(/,/g,""));
    out.innerHTML='<div class="out"><div><small>Weir flow</small><b>'+fmtN(Qw,1)+'</b> cfs</div><div><small>Orifice flow</small><b>'+fmtN(Qo,1)+'</b> cfs</div><div><small>Total release</small><b>'+fmtN(tot,1)+'</b> cfs</div><div><small>Allowable</small><b>'+fmtN(allow,1)+'</b> cfs</div></div><div class="verdict'+(tot>allow?" bad":"")+'">'+(isFinite(allow)?(tot>allow?"Release exceeds the allowable outflow: shorten the weir or shrink the orifice.":"Within the allowable outflow."):"")+'</div>';}
  if(k==="pipe"){var san=box.getAttribute("data-mode")==="san",D=c.d/12,S=c.s/100,A=Math.PI*D*D/4;
    var Qf=S>0&&c.n>0?0.463/c.n*Math.pow(D,8/3)*Math.sqrt(S):NaN,V=Qf/A,ratio=c.q/Qf;
    var probs=[];if(san&&c.d<8)probs.push("below 8 in minimum");if(!san&&c.d<24)probs.push("below 24 in minimum");
    if(san&&V<2)probs.push("velocity under 2 ft/s");if(!san&&V<3)probs.push("velocity under 3 ft/s");if(!san&&V>10)probs.push("velocity over 10 ft/s");if(ratio>1)probs.push("design flow exceeds capacity");
    out.innerHTML='<div class="out"><div><small>Full capacity</small><b>'+fmtN(Qf,2)+'</b> cfs</div><div><small>Full velocity</small><b>'+fmtN(V,2)+'</b> ft/s</div><div><small>Flow / capacity</small><b>'+fmtN(ratio*100,0)+'</b> %</div></div><div class="verdict'+(probs.length?" bad":"")+'">'+(probs.length?"Check fails: "+probs.join("; ")+".":"Passes the demo limits.")+'</div>';}
  if(k==="earth"){var pondCY=c.pond*1613.33,avail=(pondCY+c.cut-c.bad)*(1-c.shrink/100),net=avail-c.fill;
    out.innerHTML='<div class="out"><div><small>Pond spoil</small><b>'+fmtN(pondCY)+'</b> CY</div><div><small>Usable after shrink</small><b>'+fmtN(avail)+'</b> CY</div><div><small>'+(net>=0?"Export":"Import")+'</small><b>'+fmtN(Math.abs(net))+'</b> CY</div></div><div class="verdict">'+(Math.abs(net)<0.05*c.fill?"Close to balanced (within 5%).":net>0?"Excess material: raise street profiles or plan an export haul.":"Short on material: lower profiles, deepen ponds where groundwater allows, or import select fill.")+'</div>';}
  if(k==="taper"){var L=c.spd<=40?c.w*c.spd*c.spd/60:c.w*c.spd;
    out.innerHTML='<div class="out"><div><small>Merging taper</small><b>'+fmtN(L)+'</b> ft</div><div><small>Shifting taper</small><b>'+fmtN(L/2)+'</b> ft</div><div><small>Shoulder taper</small><b>'+fmtN(L/3)+'</b> ft</div><div><small>Device spacing</small><b>'+fmtN(c.spd)+'</b> ft max</div></div>';}
}
/* ================= DRAWER ================= */
function renderDrawer(){
  var dr=$("drawer");
  if(!sel){dr.hidden=true;$("work").classList.add("nodrawer");return;}
  dr.hidden=false;$("work").classList.remove("nodrawer");
  var f=F(sel),d=D(f.doc),oc=S.conflicts.filter(function(c){return c.a===f.id||c.b===f.id;}),acts=S.actions.filter(function(a){return a.link===f.id||oc.some(function(c){return c.id===a.link;});});
  var q=esc(f.q),txt='…'+'<mark>'+q+'</mark>.…';
  var cm=(S.comments[f.id]||[]);
  var canV=S.role==="eng"&&f.st!=="superseded";
  dr.innerHTML='<button class="btn close" id="closeDr" aria-label="Close details">Close</button><span class="id">'+f.id+'</span><h3>'+esc(f.text)+'</h3>'+
    '<dl class="kv"><dt>Type</dt><dd>'+CAT[f.cat]+'</dd><dt>Discipline</dt><dd>'+f.disc+'</dd>'+(f.val?'<dt>Value</dt><dd class="lcdfont">'+esc(f.val)+' '+esc(f.unit)+'</dd>':'')+
    '<dt>Source</dt><dd>'+esc(d.title)+', '+esc(f.ver||d.ver)+'<br><span class="hint">'+esc(d.author)+'</span></dd><dt>Status</dt><dd>'+pip(f.st)+'</dd></dl>'+
    '<div class="excerpt"><span class="pg">'+(f.ver?esc(f.ver)+', ':'')+'p. '+f.pg+'</span>'+txt+'</div>'+
    '<p style="margin:0 0 10px"><a class="ref" href="'+(PROJ.pdf?PROJ.pdf(f):'sample-project/reports/pdf/'+d.id+'.pdf')+'#page='+f.pg+'" target="_blank" rel="noopener">Open page '+f.pg+' of the report (PDF)</a></p>'+
    (f.st==="superseded"?'<div class="dupbox"><b>Superseded.</b> '+(f.supersededBy?'Replaced by <span class="ref" data-f="'+f.supersededBy+'">'+f.supersededBy+'</span> in a later version.':'Not carried into the latest version of this document.')+'</div>':'')+
    (f.src&&f.src!=="answer-key"?'<p class="hint" style="margin:0 0 8px">Added by AI '+esc(f.src.replace("run-","run "))+'.</p>':'')+
    (f.dupOf&&F(f.dupOf)?'<div class="dupbox"><b>Possible duplicate</b> of <span class="ref" data-f="'+f.dupOf+'">'+f.dupOf+'</span>: '+esc(F(f.dupOf).text)+'</div>':'')+
    (f.review?'<p class="hint">'+(f.st==="verified"?"Verified":"Rejected: "+esc(f.review.reason))+' by '+esc(f.review.by)+', '+fmtDate(f.review.date)+'</p>':'')+
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn go" data-v="verified"'+(canV?'':' disabled')+'>Verify</button>'+
    (f.dupOf?'<button class="btn no" data-rej="duplicate of '+f.dupOf+'"'+(canV?'':' disabled')+'>Reject as duplicate</button>':'')+
    '<button class="btn no" data-rej="not a finding"'+(canV?'':' disabled')+'>Reject: not a finding</button><button class="btn no" data-rej="incorrect"'+(canV?'':' disabled')+'>Reject: incorrect</button>'+
    (f.st!=="unverified"&&canV?'<button class="btn" data-v="unverified">Undo</button>':'')+'</div>'+
    (canV?'':'<p class="hint">Switch to Engineer to review findings.</p>')+
    (oc.length?'<h4>Conflicts</h4><div class="links">'+oc.map(function(c){return '<div>'+pip(c.st)+' <a data-gotab="conflicts">'+c.id+' '+esc(c.title)+'</a></div>';}).join("")+'</div>':'')+
    (acts.length?'<h4>Actions</h4>'+acts.map(function(a){return '<div style="font-size:.86rem;margin:3px 0">'+pip(a.st)+' '+a.id+' '+esc(a.text)+' <span class="hint">('+a.role+', '+fmtDate(a.due)+')</span></div>';}).join(""):'')+
    '<h4>Comments</h4>'+(cm.length?cm.map(function(c){return '<div class="comment"><div class="who">'+c.who+', '+fmtDate(c.date)+'</div>'+esc(c.text)+'</div>';}).join(""):'<p class="hint">No comments yet. Ask a question or note a follow-up.</p>')+
    '<textarea id="newc" placeholder="Add a comment as '+role().n+'" aria-label="New comment"></textarea><button class="btn" id="addc">Add comment</button>';
}

/* ================= RENDER ================= */
function vAboutCC(){
  var P=window.HUB_CC,snaps=P.project.snapshots.map(function(x){var z=window.HUB_SNAPSHOT(P,x.date);return {n:x.name,d:x.date,docs:z.docs.filter(function(d){return d.status!=="requested";}).length,f:z.findings.length,sup:z.history.length,oc:z.conflicts.filter(function(c){return c.st==="open";}).length,rc:z.conflicts.filter(function(c){return c.st==="resolved";}).length,q:z.correspondence.length,qa:z.correspondence.filter(function(q){return q.a;}).length,lots:(z.variables.find(function(v){return v.name==="Single-family lots";})||{}).value,st:(z.variables.find(function(v){return v.name==="Regional detention storage";})||{}).value};});
  var h='<div class="fict"><b>Fictional project.</b> Cotton Creek Ranch, Brazos Fork County and every agency, value and criterion here are invented to stress-test the tool. Nothing here is design guidance.</div>';
  h+='<h2>Cotton Creek Ranch: the stress test</h2><p class="lead">A 1,840-acre master-planned community loaded with complications: wetlands, a growth fault, a historic cemetery, plugged oil wells, a treatment plant and its permit, five lift stations, a bridge, a railroad crossing and two utility districts. Every document version, conflict, decision and message is dated, so the hub can show the project at any point in time.</p>';
  h+='<h3>The same project at two points in time</h3><div class="scroll"><table class="vars"><thead><tr><th></th>'+snaps.map(function(x){return '<th>'+esc(x.n)+' ('+fmtDate(x.d)+')</th>';}).join("")+'</tr></thead><tbody>'+
    [["Documents received",function(x){return x.docs+" of 22";}],["Standing findings",function(x){return x.f;}],["Superseded by revisions",function(x){return x.sup;}],["Open conflicts",function(x){return x.oc;}],["Resolved conflicts",function(x){return x.rc;}],["Questions answered",function(x){return x.qa+" of "+x.q;}],["Single-family lots",function(x){return x.lots;}],["Regional detention (ac-ft)",function(x){return x.st;}]]
    .map(function(r){return '<tr><td>'+r[0]+'</td>'+snaps.map(function(x){return '<td class="v">'+r[1](x)+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
  (P.runs||[]).forEach(function(r){
    h+='<h3 style="margin-top:20px">AI extraction stress test ('+esc(r.id)+')</h3><p class="lead">Claude Code read all 35 document versions using only the reports, the extraction prompt and the checklists, with no access to the answer key. Results were scored by script.</p><div class="scroll"><table class="vars"><tbody>'+
      '<tr><td>Answer-key appearances caught (recall)</td><td class="v">'+r.matched+' of '+r.keyAppearances+' ('+Math.round(r.matched/r.keyAppearances*100)+'%)</td></tr>'+
      '<tr><td>Findings caught in at least one version</td><td class="v">'+r.findingsCaught+' of '+r.keyFindings+'</td></tr>'+
      '<tr><td>Revision changes caught on both sides (old and new value)</td><td class="v">'+r.revisionPairsCaught+' of '+r.revisionPairs+'</td></tr>'+
      '<tr><td>Quotes found word for word on the cited page</td><td class="v">'+r.quotesVerified+' of '+r.extracted+'</td></tr>'+
      '<tr><td>Strict precision (matches ÷ everything extracted)</td><td class="v">'+r.matched+' of '+r.extracted+' ('+Math.round(r.matched/r.extracted*100)+'%)</td></tr>'+
      '<tr><td><b>Wrong or invented findings</b></td><td class="v">'+r.invented+'</td></tr></tbody></table></div>'+
      '<h4 style="margin:12px 0 4px">The '+(r.extracted-r.matched)+' extras, reviewed</h4><ul>'+r.extras.map(function(x){return '<li>'+esc(x[0])+': <b>'+x[1]+'</b></li>';}).join("")+'</ul>';
  });
  h+='<h3 style="margin-top:20px">How it is built</h3><ol class="pipe-steps"><li><b>Scenario as data.</b> 22 documents with 35 versions, 103 findings tagged to the versions they appear in, and the findings each revision replaces.</li><li><b>Reports generated from the data.</b> Every quote sits on its cited page in every version that carries it.</li><li><b>Validation.</b> A script checks IDs, links, version page counts, date order and 130 quotes. On its first run it caught a real mistake: three traffic findings tagged to a 22-page addendum on pages 27 to 45.</li><li><b>Snapshots.</b> The hub replays the dated record to show what was known, open and decided on any date.</li></ol>';
  h+='<p class="hint" style="margin-top:14px">Try it: switch between the two snapshots at the top, open the Timeline, open a document with several versions, and compare the Pond 2, fault and treatment plant figures in the design guides.</p>';
  return h;
}
function vAbout(){
  if(PROJ.id==="cotton-creek") return vAboutCC();
  var runs=S.runs||[],cx=S.crosscheck,h='<div class="fict"><b>Fictional project.</b> Halden Prairie, its reports and every value in this tool are invented to demonstrate the workflow. Nothing here is design guidance.</div>';
  h+='<h2>How this tool works</h2><p class="lead">Due-diligence reports arrive from different consultants. AI pulls out what each one says, an engineer checks it, and everyone designs from the same verified list.</p>';
  h+='<ol class="pipe-steps"><li><b>Reports arrive.</b> Eight fictional reports: drainage, two environmental, geotechnical, land plan, traffic, survey and title, utility district.</li><li><b>AI extracts findings.</b> Claude Code reads each report against a checklist for its type and returns findings with a page number and an exact quote.</li><li><b>Validation.</b> A script confirms every quote really appears on its cited page, so nothing invented gets through.</li><li><b>Cross-check.</b> Findings from different reports about the same place or item are paired for a person to compare.</li><li><b>Engineer review.</b> Each AI finding is verified or rejected (duplicate, not a finding, or incorrect) in the Engineer view.</li><li><b>Design.</b> Verified findings feed the design brief, project variables and design guides.</li></ol>';
  runs.forEach(function(r){
    var mine=S.findings.filter(function(f){return f.src===r.id;}),rev=mine.filter(function(f){return f.st!=="unverified";}),ver=mine.filter(function(f){return f.st==="verified";}).length;
    var why={};mine.filter(function(f){return f.st==="rejected";}).forEach(function(f){var k=(f.review&&f.review.reason||"rejected").replace(/ of F-.*/,"");why[k]=(why[k]||0)+1;});
    var useful=r.matched+ver;
    h+='<h3 style="margin-top:22px">AI '+esc(r.id.replace("run-","run "))+' results</h3><div class="scroll"><table class="vars"><tbody>'+
      '<tr><td>Findings extracted</td><td class="v">'+r.extracted+'</td></tr>'+
      '<tr><td>Known findings caught (recall)</td><td class="v">'+r.matched+' of '+r.keySize+' ('+Math.round(r.matched/r.keySize*100)+'%)</td></tr>'+
      '<tr><td>Quotes found word for word on the cited page</td><td class="v">'+r.extracted+' of '+r.extracted+'</td></tr>'+
      '<tr><td>New findings added for review</td><td class="v">'+r.added+'</td></tr>'+
      '<tr><td>Reviewed so far</td><td class="v">'+rev.length+' of '+r.added+'</td></tr>'+
      '<tr><td>Verified as real and useful</td><td class="v">'+ver+'</td></tr>'+
      Object.keys(why).map(function(k){return '<tr><td>Rejected: '+esc(k)+'</td><td class="v">'+why[k]+'</td></tr>';}).join("")+
      (rev.length===r.added?'<tr><td><b>Useful precision after review</b></td><td class="v">'+useful+' of '+r.extracted+' ('+Math.round(useful/r.extracted*100)+'%)</td></tr>':'<tr><td>Useful precision after review</td><td class="hint">Finish reviewing the '+(r.added-rev.length)+' remaining findings to see it</td></tr>')+
      '</tbody></table></div>';
  });
  if(cx) h+='<h3 style="margin-top:22px">Cross-check</h3><p>'+cx.pairs+' pairs flagged for a look. It rediscovered all '+cx.rediscovered+' of the '+cx.of+' logged conflicts and proposed '+cx.proposed+' more to check on the Conflicts tab.</p>';
  h+='<p class="hint" style="margin-top:18px">Built with plain HTML, CSS and JavaScript, Node.js tools, and Claude Code. Source on GitHub.</p>';
  return h;
}
function vCorr(){
  var list=S.correspondence.filter(function(q){return !corrKind||q.kind===corrKind;}).slice().sort(function(a,b){return b.date.localeCompare(a.date);});
  var kinds=[];S.correspondence.forEach(function(q){if(kinds.indexOf(q.kind)<0)kinds.push(q.kind);});
  var h='<h2>Correspondence</h2><p class="lead">Questions to consultants, agency comments and meeting notes, each tied to the finding it is about. Open items are still waiting on an answer.</p><div class="toolbar"><select id="ckind" aria-label="Type"><option value="">All types</option>'+kinds.map(function(k){return '<option'+(corrKind===k?" selected":"")+'>'+k+'</option>';}).join("")+'</select></div>';
  list.forEach(function(q){var f=F(q.link),c=S.conflicts.find(function(x){return x.id===q.link;});
    h+='<details class="corr"'+(q.a?'':' open')+'><summary><span class="id">'+q.id+'</span> <b>'+esc(q.subject)+'</b> <span class="hint">'+esc(q.kind)+', '+fmtDate(q.date)+', '+esc(q.from)+' to '+esc(q.to)+'</span> '+pip(q.a?"answered":"waiting")+'</summary>'+
      '<div class="qa"><p><b>'+(q.kind==="Meeting"?"Agenda":"Question")+':</b> '+esc(q.q)+'</p>'+(q.a?'<p><b>'+(q.kind==="Meeting"?"Outcome":"Answer")+' ('+fmtDate(q.answered)+'):</b> '+esc(q.a)+'</p>':'<p class="stale">No answer yet'+(SNAP?" as of "+fmtDate(SNAP.date):"")+'. Waiting '+Math.max(0,-days(q.date))+' days.</p>')+
      '<p class="hint">About: '+(f?'<span class="ref" data-f="'+f.id+'">'+f.id+'</span> '+esc(f.text):c?'<span class="ref" data-gotab="conflicts">'+c.id+' '+esc(c.title)+'</span>':esc(q.link))+'</p></div></details>';});
  return h;
}
function vTimeline(){
  var P=window.HUB_CC,cut=SNAP.date,ev=[];
  P.docs.forEach(function(d){d.versions.forEach(function(v){ev.push({d:v.date,k:"doc",t:d.code+" "+v.ver+" received: "+d.title+(v.changes?". "+v.changes:"")});});});
  P.conflicts.forEach(function(c){ev.push({d:c.opened,k:"open",t:"Conflict "+c.id+" opened: "+c.title});if(c.resolved)ev.push({d:c.resolved,k:"res",t:"Conflict "+c.id+" resolved: "+c.title});});
  P.decisions.forEach(function(x){ev.push({d:x.date,k:"dec",t:"Decision "+x.id+": "+x.text});});
  P.correspondence.forEach(function(q){ev.push({d:q.date,k:"q",t:q.kind+" "+q.id+": "+q.subject});});
  ev.sort(function(a,b){return a.d.localeCompare(b.d);});
  var shown=ev.filter(function(e){return e.d<=cut;}),hidden=ev.length-shown.length,h='<h2>Timeline</h2><p class="lead">Everything that happened on the project, in order, up to the '+esc(SNAP.name.toLowerCase())+' snapshot ('+fmtDate(SNAP.date)+').</p>';
  var LAB={doc:"Document",open:"Conflict opened",res:"Conflict resolved",dec:"Decision",q:"Correspondence"},mon="";
  h+='<ol class="tl">';
  shown.forEach(function(e){var m=new Date(e.d+"T00:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"});if(m!==mon){h+='<li class="tm">'+m+'</li>';mon=m;}
    h+='<li class="te te-'+e.k+'"><span class="td">'+fmtDate(e.d)+'</span><span class="tk">'+LAB[e.k]+'</span><span>'+esc(e.t)+'</span></li>';});
  h+='<li class="tm now">Snapshot: '+esc(SNAP.name)+', '+fmtDate(SNAP.date)+'</li></ol>';
  if(hidden) h+='<p class="hint">'+hidden+' later events are hidden in this snapshot. Switch to the final snapshot to see them.</p>';
  return h;
}
var VIEWS={correspondence:vCorr,timeline:vTimeline,about:vAbout,documents:vDocuments,findings:vFindings,conflicts:vConflicts,actions:vActions,decisions:vDecisions,variables:vVariables,brief:vBrief,guides:vGuides};
function render(){
  $("projName").textContent=S.project.name;document.title=S.project.name+" — Site Development Hub";
  $("projMeta").textContent=S.project.location+", "+S.project.acres+" ac, "+S.project.type.toLowerCase();
  $("projSel").innerHTML=window.HUB_PROJECTS.map(function(p){return '<option value="'+p.id+'"'+(p.id===PROJ.id?" selected":"")+'>'+esc(p.name)+' ('+esc(p.short)+')</option>';}).join("");
  $("snapSeg").hidden=!SNAPS;
  if(SNAPS) $("snapSeg").innerHTML=SNAPS.map(function(x){return '<button data-snap="'+x.id+'" aria-pressed="'+(SNAP.id===x.id)+'">'+esc(x.name)+'</button>';}).join("");
  $("roleSeg").innerHTML=ROLES.map(function(r){return '<button data-role="'+r.k+'" aria-pressed="'+(S.role===r.k)+'">'+r.n+'</button>';}).join("");
  $("btnTheme").textContent=curTheme()==="dark"?"Light mode":"Dark mode";
  renderLCD();renderTabs();
  $("main").innerHTML=VIEWS[S.tab]();
  renderDrawer();
  runCalc();
}

/* ================= EVENTS ================= */
document.addEventListener("input",function(e){
  if(e.target.closest&&e.target.closest(".calc")){runCalc();return;}
  var id=e.target.id; if(id==="fq"){filt.q=e.target.value;var p=e.target.selectionStart;$("main").innerHTML=vFindings();var n=$("fq");n.focus();n.setSelectionRange(p,p);}
});
document.addEventListener("change",function(e){var id=e.target.id;if(e.target.closest&&e.target.closest(".calc")){runCalc();return;}
  if(id==="fdisc"){filt.disc=e.target.value;$("main").innerHTML=vFindings();}
  if(id==="fst"){filt.st=e.target.value;$("main").innerHTML=vFindings();}
  if(id==="fcat"){filt.cat=e.target.value;$("main").innerHTML=vFindings();}
  if(id==="fsrc"){filt.src=e.target.value;$("main").innerHTML=vFindings();}
  if(id==="ckind"){corrKind=e.target.value;$("main").innerHTML=vCorr();}
  if(id==="projSel"){loadProject(e.target.value,PSEL.snap,true);docHist=null;render();}
});
document.addEventListener("click",function(e){
  var t=e.target;
  var row=t.closest("[data-f]"); if(row&&!t.closest("button")){sel=row.getAttribute("data-f");render();if(window.innerWidth<1050)$("drawer").scrollIntoView({behavior:"smooth"});return;}
  var lr=t.closest("tr[data-link]"); if(lr&&!t.closest("button")){var l=lr.getAttribute("data-link");if(l.indexOf("F-")===0){sel=l;}else{S.tab="conflicts";}save();render();return;}
  var hs0=t.closest("[data-hist]"); if(hs0){docHist=hs0.getAttribute("data-hist")||null;S.tab="documents";render();return;}
  var doc=t.closest("[data-doc]"); if(doc){filt={q:"",disc:"",st:"",cat:"",src:""};var dd=D(doc.getAttribute("data-doc"));filt.q=dd.title;S.tab="findings";save();render();return;}
  var gb=t.closest("[data-guide]"); if(gb){S.guide=gb.getAttribute("data-guide");save();render();$("main").scrollIntoView({block:"start"});return;}
  if(t.closest("#closeDr")){sel=null;render();return;}
  var v=t.closest("[data-v]"); if(v&&sel){var ff=F(sel),nv=v.getAttribute("data-v");ff.st=nv;if(nv==="unverified")delete ff.review;else ff.review={reason:"verified",by:role().n,date:new Date().toISOString().slice(0,10)};save();render();return;}
  var rj=t.closest("[data-rej]"); if(rj&&sel){var fr=F(sel);fr.st="rejected";fr.review={reason:rj.getAttribute("data-rej"),by:role().n,date:new Date().toISOString().slice(0,10)};save();render();return;}
  var cf=t.closest("[data-confirm]"); if(cf){var cc=S.conflicts.find(function(x){return x.id===cf.getAttribute("data-confirm");});cc.st="open";cc.title=cc.title.replace(/^Check: /,"");save();render();return;}
  var dm=t.closest("[data-dismiss]"); if(dm){var cd=S.conflicts.find(function(x){return x.id===dm.getAttribute("data-dismiss");});cd.st="dismissed";save();render();return;}
  if(t.closest("#addc")){var tx=$("newc").value.trim();if(!tx)return;(S.comments[sel]=S.comments[sel]||[]).push({who:role().n,date:new Date().toISOString().slice(0,10),text:tx});save();render();return;}
  var cy=t.closest("[data-cycle]"); if(cy){var a=S.actions.find(function(x){return x.id===cy.getAttribute("data-cycle");});a.st={open:"progress",progress:"done",done:"open"}[a.st];save();render();return;}
  var rs=t.closest("[data-resolve]"); if(rs){openForm=rs.getAttribute("data-resolve");render();var i=$("decTxt");if(i)i.focus();return;}
  if(t.closest("[data-canceldec]")){openForm=null;render();return;}
  var sd=t.closest("[data-savedec]"); if(sd){var c=S.conflicts.find(function(x){return x.id===sd.getAttribute("data-savedec");});var txt=($("decTxt").value||"").trim();if(!txt){$("decTxt").focus();return;}
    var id="DEC-"+String(S.decisions.length+1).padStart(2,"0");S.decisions.push({id:id,date:new Date().toISOString().slice(0,10),who:role().n,text:txt,link:c.id});c.st="resolved";c.decision=id;openForm=null;save();render();return;}
  var hs=t.closest("[data-hist]"); if(hs){docHist=hs.getAttribute("data-hist")||null;S.tab="documents";render();e.preventDefault();e.stopPropagation();return;}
  var gt=t.closest("[data-gotab]"); if(gt){S.tab=gt.getAttribute("data-gotab");save();render();return;}
  if(t.closest("#doPrint")){doPrint();return;}
});
document.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.classList.contains("side")){sel=e.target.getAttribute("data-f");render();}});
function doPrint(){$("printArea").innerHTML=briefHTML();window.print();}
function curTheme(){var t=document.documentElement.getAttribute("data-theme");if(t)return t;return window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
try{var th=localStorage.getItem("hubTheme");if(th)document.documentElement.setAttribute("data-theme",th);}catch(e){}
$("btnTheme").addEventListener("click",function(){var n=curTheme()==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("hubTheme",n);}catch(e){}render();});
try{window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",function(){render();});}catch(e){}
$("snapSeg").addEventListener("click",function(e){var b=e.target.closest("[data-snap]");if(!b||b.getAttribute("data-snap")===SNAP.id)return;loadProject(PROJ.id,b.getAttribute("data-snap"),true);docHist=null;render();});
$("roleSeg").addEventListener("click",function(e){var b=e.target.closest("[data-role]");if(!b)return;var r=ROLES.find(function(x){return x.k===b.getAttribute("data-role");});if(r.k===S.role)return;S.role=r.k;S.tab=r.tab;filt={q:"",disc:"",st:"",cat:"",src:""};save();render();});
$("btnPrint").addEventListener("click",function(){S.tab="brief";save();render();});
$("btnReset").addEventListener("click",function(){var b=$("btnReset");if(!resetArmed){resetArmed=true;b.textContent="Press again to reset";clearTimeout(rt);rt=setTimeout(function(){resetArmed=false;b.textContent="Reset demo";},3000);return;}resetArmed=false;clearTimeout(rt);b.textContent="Reset demo";var r=S.role,tb=S.tab;S=fresh();S.role=r;S.tab=tb;S.tab=ROLES.find(function(x){return x.k===r;}).tab;sel=null;save();render();});

render();
})();
