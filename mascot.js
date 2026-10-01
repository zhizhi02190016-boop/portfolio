/* The 00 character uses full drawings registered by hip or hand position. */
const $=id=>document.getElementById(id),card=$('mascot-card'),art=$('mascot-art'),front=$('mascot-front');
const hero=document.querySelector('.hero'),about=document.querySelector('.intro-zero'),overlay=$('mascot-overlay');
// Keep the card's shadow behind the entire drawing, not between the wrist
// overlay and sleeve: otherwise the crop boundary creates a false colour seam.
const cardShadow=card.cloneNode(false);
cardShadow.removeAttribute('id');
cardShadow.style.zIndex='0';cardShadow.style.background='transparent';
overlay.prepend(cardShadow);card.style.boxShadow='none';
const ns='http://www.w3.org/2000/svg';
const node=(tag,parent,attrs={})=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const ease=(p,a,b)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t)};
const rowTops=[0,307,627,943],rowBottoms=[307,627,943,1254];
// Measured anchors on the generated atlas, relative to each cell's upper left.
const poses=[
 {hip:[180,176]}, {hip:[189,178]}, {hip:[174,174]}, {hip:[180,177]},
 {hip:[170,175]}, {hip:[183,185]}, {hip:[196,198]}, {hip:[187,197]},
 {hip:[205,202],fist:[210,16]}, {hip:[211,203],fist:[204,16]},
 {hip:[207,217],fist:[206,18]}, {hip:[186,203],fist:[213,19]},
 {hip:[176,198],fist:[211,17]}, {hip:[183,200],fist:[186,16]},
 {hip:[214,191],fist:[189,16]}, {hip:[192,203],fist:[203,16]}
];
const sprite=node('g',art),cell=node('svg',sprite,{overflow:'hidden',preserveAspectRatio:'none'});
node('image',cell,{href:'images/mascot-cel-atlas.png',width:1254,height:1254});
const fingerGroup=node('g',front),fingerCell=node('svg',fingerGroup,{overflow:'hidden',preserveAspectRatio:'none'});
node('image',fingerCell,{href:'images/mascot-cel-atlas.png',width:1254,height:1254});
// Remove low-alpha fringe from the atlas, then sharpen without adding a pale rim.
for(const [surface,subject,id] of [[art,sprite,'mascot-sharp-body'],[front,fingerGroup,'mascot-sharp-hand']]){
 const defs=node('defs',surface),filter=node('filter',defs,{id,x:'-10%',y:'-10%',width:'120%',height:'120%',colorInterpolationFilters:'sRGB'});
 const clean=node('feComponentTransfer',filter,{in:'SourceGraphic',result:'clean'});
 node('feFuncA',clean,{type:'linear',slope:'1.4',intercept:'-.2'});
 node('feConvolveMatrix',filter,{in:'clean',order:3,kernelMatrix:'0 -0.25 0 -0.25 2 -0.25 0 -0.25 0',edgeMode:'duplicate',preserveAlpha:'true'});
 subject.setAttribute('filter',`url(#${id})`);
}
const rim=u=>Math.abs(u)<=.48?1:.48+Math.sqrt(Math.max(0,.52**2-(Math.abs(u)-.48)**2));
const dynamics=[{angle:0,swing:0,u:0}];let theta=0,omega=0,swing=0,sv=-.36;
for(let i=1;i<=1440;i++) {const t=i/240,u=.84*ease(t,.9,3.4),load=28*ease(t,.1,.55);
 omega+=(load*(u*Math.cos(theta)-rim(u)*Math.sin(theta))-1.2*theta-4.2*omega)/240;theta+=omega/240;
 sv+=(-19*Math.sin(swing)-2.4*sv-.4*omega)/240;swing+=sv/240;dynamics.push({angle:theta,swing,u});}
function motion(p){const f=clamp((p-.58)/.42)*1440,i=Math.floor(f),j=Math.min(1440,i+1);return Object.fromEntries(['angle','swing','u'].map(k=>[k,mix(dynamics[i][k],dynamics[j][k],f-i)]))}
const times=[0,.12,.17,.215,.26,.315,.365,.415,.465,.515,.555,.595,.645,.70,.755,.81];
function frameAt(p){let i=0;while(i<15&&p>=times[i+1])i++;return i}
let ready=false;
function render(p){
 const w=window.innerWidth,h=window.innerHeight,mobile=w<=700;
 art.setAttribute('viewBox',`0 0 ${w} ${h}`);front.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const cellSize=mobile?Math.min(.44*h,370):Math.min(.52*h,470),scale=cellSize/313.5;
 const boundary=hero.getBoundingClientRect().bottom,size=card.offsetWidth;
 const cardY=about.getBoundingClientRect().top+(mobile?.40:.21)*about.offsetHeight
   - (mobile?130:50)*ease(p,.65,1)+(mobile?22:30)*ease(p,.465,.70);
 const cx=mobile?w*.55:w*.67+size/2,cy=cardY+size/2,m=motion(p);
 const ax=size/2*m.u,ay=size/2*rim(m.u),r=m.angle;
 const gx=cx+ax*Math.cos(r)-ay*Math.sin(r),gy=cy+ax*Math.sin(r)+ay*Math.cos(r)-2;
 card.style.left=`${cx-size/2}px`;card.style.top=`${cardY}px`;card.style.transform=`rotate(${r*180/Math.PI}deg)`;card.style.opacity=ease(p,.12,.28);
 for(const property of ['left','top','transform','opacity'])cardShadow.style[property]=card.style[property];
 if(mobile&&!reduced&&ready)about.querySelector('.content').style.opacity=ease(p,.75,.88);
 else about.querySelector('.content').style.opacity='';
 const i=frameAt(p),pose=poses[i],row=Math.floor(i/4),col=i%4,sy=rowTops[row],sh=rowBottoms[row]-sy;
 cell.setAttribute('viewBox',`${col*313.5} ${sy} 313.5 ${sh}`);
 cell.setAttribute('width',313.5*scale);cell.setAttribute('height',sh*scale);
 let x,y,rotation=0;
 if(i<8){
   const t=clamp((p-.215)/(.465-.215));
   // Match the next drawing's hip exactly at the catch, with a small jump arc.
   const endHipX=gx+(poses[8].hip[0]-poses[8].fist[0])*scale;
   const endHipY=gy+(poses[8].hip[1]-poses[8].fist[1])*scale;
   const hipX=mix(cx,endHipX,t*t),hipY=mix(boundary,endHipY,t*t)-Math.sin(Math.PI*t)*h*.045;
   x=hipX-pose.hip[0]*scale;y=hipY-pose.hip[1]*scale;
 }else{
   // Every full drawing is registered to its own fist, keeping contact fixed.
   x=gx-pose.fist[0]*scale;y=gy-pose.fist[1]*scale;
   rotation=m.swing*.35*180/Math.PI;
 }
 const pivot=pose.fist?pose.fist.map(v=>v*scale):pose.hip.map(v=>v*scale);
 sprite.setAttribute('transform',`translate(${x} ${y}) rotate(${rotation} ${pivot[0]} ${pivot[1]})`);
 sprite.style.visibility=ready?'visible':'hidden';
 // The hand passes behind the card once its weight begins to rotate the card.
 // The drawing beneath is still anchored by the fist, so the arm stays attached.
 fingerGroup.style.visibility=ready&&i>=8&&p<.68?'visible':'hidden';
 if(i>=8){const fx=pose.fist[0],fy=pose.fist[1],conceal=50*ease(p,.58,.68),visible=Math.max(.01,50-conceal);
   fingerCell.setAttribute('viewBox',`${col*313.5+fx-19} ${sy+fy-16+conceal} 38 ${visible}`);
   fingerCell.setAttribute('x',-19*scale);fingerCell.setAttribute('y',(-16+conceal)*scale);fingerCell.setAttribute('width',38*scale);fingerCell.setAttribute('height',visible*scale);
   fingerGroup.setAttribute('transform',`translate(${gx} ${gy}) rotate(${rotation})`);}
 window.mascotState={p,frame:i,scale,x,y,grip:[gx,gy],angle:r*180/Math.PI,ready};
}
const params=new URLSearchParams(location.search),fixed=params.get('progress'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let target=0,displayed=0,velocity=0,last=0,running=false;
function tick(now){const dt=Math.min((now-(last||now-16.67))/1000,.05);last=now;
 if(fixed!==null||reduced){displayed=target;velocity=0}else{
   const previous=displayed,d=displayed-target,k=12,b=velocity+k*d,e=Math.exp(-k*dt);
   const candidate=target+(d+b*dt)*e;
   // Keep a fast wheel swipe from skipping the anticipation/catch drawings.
   displayed=clamp(candidate,previous-dt*.65,previous+dt*.65);
   velocity=displayed===candidate?(velocity-k*b*dt)*e:(displayed-previous)/dt;
 }
 render(displayed);if(Math.abs(displayed-target)>.00001||Math.abs(velocity)>.0001)requestAnimationFrame(tick);else{running=false;last=0}}
function update(){target=fixed===null?Math.pow(clamp(scrollY/700),1.5):clamp(Number(fixed));if(!running){running=true;requestAnimationFrame(tick)}}
const preload=new Image();preload.src='images/mascot-cel-atlas.png';
preload.decode().then(()=>{ready=true;if(!reduced)document.body.classList.add('mascot-ready');update()}).catch(()=>{overlay.hidden=true});
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
