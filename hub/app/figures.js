/* Design guide figures. Fictional demo project: schematic, not to scale, not design details.
   Each figure returns SVG markup. Data-driven figures read the project's variables. */
(function(){
"use strict";
function svg(w,h,body,title){return '<svg class="fig" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+title+'"><title>'+title+'</title>'+body+'</svg>';}
function t(x,y,s,cls,anchor){return '<text x="'+x+'" y="'+y+'" class="'+(cls||"lb")+'"'+(anchor?' text-anchor="'+anchor+'"':'')+'>'+s+'</text>';}
function dim(x1,x2,y,label){return '<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" class="dm" marker-start="url(#ar)" marker-end="url(#ar)"/>'+t((x1+x2)/2,y-6,label,"lb sm","middle");}
function vdim(x,y1,y2,label,side){return '<line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'" class="dm" marker-start="url(#ar)" marker-end="url(#ar)"/>'+t(x+(side==="l"?-6:6),(y1+y2)/2+4,label,"lb sm",side==="l"?"end":"start");}
var DEFS='<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" class="fh"/></marker><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="ht"/></pattern><pattern id="soil" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r="1" class="dot"/><circle cx="7" cy="8" r="1" class="dot"/></pattern></defs>';

var FIG={};

FIG.stormPlan=function(){return svg(720,300,DEFS+
 '<rect x="20" y="40" width="440" height="34" class="road"/><rect x="20" y="170" width="440" height="34" class="road"/><rect x="200" y="74" width="34" height="96" class="road"/>'+
 t(30,34,"Street A")+t(30,224,"Street B")+
 [[60,74],[180,74],[300,74],[420,74],[60,170],[180,170],[300,170],[420,170]].map(function(p){return '<rect x="'+(p[0]-7)+'" y="'+(p[1]-(p[1]===74?0:8))+'" width="14" height="8" class="inlet"/>';}).join("")+
 '<path d="M60 82 L60 122 L420 122 M420 82 L420 122 M180 82 L180 122 M300 82 L300 122 M60 170 L60 122 M180 170 L180 122 M300 170 L300 122 M420 170 L420 122" class="pipe-sm"/>'+
 '<path d="M60 122 L500 122" class="pipe" marker-end="url(#fl)"/>'+
 [60,180,300,420].map(function(x){return '<circle cx="'+x+'" cy="122" r="7" class="mh"/>';}).join("")+
 '<path d="M500 80 Q560 70 600 95 Q630 130 600 165 Q560 190 505 170 Q485 125 500 80Z" class="pond"/>'+t(530,128,"Pond B","lb b")+
 '<rect x="606" y="118" width="16" height="22" class="struct"/><path d="M622 129 L660 129" class="pipe" marker-end="url(#fl)"/>'+
 '<path d="M670 20 Q690 80 668 140 Q650 210 676 290" class="chan"/>'+t(694,276,"Brannock Gully","lb sm","end")+
 t(70,140,"Leads 24 in min.","lb sm")+t(250,116,"Trunk line to pond","lb sm")+t(610,112,"Control structure","lb sm","middle")+t(640,160,"Outfall","lb sm")+
 '<g transform="translate(20,250)"><rect x="0" y="0" width="12" height="7" class="inlet"/>'+t(18,8,"Curb inlet","lb sm")+'<circle cx="106" cy="4" r="6" class="mh"/>'+t(116,8,"Manhole","lb sm")+'<line x1="180" y1="4" x2="210" y2="4" class="pipe"/>'+t(216,8,"Storm sewer","lb sm")+'</g>',
 "Plan of the onsite storm sewer: curb inlets feed leads to a trunk line, through manholes, into Pond B, then a control structure and outfall to Brannock Gully");};

FIG.stormProfile=function(){return svg(720,240,DEFS+
 '<path d="M20 60 L700 90" class="ground"/>'+t(24,52,"Finished grade","lb sm")+
 '<path d="M60 130 L640 178" class="pipe"/><path d="M60 118 L640 166" class="pipe-crown"/>'+
 [60,250,450,640].map(function(x,i){var gy=60+30*(x-20)/680,iy=130+48*(x-60)/580;return '<rect x="'+(x-9)+'" y="'+gy+'" width="18" height="'+(iy-gy+8)+'" class="mhp"/>';}).join("")+
 '<path d="M60 96 L640 150" class="hgl"/>'+t(470,128,"Hydraulic grade line","lb sm hl")+
 vdim(340,60+30*320/680+1,118+48*280/580-1,"Cover 2 ft min. (demo)","r")+
 t(120,196,"Slope sets velocity: 3 to 10 ft/s full flow (demo)","lb sm")+t(60,226,"Keep the hydraulic grade line below inlet rims for the design storm","lb sm"),
 "Profile of a storm sewer run between manholes, showing ground, pipe, cover and hydraulic grade line");};

FIG.weir=function(){return svg(720,280,DEFS+
 '<rect x="250" y="40" width="22" height="210" class="conc"/><rect x="250" y="40" width="22" height="210" fill="url(#hatch)"/>'+
 '<path d="M40 110 L250 110" class="wsurf"/><rect x="40" y="110" width="210" height="140" class="water"/>'+
 '<rect x="250" y="190" width="22" height="22" class="void"/>'+t(232,206,"Orifice","lb sm","end")+
 '<rect x="250" y="140" width="22" height="6" class="crest"/>'+t(278,138,"Weir crest","lb sm")+
 vdim(220,110,140,"H (head over crest)","l")+
 '<path d="M272 146 Q330 150 360 245" class="nappe"/><path d="M272 201 Q310 205 330 248" class="nappe"/>'+
 '<path d="M272 250 L700 250" class="ground"/>'+t(60,100,"Pond water surface","lb sm")+
 '<g transform="translate(420,60)">'+t(0,0,"Weir: Q = C × L × H^1.5","lb b")+t(0,22,"C ≈ 3.0 to 3.3 (shape-dependent)","lb sm")+t(0,40,"L = crest length (ft), H = head (ft)","lb sm")+
 t(0,74,"Orifice: Q = Cd × A × √(2gH)","lb b")+t(0,96,"Cd ≈ 0.6, A = opening area (sq ft)","lb sm")+t(0,114,"H = head above orifice center (ft)","lb sm")+
 t(0,148,"The orifice sets low-flow release;","lb sm")+t(0,166,"the weir passes larger storms.","lb sm")+'</g>',
 "Section through a detention pond outlet structure showing an orifice for low flows and a weir crest for larger storms, with the weir and orifice equations");};

FIG.pondSection=function(v){
 var depth=v.pondDepth||8,gw=v.gw||5.5,slope=v.slope||4,scale=18,top=70,w=720;
 var bot=top+depth*scale,gwy=top+gw*scale,run=Math.min(depth*slope*5,200);
 var bad=gw<depth;
 return svg(w,300,DEFS+
 '<path d="M20 '+top+' L130 '+top+' L'+(130+run)+' '+bot+' L'+(590-run)+' '+bot+' L590 '+top+' L700 '+top+' L700 290 L20 290Z" class="soilf"/><path d="M20 '+top+' L130 '+top+' L'+(130+run)+' '+bot+' L'+(590-run)+' '+bot+' L590 '+top+' L700 '+top+' L700 290 L20 290Z" fill="url(#soil)"/>'+
 '<path d="M20 '+top+' L130 '+top+' L'+(130+run)+' '+bot+' L'+(590-run)+' '+bot+' L590 '+top+' L700 '+top+'" class="ground"/>'+
 '<line x1="20" y1="'+gwy+'" x2="700" y2="'+gwy+'" class="gw"/>'+t(26,gwy+16,"Groundwater "+gw+" ft below grade (F-GEO-01)","lb sm gwl")+
 vdim(600,top,bot,"","l")+t(606,top+20,"Pond depth","lb sm")+t(606,top+36,depth+" ft (F-DIA-04)","lb sm")+
 t(130+run/2-14,top+(bot-top)/2-8,slope+"H:1V","lb sm","end")+
 '<rect x="40" y="'+(top-10)+'" width="90" height="10" class="berm"/>'+t(40,top-16,"15-ft maintenance berm (demo)","lb sm")+
 (bad?'<rect x="'+(130+run)+'" y="'+gwy+'" width="'+(460-2*run)+'" height="'+(bot-gwy)+'" class="badzone"/>'+t(360,bot+28,"Bottom "+(depth-gw).toFixed(1)+" ft below groundwater: dewatering and liner needed (conflict C2)","lb sm hl","middle"):t(360,bot+28,"Bottom above groundwater","lb sm","middle")),
 "Cross-section of Pond B from project data: depth "+depth+" ft, side slopes "+slope+" to 1, groundwater "+gw+" ft below grade"+(bad?", so the bottom sits below groundwater":""));};

FIG.paveSection=function(v){
 var pc=v.pcc||7,ls=v.lss||6,s=14;
 return svg(720,300,DEFS+
 '<rect x="80" y="40" width="460" height="'+pc*s+'" class="conc"/>'+t(310,40+pc*s/2+5,pc+" in concrete pavement ("+(v.paveSrc||"F-GEO-03")+")","lb b","middle")+
 '<rect x="80" y="'+(40+pc*s)+'" width="460" height="'+ls*s+'" class="lime"/>'+t(310,40+pc*s+ls*s/2+5,ls+" in lime-stabilized subgrade","lb","middle")+
 '<rect x="80" y="'+(40+(pc+ls)*s)+'" width="460" height="40" class="soilf"/><rect x="80" y="'+(40+(pc+ls)*s)+'" width="460" height="40" fill="url(#soil)"/>'+t(310,40+(pc+ls)*s+26,"Compacted clay subgrade (high PI)","lb","middle")+
 '<path d="M540 40 L560 40 L560 '+(40+pc*s)+' L540 '+(40+pc*s)+'" class="ln"/>'+t(566,52,"Curb and gutter","lb sm")+
 vdim(60,40,40+pc*s,pc+'"',"l")+vdim(60,40+pc*s,40+(pc+ls)*s,ls+'"',"l")+
 t(80,(40+(pc+ls)*s)+64,"Joints at 15 ft max., sealed (demo). Lime rate confirmed by lab testing.","lb sm"),
 "Typical residential street section: "+pc+" inches of concrete on "+ls+" inches of lime-stabilized subgrade over clay");};

FIG.padSection=function(){return svg(720,230,DEFS+
 '<rect x="160" y="50" width="400" height="18" class="conc"/>'+t(360,64,"Post-tensioned slab","lb sm","middle")+
 '<path d="M110 68 L610 68 L650 128 L70 128Z" class="select"/>'+t(360,104,"2 ft select fill, PI 10 to 20, 8-in lifts (F-GEO-04)","lb","middle")+
 '<rect x="20" y="128" width="680" height="80" class="soilf"/><rect x="20" y="128" width="680" height="80" fill="url(#soil)"/>'+t(360,170,"High-plasticity clay, PI 38 to 52","lb","middle")+
 vdim(640,68,128,"2 ft","r")+t(20,40,"Finished floor at or above 51.8 ft (F-DIA-07)","lb sm"),
 "Building pad section: slab on 2 feet of select fill over high-plasticity clay");};

FIG.sanProfile=function(){return svg(720,300,DEFS+
 '<path d="M20 50 L520 70 L700 70" class="ground"/>'+
 '<path d="M40 110 L470 190" class="pipe san"/>'+[40,180,320,460].map(function(x){var gy=50+20*(x-20)/500,iy=110+80*(x-40)/430;return '<rect x="'+(x-8)+'" y="'+gy+'" width="16" height="'+(iy-gy+6)+'" class="mhp"/>';}).join("")+
 '<rect x="480" y="72" width="90" height="150" class="struct2"/><rect x="484" y="160" width="82" height="58" class="water"/>'+t(525,240,"Lift station LS-2","lb b","middle")+
 '<rect x="498" y="186" width="18" height="24" class="pump"/><rect x="534" y="186" width="18" height="24" class="pump"/>'+t(525,110,"Wet well,","lb sm","middle")+t(525,126,"duplex pumps","lb sm","middle")+
 '<path d="M570 100 L700 100" class="pipe fm" marker-end="url(#fl)"/>'+t(600,92,"Force main","lb sm")+
 t(40,250,"8 in PVC gravity, 0.33% min. for 8 in (demo). Manholes 400 ft max. spacing (demo).","lb sm")+t(40,270,"Trenches over 5 ft need a trench safety system (F-GEO-05)","lb sm"),
 "Sanitary profile: gravity main with manholes falling to lift station LS-2, which pumps into a force main");};

FIG.waterLoop=function(){var b='';
 b+='<rect x="120" y="50" width="460" height="170" class="wloop"/><line x1="350" y1="50" x2="350" y2="220" class="wloop-l"/>';
 b+='<path d="M20 135 L120 135" class="wmain"/>'+t(24,127,"12 in existing main","lb sm");
 [[120,100],[350,140],[580,90],[230,50],[470,220]].forEach(function(p){b+='<path d="M'+(p[0]-7)+' '+(p[1]-6)+' L'+(p[0]+7)+' '+(p[1]+6)+' L'+(p[0]+7)+' '+(p[1]-6)+' L'+(p[0]-7)+' '+(p[1]+6)+'Z" class="valve"/>';});
 [[180,50],[300,220],[470,50],[580,170],[350,90]].forEach(function(p){b+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="7" class="hyd"/>';});
 b+=t(360,40,"8 in looped mains (F-MUD-02)","lb sm","middle")+t(600,140,"Hydrants 500 ft","lb sm")+t(600,156,"max. spacing (demo)","lb sm");
 b+='<g transform="translate(140,250)"><path d="M0 -6 L14 6 L14 -6 L0 6Z" class="valve"/>'+t(20,4,"Valve","lb sm")+'<circle cx="90" cy="0" r="6" class="hyd"/>'+t(100,4,"Fire hydrant","lb sm")+'</g>';
 return svg(720,270,DEFS+b,"Water distribution plan: tie-in to the 12-inch main, looped 8-inch mains with valves and fire hydrants");};

FIG.crossing=function(){return svg(720,250,DEFS+
 '<path d="M20 40 L700 40" class="ground"/><rect x="20" y="40" width="680" height="200" class="soilf"/><rect x="20" y="40" width="680" height="200" fill="url(#soil)"/>'+
 '<circle cx="200" cy="110" r="16" class="wpipe"/>'+t(200,82,"Water","lb sm","middle")+
 '<circle cx="200" cy="190" r="20" class="spipe"/>'+t(232,195,"Sanitary","lb sm")+
 vdim(150,126,170,"2 ft min. (demo)","l")+
 '<circle cx="520" cy="110" r="16" class="wpipe"/><circle cx="520" cy="160" r="20" class="spipe"/><rect x="490" y="132" width="60" height="58" class="encase"/>'+t(520,226,"Where separation can’t be met:","lb sm","middle")+t(520,242,"encase or use pressure pipe (demo)","lb sm","middle")+
 t(340,70,"Horizontal: 9 ft between parallel","lb sm","middle")+t(340,86,"water and sanitary (demo)","lb sm","middle"),
 "Utility crossing section: water at least 2 feet above sanitary, with encasement where separation can’t be met");};

FIG.easement=function(){var b='';
 b+='<line x1="20" y1="60" x2="700" y2="60" class="pl"/>'+t(24,52,"North property line","lb sm");
 b+='<rect x="20" y="60" width="680" height="60" class="esmt"/><line x1="20" y1="90" x2="700" y2="90" class="gasline"/>'+t(560,84,"Gas pipeline","lb sm");
 b+=vdim(690,60,120,"30 ft","l");
 b+='<rect x="20" y="60" width="680" height="60" fill="url(#hatch)" opacity=".35"/>'+t(30,112,"30-ft pipeline easement: no structures, fences or trees (F-EAS-01)","lb sm");
 [0,1,2,3].forEach(function(i){var x=140+i*110;b+='<rect x="'+x+'" y="96" width="104" height="120" class="lot"/>'+t(x+52,170,"Lot "+(44+i),"lb","middle");});
 b+='<rect x="140" y="96" width="434" height="24" class="badzone"/>'+t(357,236,"Rear 12 to 18 ft of Lots 44 to 47 fall inside the easement (conflict C1)","lb sm hl","middle");
 return svg(720,250,DEFS+b,"Plan of the north line: lots 44 to 47 extend into the 30-foot pipeline easement");};

FIG.tcp=function(v){var L=Math.round(v.taper||540),b='';
 b+='<rect x="20" y="70" width="680" height="100" class="road"/><line x1="20" y1="120" x2="700" y2="120" class="stripe"/>';
 b+='<path d="M200 170 L460 120 L640 120 L640 170Z" class="work"/>'+t(560,150,"Work zone","lb b","middle");
 for(var i=0;i<=8;i++){var x=200+i*32.5,y=170-i*6.25;b+='<circle cx="'+x+'" cy="'+y+'" r="3.5" class="cone"/>';}
 b+=dim(200,460,196,"Merging taper "+L+" ft (from the check below)");
 b+='<path d="M600 95 L520 95" class="ln" marker-end="url(#fl)"/>'+t(610,99,"Traffic","lb sm");
 [60,110,160].forEach(function(x,i){b+='<rect x="'+(x-9)+'" y="178" width="18" height="18" transform="rotate(45 '+x+' 187)" class="sign"/>';});
 b+=t(110,226,"Advance warning signs","lb sm","middle");
 return svg(720,240,DEFS+b,"Lane closure plan with advance warning signs, a merging taper of "+L+" feet and the work zone");};

FIG.turnLane=function(){var b='';
 b+='<rect x="20" y="60" width="680" height="80" class="road"/><line x1="20" y1="100" x2="700" y2="100" class="stripe"/>';
 b+='<path d="M180 140 L280 168 L560 168 L560 140Z" class="road"/>'+'<rect x="560" y="140" width="60" height="120" class="road"/>'+t(590,276,"Entrance","lb sm","middle");
 b+=dim(180,280,190,"Taper 100 ft")+dim(280,560,190,"Storage 150 ft (F-TIA-02)");
 b+='<path d="M640 120 L540 120" class="ln" marker-end="url(#fl)"/>'+t(560,112,"Westbound","lb sm");
 return svg(720,290,DEFS+b,"Plan of the westbound right-turn lane: 100-foot taper and 150 feet of storage into the entrance");};

FIG.lotTypes=function(){var b='';
 b+=t(170,30,"Type A: drains to street","lb b","middle")+'<path d="M40 150 L120 150 L300 110" class="ground"/><rect x="170" y="88" width="80" height="12" class="conc"/>'+'<path d="M300 110 L120 150" class="flow" marker-end="url(#fl)"/>'+t(60,170,"Street","lb sm");
 b+=t(540,30,"Type B: split to rear swale","lb b","middle")+'<path d="M400 150 L470 150 L560 110 L650 150 L690 160" class="ground"/><rect x="520" y="88" width="80" height="12" class="conc"/>'+'<path d="M540 116 L470 148" class="flow" marker-end="url(#fl)"/><path d="M580 116 L660 150" class="flow" marker-end="url(#fl)"/>'+t(420,170,"Street","lb sm")+t(660,176,"Rear swale","lb sm");
 b+=t(360,210,"Pads 1.0 ft above top of curb and 1% min. slope away from slabs (demo)","lb sm","middle");
 return svg(720,225,DEFS+b,"Lot grading types: Type A drains to the street; Type B splits between street and a rear swale");};

FIG.swppp=function(){var b='';
 b+='<rect x="80" y="40" width="520" height="190" class="site"/>'+t(340,140,"Disturbed area","lb","middle");
 b+='<path d="M80 230 L600 230 L600 40" class="silt"/>'+t(610,140,"Silt fence","lb sm");
 b+='<rect x="20" y="100" width="60" height="40" class="entr"/>'+t(50,160,"Stabilized","lb sm","middle")+t(50,174,"entrance","lb sm","middle");
 b+='<path d="M300 60 L300 220" class="flow" marker-end="url(#fl)"/><path d="M180 60 L240 220" class="flow" marker-end="url(#fl)"/><path d="M460 60 L400 220" class="flow" marker-end="url(#fl)"/>'+t(310,80,"Runoff","lb sm");
 [[200,120],[420,120]].forEach(function(p){b+='<rect x="'+(p[0]-8)+'" y="'+(p[1]-6)+'" width="16" height="12" class="inlet"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="14" class="ip"/>';});
 b+=t(432,104,"Inlet protection","lb sm");
 return svg(720,250,DEFS+b,"Erosion control plan: silt fence on the downslope edge, stabilized construction entrance and inlet protection");};

FIG.earth=function(v){var c=v.calc||{},pond=(c.pond||41.2)*1613.33,cut=c.cut||38000,bad=c.bad||1450,sh=c.shrink||15,fill=c.fill||96000;
 var avail=(pond+cut-bad)*(1-sh/100),mx=Math.max(pond+cut,fill)*1.1,W=520,sx=function(n){return n/mx*W;};
 var b='';
 b+=t(20,46,"Sources","lb b")+'<rect x="140" y="30" width="'+sx(pond)+'" height="24" class="bar1"/><rect x="'+(140+sx(pond))+'" y="30" width="'+sx(cut)+'" height="24" class="bar2"/>';
 b+=t(144,72,"Pond spoil "+Math.round(pond).toLocaleString()+" CY + other cut "+cut.toLocaleString()+" CY","lb sm");
 b+=t(20,116,"Usable","lb b")+'<rect x="140" y="100" width="'+sx(avail)+'" height="24" class="bar3"/>'+t(144,142,"After "+sh+"% shrink and "+bad.toLocaleString()+" CY unsuitable: "+Math.round(avail).toLocaleString()+" CY","lb sm");
 b+=t(20,186,"Fill needed","lb b")+'<rect x="140" y="170" width="'+sx(fill)+'" height="24" class="bar4"/>'+t(144,212,fill.toLocaleString()+" CY","lb sm");
 b+='<line x1="'+(140+sx(fill))+'" y1="20" x2="'+(140+sx(fill))+'" y2="200" class="hgl"/>';
 return svg(720,230,DEFS+b,"Earth balance bars: material sources, usable material after shrink, and fill needed");};


FIG.pondWetland=function(v){var east=!!v.pond2East,b='';
 b+='<rect x="20" y="20" width="680" height="230" class="site"/>'+t(30,40,"Northwest tract (schematic)","lb sm");
 b+='<path d="M120 60 Q200 40 260 80 Q300 130 240 170 Q160 200 110 150 Q80 100 120 60Z" class="wetl"/>'+(east?t(185,120,"Wetland W-4","lb b","middle")+t(185,136,"6.1 ac","lb sm","middle"):t(185,56,"Wetland W-4, 6.1 ac","lb sm","middle"));
 b+='<path d="M40 210 Q300 190 700 220" class="chan"/>'+t(560,206,"Tributary 3","lb sm");
 if(east){b+='<path d="M140 80 Q200 70 230 100 Q240 140 200 160 Q150 165 135 130Z" class="ghost"/>'+t(186,180,"Rev 0/1 location","lb sm","middle");
   b+='<path d="M420 70 Q520 50 580 90 Q610 140 560 175 Q470 190 430 150 Q400 110 420 70Z" class="pond"/>'+t(505,125,"Pond 2 (Rev 2)","lb b","middle")+'<path d="M300 120 L405 120" class="flow" marker-end="url(#fl)"/>';
   b+=t(360,244,"Moved east of the wetland: impacts held under the permit threshold","lb sm","middle");}
 else{b+='<path d="M140 80 Q200 70 230 100 Q240 140 200 160 Q150 165 135 130Z" class="pond"/><path d="M140 80 Q200 70 230 100 Q240 140 200 160 Q150 165 135 130Z" class="badzone"/>'+t(186,104,"Pond 2","lb b","middle");
   b+=t(360,244,"Pond 2 sits on Wetland W-4"+(v.pond2Conflict?" (conflict X01 open)":""),"lb sm hl","middle");}
 return svg(720,260,DEFS+b,east?"Pond 2 relocated east of Wetland W-4":"Pond 2 drawn on top of Wetland W-4");};

FIG.faultSetback=function(v){var up=v.faultUp||100,dn=v.faultDown||100,sc=1.2,cx=360,b='';
 b+='<rect x="20" y="20" width="680" height="220" class="site"/>';
 b+='<rect x="'+(cx-up*sc)+'" y="20" width="'+(up*sc+dn*sc)+'" height="220" class="esmt"/><rect x="'+(cx-up*sc)+'" y="20" width="'+(up*sc+dn*sc)+'" height="220" fill="url(#hatch)" opacity=".3"/>';
 b+='<path d="M'+cx+' 20 L'+(cx+10)+' 120 L'+(cx-6)+' 240" class="fault"/>'+t(cx+14,40,"Fault trace","lb sm hl");
 b+=t(cx-up*sc-6,236,"Upthrown "+up+" ft","lb sm","end")+t(cx+dn*sc+6,236,"Downthrown "+dn+" ft","lb sm");
 for(var i=0;i<8;i++){var x=40+i*82;if(x+60>cx-up*sc&&x<cx+dn*sc){b+='<rect x="'+x+'" y="80" width="60" height="70" class="lot'+(v.faultLots?" lotbad":" lotgone")+'"/>';}else b+='<rect x="'+x+'" y="80" width="60" height="70" class="lot"/>';}
 b+=t(360,190,v.faultLots?"Lots shown inside the setback (conflict X04 open)":"Setback kept as greenbelt; lots removed from it","lb sm"+(v.faultLots?" hl":""),"middle");
 return svg(720,250,DEFS+b,"Growth fault setback: "+up+" ft upthrown and "+dn+" ft downthrown");};

FIG.wwtpBuffer=function(v){var buf=v.plantBuffer||150,sc=0.6,b='';
 b+='<rect x="20" y="20" width="680" height="220" class="site"/>';
 b+='<rect x="60" y="80" width="140" height="100" class="struct"/>'+t(130,134,"Treatment plant","lb b","middle");
 b+='<rect x="'+(200)+'" y="60" width="'+(buf*sc)+'" height="140" class="ok-zone"/>'+t(200+buf*sc/2,52,buf+" ft buffer","lb sm","middle");
 var lotStart=200+150*0.6+(buf>150?(buf-150)*sc:0);
 for(var i=0;i<5;i++){var x=v.plantConflict?250+i*70:lotStart+20+i*70;if(x+60>690)break;b+='<rect x="'+x+'" y="90" width="60" height="80" class="lot'+(v.plantConflict&&x<200+150*sc?" lotbad":"")+'"/>';}
 b+=t(360,226,v.plantConflict?"Block 48 lots inside the 150-ft buffer (conflict X09 open)":"Lots set back behind a "+buf+"-ft open space buffer","lb sm"+(v.plantConflict?" hl":""),"middle");
 return svg(720,250,DEFS+b,"Treatment plant buffer of "+buf+" ft");};

FIG.bridge=function(v){var fb=v.freeboard||2,rise=v.rise||3.5,b='';
 b+='<path d="M20 200 Q200 200 260 250 L460 250 Q520 200 700 200" class="ground"/>';
 b+='<path d="M200 230 L520 230" class="wsurf"/>'+'<path d="M240 230 L260 250 L460 250 L480 230Z" class="water"/>'+t(530,234,"1% water surface","lb sm gwl");
 b+='<path d="M20 150 L200 150 L240 130 L480 130 L520 150 L700 150" class="ln"/>'+'<path d="M20 165 L700 165" class="pipe-crown"/>'+t(24,182,"Original profile","lb sm");
 b+='<rect x="240" y="130" width="240" height="10" class="conc"/>';
 [320,400].forEach(function(x){b+='<rect x="'+(x-6)+'" y="140" width="12" height="110" class="conc"/>';});
 b+=vdim(600,140,230,"","r")+t(608,176,"Low chord "+fb+" ft","lb sm")+t(608,192,"above 1% water","lb sm");
 b+=vdim(120,150,165,"Profile rises "+rise+" ft","r");
 b+=t(360,40,v.bridgeOpen?"Profile rise affects intersections and driveways near the bridge (conflict X14 open)":"Profile rise coordinated with intersections","lb sm"+(v.bridgeOpen?" hl":""),"middle");
 b+=t(360,24,"Three-span, 360-ft bridge over Cotton Creek","lb b","middle");
 return svg(720,270,DEFS+b,"Bridge elevation: low chord "+fb+" ft above the 1 percent water surface, raising the roadway "+rise+" ft");};

window.HUB_FIGS=FIG;
})();
