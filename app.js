// Import Vercel Web Analytics
import { inject } from '@vercel/analytics';

// Initialize analytics
inject();

(function(){
"use strict";

const $ = s => document.querySelector(s);
const dropEl=$("#drop"), fileEl=$("#file"), resEl=$("#results"),
      gridEl=$("#grid"), statusEl=$("#status"),
      cv=$("#overlay"), sizeEl=$("#size"), againEl=$("#again"),
      shotEl=$("#shot"), shotBtn=$("#shotBtn"),
      helpEl=$("#help"), fullEl=$("#full"), hintNote=$("#hintNote"),
      gateEl=$("#gate"), actionsEl=$("#actions"), fixNote=$("#fixNote"),
      howEl=$("#how"), rulesEl=$("#rules"), resetBtn=$("#resetBtn"),
      catBtn=$("#catBtn"), crossBtn=$("#crossBtn"), allBtn=$("#allBtn");

for(let n=4;n<=12;n++){
  const o=document.createElement("option"); o.value=n; o.textContent=n+" × "+n; sizeEl.appendChild(o);
}

let state=null; // {img, board:{N,colorIdx,palette,centers,cell}, sols}

/* ---------- input ---------- */
dropEl.addEventListener("click",()=>fileEl.click());
dropEl.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fileEl.click();}});
fileEl.addEventListener("change",()=>{ if(fileEl.files[0]) load(fileEl.files[0]); });
["dragenter","dragover"].forEach(t=>dropEl.addEventListener(t,e=>{e.preventDefault();dropEl.classList.add("hot");}));
["dragleave","drop"].forEach(t=>dropEl.addEventListener(t,e=>{e.preventDefault();dropEl.classList.remove("hot");}));
dropEl.addEventListener("drop",e=>{const f=e.dataTransfer.files[0]; if(f) load(f);});
window.addEventListener("paste",e=>{
  const items=e.clipboardData && e.clipboardData.files;
  if(items && items[0] && items[0].type.startsWith("image/")) load(items[0]);
});
sizeEl.addEventListener("change",()=>{ if(state) run(state.img, +sizeEl.value); });
function toggler(btn,panel,showText,hideText){
  btn.addEventListener("click",()=>{
    const open=panel.classList.toggle("hidden")===false;
    btn.textContent=open?hideText:showText;
    btn.setAttribute("aria-expanded",String(open));
  });
}
toggler(shotBtn,shotEl,"Show screenshot","Hide screenshot");
function collapseAll(){
  shotEl.classList.add("hidden"); shotBtn.textContent="Show screenshot"; shotBtn.setAttribute("aria-expanded","false");
}
againEl.addEventListener("click",()=>{ resEl.classList.add("hidden"); fileEl.value=""; state=null; collapseAll(); fullEl.classList.add("hidden"); window.scrollTo({top:0,behavior:"smooth"}); });

function load(file){
  const fr=new FileReader();
  fr.onload=()=>{
    const img=new Image();
    img.onload=()=>run(img,+sizeEl.value);
    img.onerror=()=>fail("That file didn't open as an image. Try a PNG or JPG screenshot.");
    img.src=fr.result;
  };
  fr.onerror=()=>fail("The file couldn't be read. Try picking it again.");
  fr.readAsDataURL(file);
}

function setGate(on){
  if(on){
    gridEl.classList.add("gated");
    gateEl.classList.remove("hidden");
    gateEl.appendChild(actionsEl);
    actionsEl.classList.remove("hidden");
    helpEl.classList.add("hidden");
    fixNote.classList.add("hidden");
  }else{
    gridEl.classList.remove("gated");
    gateEl.classList.add("hidden");
    helpEl.classList.remove("hidden");
    fixNote.classList.remove("hidden");
    helpEl.appendChild(actionsEl);
  }
}

function focusBoard(){
  const card=gridEl.closest("section");
  if(!card) return;
  const r=card.getBoundingClientRect();
  const top=window.scrollY+r.top;
  const gap=r.height<window.innerHeight-40 ? (window.innerHeight-r.height)/2 : 20;
  window.scrollTo({top:Math.max(0,top-gap),behavior:"smooth"});
}

function chose(){
  if(state.chosen) return;
  state.chosen=true;
  setGate(false);
}

function fail(msg){
  resEl.classList.remove("hidden");
  statusEl.className="chip chip-warn"; statusEl.textContent=msg;
  helpEl.classList.add("hidden"); fullEl.classList.add("hidden");
  gateEl.classList.add("hidden"); gridEl.classList.remove("gated"); fixNote.classList.add("hidden");
  resetBtn.classList.add("hidden");
  gridEl.innerHTML="";
  cv.width=cv.height=0;
}

/* ---------- pixels ---------- */
function pixels(img){
  const maxDim=1400;
  const sc=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight));
  const W=Math.max(1,Math.round(img.naturalWidth*sc)), H=Math.max(1,Math.round(img.naturalHeight*sc));
  const c=document.createElement("canvas"); c.width=W; c.height=H;
  const x=c.getContext("2d",{willReadFrequently:true});
  x.drawImage(img,0,0,W,H);
  return {data:x.getImageData(0,0,W,H).data,W,H};
}

/* find blobs of coloured pixels */
function blobsOf(px){
  const {data,W,H}=px, n=W*H;
  const mask=new Uint8Array(n);
  for(let p=0,i=0;p<n;p++,i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    const mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b);
    if(mx-mn>=28 && mx>=45) mask[p]=1;
  }
  const seen=new Uint8Array(n), stack=new Int32Array(n), out=[];
  for(let p=0;p<n;p++){
    if(!mask[p]||seen[p]) continue;
    let sp=0; stack[sp++]=p; seen[p]=1;
    let area=0,minx=W,maxx=0,miny=H,maxy=0;
    while(sp>0){
      const q=stack[--sp], qx=q%W, qy=(q/W)|0;
      area++;
      if(qx<minx)minx=qx; if(qx>maxx)maxx=qx;
      if(qy<miny)miny=qy; if(qy>maxy)maxy=qy;
      if(qx>0){const t=q-1; if(mask[t]&&!seen[t]){seen[t]=1;stack[sp++]=t;}}
      if(qx<W-1){const t=q+1; if(mask[t]&&!seen[t]){seen[t]=1;stack[sp++]=t;}}
      if(qy>0){const t=q-W; if(mask[t]&&!seen[t]){seen[t]=1;stack[sp++]=t;}}
      if(qy<H-1){const t=q+W; if(mask[t]&&!seen[t]){seen[t]=1;stack[sp++]=t;}}
    }
    const w=maxx-minx+1, h=maxy-miny+1;
    if(area<120||w<10||h<10) continue;
    const fill=area/(w*h), ar=w/h;
    if(fill<0.62||ar<0.68||ar>1.45) continue;
    out.push({area,minx,maxx,miny,maxy,w,h,cx:(minx+maxx)/2,cy:(miny+maxy)/2,s:(w+h)/2});
  }
  return out;
}

/* pick the family of same-sized squares with the most painted area, then keep the cluster that sits together */
function pickBoard(bl){
  if(bl.length<9) return null;
  let best=null;
  for(const a of bl){
    const lo=a.s*0.75, hi=a.s*1.33;
    let sum=0, set=[];
    for(const b of bl) if(b.s>=lo&&b.s<=hi){ sum+=b.area; set.push(b); }
    if(set.length>=9 && (!best||sum>best.sum)) best={sum,set};
  }
  if(!best) return null;
  const set=best.set;
  const sizes=set.map(b=>b.s).sort((x,y)=>x-y);
  const m=sizes[sizes.length>>1];
  // union neighbouring squares
  const par=set.map((_,i)=>i);
  const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};
  for(let i=0;i<set.length;i++)for(let j=i+1;j<set.length;j++){
    if(Math.abs(set[i].cx-set[j].cx)<2.2*m && Math.abs(set[i].cy-set[j].cy)<2.2*m){
      const a=find(i),b=find(j); if(a!==b) par[a]=b;
    }
  }
  const groups=new Map();
  set.forEach((b,i)=>{const r=find(i); if(!groups.has(r))groups.set(r,[]); groups.get(r).push(b);});
  let cells=null;
  for(const g of groups.values()) if(!cells||g.length>cells.length) cells=g;
  if(!cells||cells.length<9) return null;
  return {cells,m};
}

function cluster1D(vals,tol){
  const s=[...vals].sort((a,b)=>a-b), gs=[[s[0]]];
  for(let i=1;i<s.length;i++){
    const cur=gs[gs.length-1];
    if(s[i]-cur[cur.length-1]>tol) gs.push([s[i]]); else cur.push(s[i]);
  }
  return gs.map(g=>g.reduce((a,b)=>a+b,0)/g.length);
}

function sampleColor(px,cx,cy,rad){
  const {data,W,H}=px, R=[],G=[],B=[];
  const step=Math.max(1,Math.round(rad/6));
  for(let y=Math.round(cy-rad);y<=cy+rad;y+=step){
    if(y<0||y>=H) continue;
    for(let x=Math.round(cx-rad);x<=cx+rad;x+=step){
      if(x<0||x>=W) continue;
      const i=(y*W+x)*4; R.push(data[i]); G.push(data[i+1]); B.push(data[i+2]);
    }
  }
  if(!R.length) return [0,0,0];
  const med=a=>{a.sort((x,y)=>x-y);return a[a.length>>1];};
  return [med(R),med(G),med(B)];
}

const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

function groupColors(list,N){
  const n=list.length, exact=[];
  let fallback=null;
  for(let t=10;t<=170;t+=2){
    const par=[...Array(n).keys()];
    const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      if(dist(list[i],list[j])<t){const a=find(i),b=find(j); if(a!==b)par[a]=b;}
    }
    const roots=new Set(); for(let i=0;i<n;i++) roots.add(find(i));
    const c=roots.size;
    if(c===N) exact.push(t);
    const err=Math.abs(c-N);
    if(!fallback||err<fallback.err) fallback={err,t};
  }
  const t = exact.length ? exact[Math.floor(exact.length/2)] : fallback.t;
  const par=[...Array(n).keys()];
  const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    if(dist(list[i],list[j])<t){const a=find(i),b=find(j); if(a!==b)par[a]=b;}
  }
  const map=new Map(), sums=[];
  const idx=list.map((c,i)=>{
    const r=find(i);
    if(!map.has(r)){ map.set(r,sums.length); sums.push([0,0,0,0]); }
    const k=map.get(r), s=sums[k];
    s[0]+=c[0]; s[1]+=c[1]; s[2]+=c[2]; s[3]++;
    return k;
  });
  const palette=sums.map(s=>[Math.round(s[0]/s[3]),Math.round(s[1]/s[3]),Math.round(s[2]/s[3])]);
  return {idx,palette};
}

/* ---------- read the board out of the screenshot ---------- */
function readBoard(px,forceN){
  const board=pickBoard(blobsOf(px));
  if(!board) return null;
  const {cells,m}=board;
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  for(const b of cells){ minx=Math.min(minx,b.minx); maxx=Math.max(maxx,b.maxx); miny=Math.min(miny,b.miny); maxy=Math.max(maxy,b.maxy); }
  const rows=cluster1D(cells.map(b=>b.cy),m*0.55);
  const cols=cluster1D(cells.map(b=>b.cx),m*0.55);
  let N = forceN || (rows.length===cols.length ? rows.length : Math.max(rows.length,cols.length));
  if(N<4||N>14) return null;

  const useClusters = !forceN && rows.length===N && cols.length===N;
  const ys = useClusters ? rows : Array.from({length:N},(_,i)=>miny+((maxy-miny+1)/N)*(i+0.5));
  const xs = useClusters ? cols : Array.from({length:N},(_,j)=>minx+((maxx-minx+1)/N)*(j+0.5));
  const cell = useClusters ? m : (maxx-minx+1)/N*0.88;

  const flat=[], centers=[];
  for(let i=0;i<N;i++){
    centers.push([]);
    for(let j=0;j<N;j++){
      centers[i].push({x:xs[j],y:ys[i]});
      flat.push(sampleColor(px,xs[j],ys[i],cell*0.28));
    }
  }
  const {idx,palette}=groupColors(flat,N);
  const colorIdx=[];
  for(let i=0;i<N;i++) colorIdx.push(idx.slice(i*N,(i+1)*N));
  return {N,colorIdx,palette,centers,cell};
}

/* ---------- solver ---------- */
function solve(colorIdx,N,limit){
  const sols=[], usedCol=new Array(N).fill(false), usedCat=new Map(), cur=[];
  function rec(r,prev){
    if(r===N){ sols.push(cur.slice()); return sols.length>=limit; }
    for(let c=0;c<N;c++){
      if(usedCol[c]) continue;
      if(prev>=0 && Math.abs(c-prev)<2) continue;
      const g=colorIdx[r][c];
      if(usedCat.get(g)) continue;
      usedCol[c]=true; usedCat.set(g,true); cur.push(c);
      if(rec(r+1,c)) return true;
      cur.pop(); usedCol[c]=false; usedCat.set(g,false);
    }
    return false;
  }
  rec(0,-99);
  return sols;
}

/* ---------- output ---------- */
function run(img,forceN){
  resEl.classList.remove("hidden");
  const px=pixels(img);
  const board=readBoard(px,forceN||0);
  if(!board){ fail("No board found in that image. Make sure the whole coloured grid is visible, then try again."); return; }
  board.original=board.colorIdx.map(r=>r.slice());
  state={img,px,board,sol:null,cats:new Set(),crosses:new Set(),full:false,chosen:false,edited:false};
  fullEl.classList.add("hidden");
  collapseAll();
  setGate(true);
  howEl.open=false;
  rulesEl.parentNode.insertBefore(howEl,rulesEl);
  render();
  resEl.scrollIntoView({behavior:"smooth",block:"start"});
}

function render(){
  const {board}=state;
  const N=board.N;
  const sols=solve(board.colorIdx,N,2);
  const colours=new Set(board.colorIdx.flat()).size;
  state.sol=sols[0]||null;

  if(sols.length){
    statusEl.textContent = `${N}\u00d7${N}, ${colours} colours`+(sols.length>1?", several answers fit":"");
    statusEl.className="chip";
  }else{
    statusEl.className="chip chip-warn";
    statusEl.innerHTML='Nothing fits this board. It read as a '+N+'\u00d7'+N+' board with '+colours+
      ' colours'+(colours!==N?' (it should be '+N+')':'')+'. Fix any wrong squares below, or set the board size by hand.';
    gridEl.classList.remove("gated");
    gateEl.classList.add("hidden");
    fixNote.classList.remove("hidden");
    helpEl.classList.add("hidden");
    fullEl.classList.add("hidden");
  }
  drawGrid();
  drawOverlay(state.sol);
  updateHints();
  resetBtn.classList.toggle("hidden",!state.edited);
}

function updateHints(){
  const N=state.board.N, sol=state.sol;
  if(!sol) return;
  actionsEl.classList.toggle("hidden",state.full);
  helpEl.classList.toggle("hidden",state.full||!state.chosen);
  fixNote.classList.toggle("hidden",state.full||!state.chosen);
  const found=state.full?N:state.cats.size;
  const spotsLeft=N*N-N-state.crosses.size;
  catBtn.disabled=state.full||found>=N;
  crossBtn.disabled=state.full||spotsLeft<=0;
  allBtn.disabled=state.full;
  hintNote.textContent = state.full
    ? ""
    : found
      ? found+" of "+N+" cats found. Keep going, or rule out a few more squares."
      : "One cat at a time, a handful of squares ruled out, or the lot. Your call.";
}

resetBtn.addEventListener("click",()=>{
  if(!state) return;
  state.board.colorIdx=state.board.original.map(r=>r.slice());
  state.edited=false;
  state.cats=new Set(); state.crosses=new Set(); state.full=false;
  fullEl.classList.add("hidden");
  render();
});

catBtn.addEventListener("click",()=>{
  if(!state||!state.sol||state.full) return;
  const left=[];
  for(let r=0;r<state.board.N;r++) if(!state.cats.has(r)) left.push(r);
  if(!left.length) return;
  state.cats.add(left[Math.floor(Math.random()*left.length)]);
  chose(); drawGrid(); updateHints();
});

crossBtn.addEventListener("click",()=>{
  if(!state||!state.sol||state.full) return;
  const N=state.board.N, cand=[];
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    if(state.sol[i]===j) continue;
    const key=i+","+j;
    if(!state.crosses.has(key)) cand.push(key);
  }
  for(let n=0;n<5&&cand.length;n++){
    state.crosses.add(cand.splice(Math.floor(Math.random()*cand.length),1)[0]);
  }
  chose(); drawGrid(); updateHints();
});

allBtn.addEventListener("click",()=>{
  if(!state||!state.sol) return;
  state.full=true;
  chose();
  fullEl.classList.remove("hidden");
  drawGrid(); updateHints();
  focusBoard();
});

const XMARK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/></svg>';

function drawGrid(){
  const {board,sol}=state, N=board.N;
  gridEl.style.gridTemplateColumns=`repeat(${N},1fr)`;
  gridEl.innerHTML="";
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const k=board.colorIdx[i][j], c=board.palette[k];
    const isCat = !!sol && (state.full||state.cats.has(i)) && sol[i]===j;
    const isCross = !isCat && !!sol && (state.full || state.crosses.has(i+","+j));
    const b=document.createElement("button");
    b.className="cell"+(isCat?" sol":"");
    b.style.background=`rgb(${c[0]},${c[1]},${c[2]})`;
    if(isCat) b.textContent="\ud83d\udc31";
    else if(isCross) b.innerHTML=XMARK;
    b.title=`row ${i+1}, column ${j+1}`;
    b.addEventListener("click",()=>{
      board.colorIdx[i][j]=(board.colorIdx[i][j]+1)%board.palette.length;
      state.edited=true;
      state.cats=new Set(); state.crosses=new Set(); state.full=false;
      fullEl.classList.add("hidden");
      render();
    });
    gridEl.appendChild(b);
  }
}

function drawOverlay(sol){
  const {img,board}=state;
  const W=Math.min(1400,img.naturalWidth), sc=W/img.naturalWidth, H=Math.round(img.naturalHeight*sc);
  cv.width=W; cv.height=H;
  const x=cv.getContext("2d");
  x.drawImage(img,0,0,W,H);
  if(!sol) return;
  const k=W/state.px.W;                 // analysis pixels → canvas pixels
  const r=board.cell*k*0.36;
  x.textAlign="center"; x.textBaseline="middle";
  x.font=`${Math.round(r*1.5)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
  for(let i=0;i<board.N;i++){
    const p=board.centers[i][sol[i]], cx=p.x*k, cy=p.y*k;
    x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2);
    x.fillStyle="rgba(255,255,255,.92)"; x.fill();
    x.lineWidth=Math.max(2,r*0.12); x.strokeStyle="rgba(51,37,49,.85)"; x.stroke();
    x.fillStyle="#000"; x.fillText("🐱",cx,cy+r*0.04);
  }
}
})();
