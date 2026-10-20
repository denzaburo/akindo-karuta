let D=[];
const LOGO='assets/logo.png';
// ---- 対応期間：2026年第40週(9/28)〜2027年第53週(12/31) ----
// 通し週番号 g：1〜53=2026年の週、54〜106=2027年の週（両年とも53週構成）
// 来年更新するときは A27 の要領で基準日(第2週の月曜)を足し、FIRST/LASTを直す
const A=new Date(2026,0,5), A27=new Date(2027,0,4), DN=['月','火','水','木','金','土','日'];
const FIRST=40, LAST=106;
const T=window.__TAURI__, inv=T?T.core.invoke:null;
document.body.className=document.documentElement.className=inv?'app':'web';
const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const gIdx=d=>d.getFullYear()<=2026
 ?(d<A?1:Math.floor((d-A)/6048e5)+2)
 :(d<A27?54:Math.floor((d-A27)/6048e5)+55);
const gYear=g=>g<=53?2026:2027;
const gWeek=g=>g<=53?g:g-53;      // その年の中の週番号（＝cards.jsonの添字）
function dates(g){
 const yr=gYear(g), n=gWeek(g), B=n===0?null:(g<=53?A:A27);
 let o=[];
 if(n===1){const e=Math.round((B-new Date(yr,0,1))/864e5);
  for(let i=1;i<=e;i++)o.push(new Date(yr,0,i));return o}
 const s=new Date(B.getTime()+(n-2)*6048e5);
 for(let i=0;i<7;i++){const d=new Date(s.getTime()+i*864e5);if(d.getFullYear()===yr)o.push(d)}return o}
let today=new Date();
const thisWeek=()=>Math.min(Math.max(gIdx(today),FIRST),LAST);
let i=FIRST;

function draw(){
 const c=D[gWeek(i)], ds=dates(i);
 wk.textContent=gYear(i)+'年 第'+gWeek(i)+'週';
 const f=x=>(x.getMonth()+1)+'月'+x.getDate()+'日';
 rg.textContent=f(ds[0])+' — '+f(ds[ds.length-1]);
 gr.style.gridTemplateColumns='repeat('+(gWeek(i)===1?ds.length:7)+',1fr)';
 gr.innerHTML='';
 ds.forEach(d=>{const w=(d.getDay()+6)%7,e=document.createElement('div');
  e.className='d'+(w===5?' sat':w===6?' sun':'')+(key(d)===key(today)?' tdy':'');
  e.innerHTML='<div class="n">'+DN[w]+'</div><div class="v">'+d.getDate()+'</div>';
  gr.appendChild(e)});
 w.classList.toggle('full',!c.yomi);
 w.classList.toggle('wide',!!c.wide);
 w.classList.toggle('left',!!c.sections);
 im.style.display=c.img?'block':'none';if(c.img)im.src=c.img;
 yo.textContent=c.yomi?'「'+c.yomi+'」':'';
 ka.textContent=c.kaisetsu||'';
 if(c.sections)c.sections.forEach(s=>{const h=document.createElement('b'),t=document.createElement('p');h.textContent=s.h;t.textContent=s.t;ka.append(h,t)});
 ka.scrollTop=0;
 if(c.logo){lg.src=LOGO;lg.style.display='block'}else lg.style.display='none';
 if(c.url){lk.href=inv?'#':c.url;lk.dataset.url=c.url;lk.textContent='▶ YouTubeで聴く';lk.style.display='block'}else lk.style.display='none';
}
function buildIndex(){
 ovg.innerHTML='';
 D.forEach((c,n)=>{if(!c.yomi||n<1)return;
  const e=document.createElement('div');
  e.className='k'+(n===gWeek(i)?' now':'');
  e.innerHTML='<em></em><s>第'+n+'週</s>';
  e.querySelector('em').textContent=c.yomi[0];
  e.onmouseenter=()=>{ovf.className='';ovf.textContent='「'+c.yomi+'」'};
  e.onclick=()=>{
   // 表示中の年のその週へ。範囲外（2026年の第1〜39週）なら2027年の同じ週へ
   let t=i>53?n+53:n; if(t<FIRST)t=n+53; if(t>LAST)t=n;
   i=t;ov.className='';draw();fit()};
  ovg.appendChild(e)});
 ovf.className='hint';ovf.textContent=matchMedia('(hover:none)').matches?'札を押すとその週へ移動します':'札にカーソルを合わせると読み札、クリックでその週へ移動します';
}
const prev=()=>{if(i>FIRST){i--;draw();fit()}}, next=()=>{if(i<LAST){i++;draw();fit()}}, now=()=>{i=thisWeek();draw();fit()};
pv.onclick=mpv.onclick=prev; nx.onclick=mnx.onclick=next; td.onclick=mtd.onclick=now;
// スマホ：左右スワイプで週を送る
let sx=null,sy=null;
document.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});
document.addEventListener('touchend',e=>{if(sx==null)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;
 if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&ov.className!=='on'){dx<0?next():prev()}});
// 表示サイズ：小中大のプリセットに加え、ウィンドウの端をドラッグして自由に変えられる
// 倍率 z は 620px 幅を 1 とし、ウィンドウの幅から決める（縦は中身に合わせて追従）
const Z={小:1,中:1.2,大:1.45}, ZK=Object.keys(Z);
let z=1.2, mini=false;
let onTop=true;
const zName=()=>{for(const k of ZK)if(Math.abs(Z[k]-z)<.03)return k;return Math.round(z*100)+'%'};
function ui(){
 w.style.zoom=(inv||window.innerWidth>640)?z:1;
 zm.textContent=zName();
 w.classList.toggle('mini',mini);
 mn.textContent=mini?'＋':'－';
 mn.title=mini?'もとの大きさに戻す':'最小化';
 tp.className=onTop?'on':'';
 const st=JSON.stringify({z:z,onTop:onTop});
 if(inv){inv('save_state',{name:'ui',json:st}).catch(e=>console.error(e));
  inv('set_always_on_top',{v:onTop}).catch(e=>console.error(e));}
 else try{localStorage.setItem('akindo26ui',st)}catch(e){}
 draw();
 fit();
}
// 中身の実寸をそのままウィンドウの大きさにする
let fitting=false;
function fit(){
 if(!inv)return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const r=w.getBoundingClientRect();
  fitting=true;
  inv('fit_window',{w:r.width,h:r.height}).catch(e=>console.error(e)).finally(()=>setTimeout(()=>fitting=false,150));
 }));
}
// ウィンドウの端をドラッグして大きさを変えたら、幅に合わせて倍率を決め直す
let rz=null;
window.addEventListener('resize',()=>{
 if(!inv||fitting)return;
 clearTimeout(rz);
 rz=setTimeout(()=>{
  const nz=Math.min(2.2,Math.max(.7,Math.round(window.innerWidth/620*100)/100));
  if(Math.abs(nz-z)<.01){fit();return}
  z=nz;ui();
 },120);
});
// バーをつかんで移動（ボタンの上では動かさない）
bar.addEventListener('mousedown',e=>{
 if(e.button!==0||e.target.closest('#nav'))return;
 if(inv)inv('start_drag').catch(e=>console.error(e));
});
window.addEventListener('load',fit);
zm.onclick=()=>{const k=ZK.indexOf(zName());z=Z[ZK[(k+1)%ZK.length]];ui()};
tp.onclick=()=>{onTop=!onTop;ui()};
cl.onclick=()=>{if(inv)inv('hide_window');else window.close()};
lk.onclick=e=>{if(inv){e.preventDefault();inv('open_url',{url:lk.dataset.url})}};
mn.onclick=()=>{mini=!mini;ui()};
ix.onclick=()=>{buildIndex();ov.className='on'};
ovx.onclick=()=>{ov.className=''};
// 開きっぱなしでも日付が変わったら今日の印を更新する（表示中の週が今週なら追従）
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)return;
 const was=thisWeek(), t=new Date();
 if(key(t)===key(today))return;
 today=t; if(i===was)i=thisWeek(); draw();
});
async function boot(){
 D=await (await fetch('cards.json')).json();
 i=thisWeek();
 let p={};
 if(inv){try{p=JSON.parse(await inv('load_state',{name:'ui'})||'{}')}catch(e){}}
 else{try{p=JSON.parse(localStorage.getItem('akindo26ui')||'{}')}catch(e){}}
 if(typeof p.z==='number')z=p.z; if(inv&&p.onTop!=null)onTop=p.onTop;  // 最小化は記憶しない＝起動時は必ず絵札を見せる
 ui();
}
boot();
// Web版：オフラインでも開けるように（Widgetでは何もしない）
if(!inv&&'serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
