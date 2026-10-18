/* Project registry and the snapshot engine.
   A versioned project (like Cotton Creek Ranch) is stored with every document version, finding, conflict,
   decision and message dated. snapshot(project, date) rebuilds the project exactly as it stood on that date. */
(function(){
"use strict";
function verKind(v){return /^(Addendum|Amendment)/i.test(v)?"cumulative":"replace";}
function addDays(s,n){var d=new Date(s+"T00:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}

function snapshot(P,date){
  var docs=[],cur=[],hist=[],vdate={};
  P.docs.forEach(function(d){d.versions.forEach(function(v){vdate[d.id+"|"+v.ver]=v.date;});});
  var byDoc={};P.findings.forEach(function(f){(byDoc[f.doc]=byDoc[f.doc]||[]).push(f);});
  P.docs.forEach(function(d){
    var got=d.versions.filter(function(v){return v.date<=date;});
    if(!got.length){docs.push({id:d.id,code:d.code,title:d.title,author:d.author,ver:"Not yet received",date:"",status:"requested",pages:0,history:[]});return;}
    var last=got[got.length-1],isFinal=last===d.versions[d.versions.length-1];
    var age=(new Date(date)-new Date(last.date))/864e5;
    var status=age<14?"review":(isFinal?(last.status==="superseded"?"accepted":last.status):"accepted");
    docs.push({id:d.id,code:d.code,title:d.title,author:d.author,ver:last.ver,date:last.date,status:status,pages:last.pages,history:got.map(function(v){return {ver:v.ver,date:v.date,pages:v.pages,changes:v.changes};})});
    // walk versions to find which findings stand at this date
    var set={};
    got.forEach(function(v){
      var inV=(byDoc[d.id]||[]).filter(function(f){return f.vers.indexOf(v.ver)>=0;});
      if(verKind(v.ver)==="replace") set={};
      inV.forEach(function(f){set[f.id]={f:f,ver:v.ver,pages:v.pages};});
    });
    // drop anything superseded by a finding that also stands
    Object.keys(set).forEach(function(k){var s=set[k].f.supersedes;if(s&&set[s])delete set[s];});
    (byDoc[d.id]||[]).forEach(function(f){
      var first=f.vers.map(function(v){return vdate[d.id+"|"+v];}).sort()[0];
      if(first>date) return;
      var standing=set[f.id];
      var rec={id:f.id,doc:f.doc,cat:f.cat,disc:f.disc,text:f.text,val:f.val,unit:f.unit,pg:f.pg,q:f.q,
        ver:standing?standing.ver:f.vers.filter(function(v){return vdate[d.id+"|"+v]<=date;}).pop(),
        vers:f.vers.slice(),supersedes:f.supersedes,first:first,
        st:standing?(f.verifiedOn<=date?"verified":"unverified"):"superseded",src:"answer-key"};
      if(!standing){var by=(byDoc[d.id]||[]).find(function(x){return x.supersedes===f.id&&set[x.id];});if(by)rec.supersededBy=by.id;}
      (standing?cur:hist).push(rec);
    });
  });
  var known={};cur.concat(hist).forEach(function(f){known[f.id]=1;});
  var conflicts=P.conflicts.filter(function(c){return c.opened<=date;}).map(function(c){var res=c.resolved&&c.resolved<=date;
    return {id:c.id,sev:c.sev,title:c.title,a:c.a,b:c.b,note:c.note,opened:c.opened,st:res?"resolved":"open",decision:res?c.decision:undefined,resolvedOn:res?c.resolved:undefined};});
  var decisions=P.decisions.filter(function(d){return d.date<=date;});
  var exists=function(l){return known[l]||conflicts.some(function(c){return c.id===l;});};
  var actions=P.actions.filter(function(a){return exists(a.link);}).map(function(a){return {id:a.id,text:a.text,role:a.role,due:a.due,link:a.link,st:a.done&&a.done<=date?"done":"open"};});
  var corr=P.correspondence.filter(function(q){return q.date<=date;}).map(function(q){var ans=q.answered&&q.answered<=date;return {id:q.id,kind:q.kind,date:q.date,from:q.from,to:q.to,subject:q.subject,q:q.q,a:ans?q.a:null,answered:ans?q.answered:null,link:q.link};});
  // variables: first candidate finding that stands at this date
  var vars=(P.variables||[]).map(function(v){
    if(!v[3]) return {name:v[0],value:v[1],units:v[2],source:"project"};
    var f=null;for(var i=0;i<v[3].length;i++){f=cur.find(function(x){return x.id===v[3][i];});if(f)break;}
    if(!f) return null;
    return {name:v[0],value:v[1]||f.val,units:v[2]||f.unit,source:f.id};
  }).filter(Boolean);
  return {project:Object.assign({},P.project,{asOf:date}),docs:docs,findings:cur,history:hist,conflicts:conflicts,actions:actions,decisions:decisions,comments:{},correspondence:corr,variables:vars,_note:P._note};
}

function ccFigVars(S){
  var has=function(id){return S.findings.some(function(f){return f.id===id;});};
  var openC=function(id){return S.conflicts.some(function(c){return c.id===id&&c.st==="open";});};
  var flt=has("P-FLT-03")?{up:50,down:100}:{up:100,down:100};
  return {pondDepth:10,gw:4,slope:4,pcc:8,lss:8,paveSrc:"P-GEO-03",pond2East:has("P-MDP-09"),pond2Conflict:openC("X01"),faultUp:flt.up,faultDown:flt.down,faultLots:openC("X04"),
    plantBuffer:has("P-LP-11")?300:150,plantConflict:openC("X09"),freeboard:2,rise:3.5,bridgeOpen:openC("X14")};
}

window.HUB_SNAPSHOT=snapshot;
window.HUB_PROJECTS=[
  {id:"halden",name:"Halden Prairie",short:"62 ac, 8 reports",load:function(){return {seed:window.HUB_PROJECT,guides:window.HUB_GUIDES,snaps:null};}},
  {id:"cotton-creek",name:"Cotton Creek Ranch",short:"1,840 ac, 22 documents",pdf:function(f){return "sample-project/cotton-creek/reports/pdf/"+f.doc+"_"+String(f.ver).replace(/ /g,"-")+".pdf";},
   figVars:ccFigVars,
   load:function(snap){var P=window.HUB_CC;var s=P.project.snapshots.find(function(x){return x.id===snap;})||P.project.snapshots[P.project.snapshots.length-1];return {seed:snapshot(P,s.date),guides:window.HUB_GUIDES_CC,snaps:P.project.snapshots,snap:s};}}
];
})();
