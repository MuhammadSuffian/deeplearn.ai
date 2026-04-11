// js/viz.js — all algorithm visualizers
let curAlgo = 'diff';
let dvStep = 0, dvAutoTimer = null;

const algoMeta = {
  backprop: { label: 'Backpropagation' },
  attn:     { label: 'Attention' },
  gd:       { label: 'Gradient Descent' },
  cnn:      { label: 'CNN' },
  tfm:      { label: 'Transformer' },
  rnn:      { label: 'RNN / LSTM' },
  diff:     { label: 'Diffusion' },
};

function renderVizPage() {
  const el = document.getElementById('page-viz');
  if (!el) return;
  el.innerHTML = `
    <div class="pg">
      <div class="pg-t">Algorithm Visualizer</div>
      <div class="pg-s">Step through algorithms interactively. Build intuition before writing code.</div>
      <div class="algo-sel" id="algo-sel-btns">
        ${Object.entries(algoMeta).map(([k, v]) =>
          `<button class="cb${k === curAlgo ? ' pri' : ''}" id="btn-${k}" onclick="setAlgo('${k}')">${v.label}</button>`
        ).join('')}
      </div>
      <div id="algo-content"></div>
    </div>`;
  renderAlgoContent();
}

function setAlgo(a) {
  curAlgo = a;
  document.querySelectorAll('[id^="btn-"]').forEach(b => b.classList.remove('pri'));
  const btn = document.getElementById('btn-' + a);
  if (btn) btn.classList.add('pri');
  Object.keys(algoMeta).forEach(id => {
    const s = document.getElementById('sb-' + id);
    if (s) s.classList.toggle('active', id === a);
  });
  renderAlgoContent();
}

function renderAlgoContent() {
  const el = document.getElementById('algo-content');
  if (!el) return;
  const renderers = {
    backprop: renderBackprop,
    attn:     renderAttnViz,
    gd:       renderGDViz,
    cnn:      renderCNNViz,
    tfm:      renderTFMViz,
    rnn:      renderRNNViz,
    diff:     renderDiffViz,
  };
  if (renderers[curAlgo]) renderers[curAlgo](el);
}

// ── BACKPROP ──────────────────────────────────────────────
let bpStep = 0;
const bpSteps = [
  { info: '<strong>Step 1 — Input layer.</strong> x₁, x₂, x₃ enter the network raw.', active: 'input' },
  { info: '<strong>Step 2 — Hidden layer.</strong> z = Σwᵢxᵢ + b, then ReLU: a = max(0, z).', active: 'hidden' },
  { info: '<strong>Step 3 — Output.</strong> σ(z) → ŷ ∈ (0,1). Error = ŷ − y.', active: 'output' },
  { info: '<strong>Step 4 — Loss.</strong> L = −log(ŷ). We need to minimize this.', active: 'output' },
  { info: '<strong>Step 5 — Backward pass.</strong> ∂L/∂w flows back via chain rule.', active: 'hidden' },
  { info: '<strong>Step 6 — Weight update.</strong> w ← w − α · ∂L/∂w for all weights.', active: 'input' },
];

function renderBackprop(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">Backpropagation — forward & backward pass</div>
        <div class="vctrls">
          <button class="cb" onclick="bpPrev()">← Prev</button>
          <span id="bplbl" style="font-family:var(--mono);font-size:11px;color:var(--mut);padding:0 6px">1/6</span>
          <button class="cb pri" onclick="bpNext()">Next →</button>
        </div>
      </div>
      <div class="vb">
        <div id="nn-viz" style="display:flex;align-items:center;justify-content:center;min-height:140px;flex-wrap:wrap"></div>
        <div class="info" id="bp-info"></div>
      </div>
    </div>`;
  drawNN();
}

function drawNN() {
  const layers = [
    { name: 'Input',  nodes: ['x₁','x₂','x₃'], color: '#7c6bff' },
    { name: 'Hidden', nodes: ['h₁','h₂','h₃','h₄'], color: '#ff6b9d' },
    { name: 'Output', nodes: ['ŷ'], color: '#00d4aa' },
  ];
  const aMap = { input: 0, hidden: 1, output: 2 };
  const ai = aMap[bpSteps[bpStep].active];
  let html = '';
  layers.forEach((layer, li) => {
    if (li > 0) {
      const prev = layers[li-1].nodes.length, cur = layer.nodes.length;
      const h = Math.max(prev, cur) * 46;
      html += `<div style="display:flex;align-items:center"><svg width="50" height="${h}" style="overflow:visible">`;
      for (let p = 0; p < prev; p++) for (let c = 0; c < cur; c++) {
        const y1 = (p + .5) * (h / prev), y2 = (c + .5) * (h / cur);
        const stroke = li === ai ? layer.color : li - 1 === ai ? layers[li-1].color : '#3a3a55';
        const op = li === ai || li - 1 === ai ? 0.5 : 0.1;
        html += `<line x1="0" y1="${y1}" x2="50" y2="${y2}" stroke="${stroke}" stroke-width="1" opacity="${op}"/>`;
      }
      html += `</svg></div>`;
    }
    html += `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:6px">${layer.name}</div>
      <div style="display:flex;flex-direction:column;gap:9px">`;
    layer.nodes.forEach(n => {
      const isA = li === ai;
      html += `<div style="width:32px;height:32px;border-radius:50%;border:2px solid ${layer.color};background:${layer.color}22;display:flex;align-items:center;justify-content:center;font-size:8px;font-family:var(--mono);transition:all .5s;${isA ? `box-shadow:0 0 12px ${layer.color};transform:scale(1.15)` : ''}">${n}</div>`;
    });
    html += `</div></div>`;
  });
  const nv = document.getElementById('nn-viz');
  const info = document.getElementById('bp-info');
  if (nv) nv.innerHTML = html;
  if (info) info.innerHTML = bpSteps[bpStep].info;
  const lbl = document.getElementById('bplbl');
  if (lbl) lbl.textContent = `${bpStep + 1}/6`;
}
function bpNext() { bpStep = (bpStep + 1) % 6; drawNN(); }
function bpPrev() { bpStep = (bpStep - 1 + 6) % 6; drawNN(); }

// ── ATTENTION ──────────────────────────────────────────────
const attnWords = ['The', 'cat', 'sat', 'on', 'mat'];
let attnW = [], attnQI = 2;

function renderAttnViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">Self-attention — click a token to query</div>
        <div class="vctrls"><button class="cb pri" onclick="randAttn()">Randomize</button></div>
      </div>
      <div class="vb">
        <div id="attn-toks" style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px"></div>
        <div id="attn-grid"></div>
        <div class="info" id="attn-info" style="margin-top:9px"></div>
      </div>
    </div>`;
  randAttn();
}

function randAttn() {
  attnW = attnWords.map(() => attnWords.map(() => Math.random()));
  drawAttn();
}

function drawAttn() {
  const sm = row => { const e = row.map(x => Math.exp(x * 3)); const s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); };
  const rows = attnW.map(sm);
  const toks = document.getElementById('attn-toks');
  const grid = document.getElementById('attn-grid');
  const info = document.getElementById('attn-info');
  if (!toks) return;
  toks.innerHTML = attnWords.map((w, i) =>
    `<div style="padding:6px 11px;border-radius:6px;border:1px solid ${i === attnQI ? 'var(--acc)' : 'var(--bdr)'};background:${i === attnQI ? '#7c6bff22' : 'var(--surf2)'};font-family:var(--mono);font-size:11px;cursor:pointer;color:${i === attnQI ? 'var(--acc)' : 'var(--txt)'}" onclick="attnQI=${i};drawAttn()">${w}</div>`
  ).join('');
  let g = '';
  rows.forEach((row, ri) => {
    g += `<div style="display:flex;align-items:center;gap:3px;margin-bottom:3px"><div style="font-size:9px;color:var(--mut);font-family:var(--mono);min-width:40px">${attnWords[ri]}</div>`;
    row.forEach((w) => {
      const a = Math.round(w * 255).toString(16).padStart(2, '0');
      g += `<div style="width:34px;height:34px;border-radius:5px;background:${ri === attnQI ? `#7c6bff${a}` : `#ffffff${a}`};display:flex;align-items:center;justify-content:center;font-size:8px;font-family:var(--mono);color:#fff;opacity:${ri === attnQI ? 1 : 0.45}">${w.toFixed(2)}</div>`;
    });
    g += `</div>`;
  });
  if (grid) grid.innerHTML = g;
  const qr = rows[attnQI]; const ti = qr.indexOf(Math.max(...qr));
  if (info) info.innerHTML = `"${attnWords[attnQI]}" attends most to <strong>"${attnWords[ti]}"</strong> (${qr[ti].toFixed(3)}). Rows sum to 1.0 via softmax.`;
}

// ── GRADIENT DESCENT ──────────────────────────────────────────────
let gdX = 3.8, gdLR = 0.1, gdN = 0;
const lossF = x => (x-1)*(x-1) + 0.4*Math.sin(x*4) + 0.5;
const gradF = x => 2*(x-1) + 1.6*Math.cos(x*4);

function renderGDViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">Gradient descent — loss surface</div>
        <div class="vctrls">
          <button class="cb pri" onclick="gdStep()">Take a step</button>
          <button class="cb" onclick="gdReset()">Reset</button>
        </div>
      </div>
      <div class="vb">
        <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
          <div style="background:var(--surf2);border-radius:6px;padding:8px 12px"><div style="font-size:9px;color:var(--mut);font-family:var(--mono)">Loss</div><div style="font-size:17px;font-weight:700;font-family:var(--mono);color:var(--acc)" id="gdloss">4.82</div></div>
          <div style="background:var(--surf2);border-radius:6px;padding:8px 12px"><div style="font-size:9px;color:var(--mut);font-family:var(--mono)">Steps</div><div style="font-size:17px;font-weight:700;font-family:var(--mono);color:var(--acc)" id="gdsteps">0</div></div>
        </div>
        <canvas id="gd-canvas" width="700" height="160" style="width:100%;border-radius:7px;background:var(--cbg)"></canvas>
        <div style="display:flex;align-items:center;gap:9px;margin-top:10px">
          <label style="font-size:10px;color:var(--mut);font-family:var(--mono);min-width:80px">Learning rate</label>
          <input type="range" min="1" max="30" value="10" style="flex:1" oninput="setLR(this.value)"/>
          <span id="lrdisp" style="font-family:var(--mono);font-size:11px;color:var(--mut);min-width:36px">0.10</span>
        </div>
        <div class="info" id="gd-info" style="margin-top:9px">Press "Take a step" to roll the ball down the loss surface.</div>
      </div>
    </div>`;
  gdReset();
}

function drawGD() {
  const c = document.getElementById('gd-canvas'); if (!c) return;
  const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  const xm = -1, xM = 5;
  const cx = x => (x - xm) / (xM - xm) * W;
  const cy = y => H - 12 - (y / 6) * (H - 24);
  ctx.beginPath();
  for (let px = 0; px < W; px++) { const x = xm + (px/W)*(xM-xm); px===0?ctx.moveTo(px,cy(lossF(x))):ctx.lineTo(px,cy(lossF(x))); }
  ctx.strokeStyle='#7c6bff88'; ctx.lineWidth=2; ctx.stroke();
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fillStyle='#7c6bff11'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx(gdX), cy(lossF(gdX)), 6, 0, 2*Math.PI);
  ctx.fillStyle='#ff6b9d'; ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
}

function gdStep() {
  const g = gradF(gdX); gdX -= gdLR * g; gdN++;
  const loss = lossF(gdX);
  const dl = document.getElementById('gdloss'); if (dl) dl.textContent = loss.toFixed(3);
  const ds = document.getElementById('gdsteps'); if (ds) ds.textContent = gdN;
  const info = document.getElementById('gd-info');
  if (info) info.innerHTML = gdLR > 0.25 ? '⚠ Learning rate too high — overshooting!' : loss < 0.52 ? '🎯 Near the minimum!' : `Gradient: ${g.toFixed(3)}. Stepping toward lower loss.`;
  drawGD();
}
function gdReset() { gdX = 3.8; gdN = 0; const dl=document.getElementById('gdloss'); if(dl)dl.textContent='4.820'; const ds=document.getElementById('gdsteps'); if(ds)ds.textContent='0'; setTimeout(drawGD,50); }
function setLR(v) { gdLR = v/100; const el=document.getElementById('lrdisp'); if(el)el.textContent=gdLR.toFixed(2); }

// ── CNN ──────────────────────────────────────────────
let cnnStage = 0;
const cnnImg = [[20,20,180,200,200,180,20,20],[20,160,200,20,20,200,160,20],[20,200,20,20,20,20,200,20],[20,200,20,20,20,20,200,20],[20,200,180,200,200,180,20,20],[20,200,20,20,20,20,200,20],[20,180,200,20,20,200,160,20],[20,20,200,200,200,20,20,20]];
const cnnK = [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]];
const cnnStages = [
  { n:'Input',  info:'<strong>Input 8×8.</strong> Raw pixel values 0–255. CNNs preserve spatial structure.' },
  { n:'Conv1',  info:'<strong>Convolution.</strong> 3×3 kernel slides computing dot products → edge feature map.' },
  { n:'ReLU',   info:'<strong>ReLU.</strong> max(0,x) zeros negatives, keeps positive activations.' },
  { n:'MaxPool',info:'<strong>Max pooling 2×2.</strong> Halves dimensions, keeps strongest activations.' },
  { n:'Output', info:'<strong>FC + Softmax.</strong> Flattened → class probabilities summing to 1.' },
];

function renderCNNViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">CNN — convolution pipeline</div>
        <div class="vctrls">
          <button class="cb" onclick="cnnPrev()">← Prev</button>
          <span id="cnnlbl" style="font-family:var(--mono);font-size:11px;color:var(--mut);padding:0 6px">1/5</span>
          <button class="cb pri" onclick="cnnNext()">Next →</button>
        </div>
      </div>
      <div class="vb">
        <div id="cnn-pip" style="display:flex;gap:0;margin-bottom:14px;flex-wrap:wrap"></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">
          <div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:4px">Input 8×8</div><canvas id="cnn-in" width="112" height="112" style="border-radius:4px;border:1px solid var(--bdr);image-rendering:pixelated"></canvas></div>
          <div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:4px">Output</div><canvas id="cnn-out" width="112" height="112" style="border-radius:4px;border:1px solid var(--bdr);image-rendering:pixelated"></canvas></div>
          <div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:4px">Receptive field</div><canvas id="cnn-zoom" width="75" height="75" style="border-radius:4px;border:1px solid var(--acc);image-rendering:pixelated"></canvas><div id="cnndp" style="font-size:9px;color:var(--acc3);font-family:var(--mono);margin-top:3px"></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:9px;margin-top:10px">
          <label style="font-size:10px;color:var(--mut);font-family:var(--mono);min-width:44px">Slide</label>
          <input type="range" min="0" max="35" value="0" style="flex:1" id="cnn-pos" oninput="cnnSP(parseInt(this.value))"/>
        </div>
        <div class="info" id="cnn-info"></div>
      </div>
    </div>`;
  renderCNNStage();
}

function convImg(img, k) { const o=[]; for(let r=0;r<=img.length-3;r++){const row=[];for(let c=0;c<=img[0].length-3;c++){let s=0;for(let kr=0;kr<3;kr++)for(let kc=0;kc<3;kc++)s+=img[r+kr][c+kc]*k[kr][kc];row.push(s);}o.push(row);}return o; }
function drawFM(id, fm) { const c=document.getElementById(id);if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);let mn=Infinity,mx=-Infinity;fm.forEach(r=>r.forEach(v=>{if(v<mn)mn=v;if(v>mx)mx=v}));if(mx===mn)return;fm.forEach((row,r)=>row.forEach((v,col)=>{const n=(v-mn)/(mx-mn);ctx.fillStyle=`hsl(${Math.round(n*240)},80%,${30+n*40}%)`;const cell=c.width/fm[0].length;ctx.fillRect(col*cell,r*cell,cell,cell);})); }
function drawCNNIn() { const c=document.getElementById('cnn-in');if(!c)return;const ctx=c.getContext('2d');cnnImg.forEach((row,r)=>row.forEach((v,col)=>{ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(col*14,r*14,14,14);})); }

function cnnSP(pos) {
  const fm=convImg(cnnImg,cnnK);const cols=fm[0].length;const r=Math.floor(pos/cols),c=pos%cols;
  const zc=document.getElementById('cnn-zoom');if(zc){const ctx=zc.getContext('2d');ctx.clearRect(0,0,75,75);for(let kr=0;kr<3;kr++)for(let kc=0;kc<3;kc++){const v=cnnImg[r+kr]?.[c+kc]??0;ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(kc*25,kr*25,25,25);ctx.strokeStyle='#7c6bff55';ctx.lineWidth=1;ctx.strokeRect(kc*25,kr*25,25,25);}}
  let dp=0;for(let kr=0;kr<3;kr++)for(let kc=0;kc<3;kc++)dp+=(cnnImg[r+kr]?.[c+kc]??0)*cnnK[kr][kc];
  const dpEl=document.getElementById('cnndp');if(dpEl)dpEl.textContent=`dot=${dp.toFixed(1)} → ReLU → ${Math.max(0,dp).toFixed(1)}`;
  drawCNNIn();const ic=document.getElementById('cnn-in');if(ic){const ctx=ic.getContext('2d');ctx.fillStyle='rgba(124,107,255,0.3)';ctx.fillRect(c*14,r*14,42,42);ctx.strokeStyle='#7c6bff';ctx.lineWidth=2;ctx.strokeRect(c*14,r*14,42,42);}
}

function renderCNNStage() {
  const s=cnnStages[cnnStage];
  const pip=document.getElementById('cnn-pip');
  if(pip)pip.innerHTML=cnnStages.map((st,i)=>`<div style="display:flex;align-items:center"><div onclick="cnnStage=${i};renderCNNStage()" style="padding:4px 10px;border-radius:16px;font-size:10px;font-family:var(--mono);cursor:pointer;border:1px solid ${i===cnnStage?'#7c6bff':'#2a2a3d'};background:${i===cnnStage?'#7c6bff33':'transparent'};color:${i===cnnStage?'#7c6bff':'var(--mut)'}">${st.n}</div>${i<4?'<span style="color:var(--mut);padding:0 2px">›</span>':''}</div>`).join('');
  const lbl=document.getElementById('cnnlbl');if(lbl)lbl.textContent=`${cnnStage+1}/5`;
  const info=document.getElementById('cnn-info');if(info)info.innerHTML=s.info;
  let fm;
  if(s.n==='Input')fm=cnnImg;
  else if(s.n==='Conv1')fm=convImg(cnnImg,cnnK);
  else if(s.n==='ReLU')fm=convImg(cnnImg,cnnK).map(r=>r.map(v=>Math.max(0,v)));
  else if(s.n==='MaxPool'){const c2=convImg(cnnImg,cnnK).map(r=>r.map(v=>Math.max(0,v)));fm=[];for(let r=0;r<c2.length-1;r+=2){const row=[];for(let c=0;c<c2[0].length-1;c+=2)row.push(Math.max(c2[r][c],c2[r][c+1],c2[r+1][c],c2[r+1][c+1]));fm.push(row);}}
  else{const out=document.getElementById('cnn-out');if(out){const ctx=out.getContext('2d');ctx.clearRect(0,0,112,112);[['0',0.05],['1',0.72],['2',0.08],['3',0.04],['4',0.06],['5',0.05]].forEach(([l,p],i)=>{ctx.fillStyle=i===1?'#7c6bff':'#3a3a55';ctx.fillRect(4,i*17+4,Math.round(p*100),13);ctx.fillStyle='#e8e8f0';ctx.font='8px monospace';ctx.fillText(`${l}:${(p*100).toFixed(0)}%`,Math.round(p*100)+8,i*17+13);});}drawCNNIn();return;}
  drawFM('cnn-out',s.n==='Input'?cnnImg:fm);drawCNNIn();if(s.n==='Conv1')cnnSP(0);
}
function cnnNext(){cnnStage=Math.min(cnnStage+1,4);renderCNNStage();}
function cnnPrev(){cnnStage=Math.max(cnnStage-1,0);renderCNNStage();}

// ── TRANSFORMER ──────────────────────────────────────────────
const tfmToks=['The','quick','brown','fox','jumps'];let tfmLayer=0,tfmQT=0,tfmW=[];
const tfmLD=[{n:'Embedding + pos. encoding',c:'#7c6bff',d:'Tokens → 512-dim vectors + sinusoidal positional encodings.'},{n:'Multi-head self-attention',c:'#ff6b9d',d:'8 heads compute QKᵀ/√d attention in parallel, concat + project.'},{n:'Feed-forward network',c:'#ffa94d',d:'FFN(x)=max(0,xW₁+b₁)W₂+b₂. Expands 4× then contracts.'}];

function renderTFMViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">Transformer — token flow through layers</div>
        <div class="vctrls">
          <button class="cb" onclick="tfmPrev()">← Prev</button>
          <span id="tfmlbl" style="font-family:var(--mono);font-size:11px;color:var(--mut);padding:0 6px">1/3</span>
          <button class="cb pri" onclick="tfmNext()">Next →</button>
          <button class="cb" onclick="tfmRand()">Randomize</button>
        </div>
      </div>
      <div class="vb">
        <div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:7px">Click a token to inspect attention</div>
        <div id="tfm-toks" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px"></div>
        <div id="tfm-layers"></div>
        <div style="margin-top:10px"><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:5px">Attention weights — <span id="tfm-qlbl" style="color:var(--acc)">select token</span></div><div id="tfm-hmap"></div></div>
        <div class="info" id="tfm-info" style="margin-top:9px"></div>
      </div>
    </div>`;
  tfmRand();
}

function tfmRand(){tfmW=tfmToks.map(()=>tfmToks.map(()=>Math.random()));drawTFM();}
function smArr(a){const e=a.map(x=>Math.exp(x*3));const s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}

function drawTFM() {
  const toks=document.getElementById('tfm-toks');
  if(toks)toks.innerHTML=tfmToks.map((t,i)=>`<div style="padding:5px 10px;border-radius:6px;border:1px solid ${i===tfmQT?'var(--acc)':'var(--bdr)'};background:${i===tfmQT?'#7c6bff22':'var(--surf2)'};font-family:var(--mono);font-size:11px;cursor:pointer;color:${i===tfmQT?'var(--acc)':'var(--txt)'}" onclick="tfmQT=${i};drawTFM()">${t}</div>`).join('');
  const layers=document.getElementById('tfm-layers');
  if(layers)layers.innerHTML=tfmLD.map((l,i)=>`<div style="border-radius:6px;overflow:hidden;border:1px solid ${i===tfmLayer?l.c:'var(--bdr)'};margin-bottom:5px"><div onclick="tfmLayer=${i};drawTFM()" style="padding:8px 13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:${i===tfmLayer?l.c+'18':'transparent'};font-size:12px;font-weight:500"><span>${l.n}</span><span style="font-size:10px;color:${i===tfmLayer?l.c:'var(--mut)'}">${i===tfmLayer?'▼':''}</span></div>${i===tfmLayer?`<div style="padding:8px 13px;border-top:1px solid var(--bdr);font-size:11px;color:var(--mut)">${l.d}</div>`:''}</div>`).join('');
  const w=smArr(tfmW[tfmQT]||tfmToks.map(()=>Math.random()));
  const ql=document.getElementById('tfm-qlbl');if(ql)ql.textContent=`"${tfmToks[tfmQT]}"`;
  const hmap=document.getElementById('tfm-hmap');
  if(hmap)hmap.innerHTML=`<div style="display:flex;gap:4px;flex-wrap:wrap">${tfmToks.map((t,i)=>`<div style="text-align:center"><div style="background:rgba(124,107,255,${(w[i]*0.9+0.05).toFixed(2)});border-radius:5px;padding:7px 10px;font-size:10px;font-family:var(--mono);color:#fff;min-width:44px;margin-bottom:3px">${t}</div><div style="font-size:9px;color:var(--mut);font-family:var(--mono)">${w[i].toFixed(3)}</div></div>`).join('')}</div>`;
  const info=document.getElementById('tfm-info');
  const infos=[`"${tfmToks[tfmQT]}" at position ${tfmQT}. PE adds sin/cos waves unique to this position.`,`Attention: scores=QKᵀ/√d_k. Top token: "${tfmToks[w.indexOf(Math.max(...w))]}" (${Math.max(...w).toFixed(3)}).`,`FFN: d=512→2048→512 with ReLU. Residual: out=x+FFN(x).`];
  if(info)info.innerHTML=infos[tfmLayer]||'';
  const lbl=document.getElementById('tfmlbl');if(lbl)lbl.textContent=`${tfmLayer+1}/3`;
}
function tfmNext(){tfmLayer=Math.min(tfmLayer+1,2);drawTFM();}
function tfmPrev(){tfmLayer=Math.max(tfmLayer-1,0);drawTFM();}

// ── RNN ──────────────────────────────────────────────
const rnnSeq=['the','cat','sat','on','the','mat'];
let rnnPos=0, rnnMode='rnn', rnnH=new Array(16).fill(0), rnnC=new Array(16).fill(0);

function renderRNNViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">RNN / LSTM — sequential processing & memory</div>
        <div class="vctrls">
          <button class="cb" id="rnn-mode-btn" onclick="togRNN()">Mode: RNN</button>
          <button class="cb" onclick="rnnReset()">Reset</button>
          <button class="cb pri" onclick="rnnStepViz()">Next token →</button>
        </div>
      </div>
      <div class="vb">
        <div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:7px">Input sequence</div>
        <div id="rnn-seq" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px"></div>
        <div style="overflow-x:auto;margin-bottom:12px"><svg id="rnn-svg" width="860" height="200" viewBox="0 0 860 200" style="max-width:100%;display:block"></svg></div>
        <div id="rnn-gates" style="display:none;margin-bottom:12px"></div>
        <div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:5px">Hidden state hₜ (16 units)</div>
        <div id="rnn-h-vis" style="display:flex;gap:2px;flex-wrap:wrap"></div>
        <div class="info" id="rnn-info" style="margin-top:10px">Press "Next token →" to process the sequence.</div>
      </div>
    </div>`;
  rnnReset();
}

function togRNN(){rnnMode=rnnMode==='rnn'?'lstm':'rnn';const btn=document.getElementById('rnn-mode-btn');if(btn)btn.textContent='Mode: '+(rnnMode==='rnn'?'RNN':'LSTM');rnnReset();}
function rnnReset(){rnnPos=0;rnnH=new Array(16).fill(0);rnnC=new Array(16).fill(0);drawRNNState();}

function rnnStepViz() {
  if(rnnPos>=rnnSeq.length){rnnReset();return;}
  const seed=rnnPos+1;const x=[Math.sin(seed*1.3)*0.5,Math.sin(seed*2.1)*0.5,Math.sin(seed*3.7)*0.5,Math.sin(seed*4.9)*0.5];
  if(rnnMode==='rnn'){
    rnnH=rnnH.map((h,i)=>Math.tanh(x[i%4]*0.6+h*0.5+Math.sin(seed*(i+1))*0.1));
  }else{
    const f=i=>1/(1+Math.exp(-(x[i%4]*0.5+rnnH[i]*0.4+0.3)));
    const inp=i=>1/(1+Math.exp(-(x[i%4]*0.6+rnnH[i]*0.3)));
    const g=i=>Math.tanh(x[i%4]*0.7+rnnH[i]*0.2);
    const o=i=>1/(1+Math.exp(-(x[i%4]*0.5+rnnH[i]*0.4+0.2)));
    rnnC=rnnC.map((c,i)=>f(i)*c+inp(i)*g(i));
    rnnH=rnnC.map((c,i)=>o(i)*Math.tanh(c));
    const gates=document.getElementById('rnn-gates');
    if(gates){gates.style.display='block';gates.innerHTML=`<div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:6px">LSTM gate activations</div>`+[['forget','#ff6b9d',f(0)],['input','#7c6bff',inp(0)],['output','#00d4aa',o(0)]].map(([l,c,v])=>`<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><div style="font-size:10px;font-family:var(--mono);color:var(--mut);min-width:72px">${l}</div><div style="flex:1;height:8px;background:var(--bdr);border-radius:4px;overflow:hidden"><div style="height:100%;width:${(v*100).toFixed(0)}%;background:${c};border-radius:4px;transition:width .5s"></div></div><div style="font-size:10px;font-family:var(--mono);min-width:34px;text-align:right">${v.toFixed(2)}</div></div>`).join('');}
  }
  const info=document.getElementById('rnn-info');
  if(info)info.innerHTML=rnnMode==='rnn'?`<strong>t=${rnnPos+1}:</strong> Processing "<em>${rnnSeq[rnnPos]}</em>". hₜ=tanh(Wₓxₜ+Wₕhₜ₋₁+b). Single state carries all history — <em>early tokens fade over time</em>.`:`<strong>t=${rnnPos+1}:</strong> LSTM processing "<em>${rnnSeq[rnnPos]}</em>". Cell state (orange highway) preserves long-term memory across gates.`;
  rnnPos++;
  drawRNNState();
}

function drawRNNState(){
  const seqEl=document.getElementById('rnn-seq');
  if(seqEl)seqEl.innerHTML=rnnSeq.map((t,i)=>`<div style="padding:5px 10px;border-radius:6px;border:1px solid ${i===rnnPos-1?'var(--acc)':i<rnnPos?'var(--acc3)':'var(--bdr)'};background:${i===rnnPos-1?'#7c6bff22':i<rnnPos?'#00d4aa18':'var(--surf2)'};font-family:var(--mono);font-size:11px;color:${i===rnnPos-1?'var(--acc)':i<rnnPos?'var(--acc3)':'var(--txt)'}">${t}</div>`).join('');
  const hv=document.getElementById('rnn-h-vis');
  if(hv)hv.innerHTML=rnnH.map(v=>`<div style="width:13px;height:18px;border-radius:2px;background:hsla(${v>0?260:350},70%,${30+Math.abs(v)*40}%,${0.3+Math.abs(v)*0.7});transition:background .4s"></div>`).join('');
  const svg=document.getElementById('rnn-svg');if(!svg)return;
  const steps=Math.min(rnnPos,5);let s='<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
  for(let i=0;i<Math.max(steps,1);i++){const x=30+i*148;const isA=i===rnnPos-1;const tok=rnnSeq[i]||'';s+=`<rect x="${x}" y="60" width="130" height="70" rx="9" fill="${isA?'#7c6bff22':'#1c1c28'}" stroke="${isA?'#7c6bff':'#2a2a3d'}" stroke-width="${isA?1.5:0.8}"/>`;s+=`<text x="${x+65}" y="100" text-anchor="middle" font-family="Space Mono" font-size="11" fill="${isA?'#7c6bff':'#6b6b8a'}">h${i}</text>`;s+=`<text x="${x+65}" y="54" text-anchor="middle" font-family="Space Mono" font-size="10" fill="${i<rnnPos?'#00d4aa':'#3a3a55'}">${tok}</text>`;if(i<rnnPos)s+=`<line x1="${x+65}" y1="58" x2="${x+65}" y2="62" stroke="${isA?'#00d4aa':'#3a3a5566'}" stroke-width="1.5" stroke-dasharray="4 2" marker-end="url(#ar)"/>`;if(rnnMode==='lstm')s+=`<line x1="${x}" y1="70" x2="${x+130}" y2="70" stroke="#ffa94d" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`;if(i<steps-1){s+=`<line x1="${x+130}" y1="95" x2="${x+148}" y2="95" stroke="${isA?'#7c6bff':'#3a3a55'}" stroke-width="1.5" ${isA?'stroke-dasharray="5 3"':''} marker-end="url(#ar)"/>`;}}
  svg.innerHTML=s;
}

// ── DIFFUSION (viz page) ──────────────────────────────────────────────
function renderDiffViz(container) {
  container.innerHTML = `
    <div class="vc">
      <div class="vh">
        <div class="vt">Diffusion — forward noising process</div>
        <div class="vctrls">
          <button class="cb" onclick="diffVizPrev()">← Prev</button>
          <span id="dvlbl" style="font-family:var(--mono);font-size:11px;color:var(--mut);padding:0 6px">t=0</span>
          <button class="cb pri" onclick="diffVizNext()">Next →</button>
          <button class="cb" id="dvauto" onclick="diffVizAuto()">Auto ▶</button>
        </div>
      </div>
      <div class="vb">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;margin-bottom:12px">
          <div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:5px">Original x₀</div><canvas id="dv-orig" width="80" height="80" style="border-radius:6px;border:1px solid var(--bdr);image-rendering:pixelated;width:80px;height:80px"></canvas></div>
          <div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:5px" id="dv-nlbl">Noisy xₜ (t=0)</div><canvas id="dv-noisy" width="80" height="80" style="border-radius:6px;border:1px solid var(--bdr);image-rendering:pixelated;width:80px;height:80px"></canvas></div>
          <div style="flex:1;min-width:160px">
            <div style="font-size:9px;color:var(--mut);font-family:var(--mono);margin-bottom:6px">Signal vs noise</div>
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><div style="font-size:9px;font-family:var(--mono);color:var(--mut);min-width:60px">Signal ᾱₜ</div><div style="flex:1;height:8px;background:var(--bdr);border-radius:4px;overflow:hidden"><div id="dv-sbar" style="height:100%;background:var(--acc3);border-radius:4px;width:100%;transition:width .4s"></div></div><div id="dv-sval" style="font-size:9px;font-family:var(--mono);min-width:30px;text-align:right">100%</div></div>
            <div style="display:flex;align-items:center;gap:7px"><div style="font-size:9px;font-family:var(--mono);color:var(--mut);min-width:60px">Noise</div><div style="flex:1;height:8px;background:var(--bdr);border-radius:4px;overflow:hidden"><div id="dv-nbar" style="height:100%;background:var(--acc2);border-radius:4px;width:0%;transition:width .4s"></div></div><div id="dv-nval" style="font-size:9px;font-family:var(--mono);min-width:30px;text-align:right">0%</div></div>
          </div>
        </div>
        <div class="info" id="dv-info">t=0: Clean image. ᾱ₀≈1 — pure signal. No noise added.</div>
      </div>
    </div>`;
  initDiffViz();
}

function initDiffViz() {
  const img = getOrCreateOrigImg();
  drawCanvas('dv-orig', img);
  renderDVStep(0);
}

function renderDVStep(t) {
  dvStep = t;
  const orig = getOrCreateOrigImg();
  const img = t === 0 ? orig : noisyAt(orig, t);
  drawCanvas('dv-noisy', img);
  const ab = getAlphaBar(t);
  const sp = Math.round(ab * 100), np = 100 - sp;
  const sbar=document.getElementById('dv-sbar'),nbar=document.getElementById('dv-nbar');
  const sval=document.getElementById('dv-sval'),nval=document.getElementById('dv-nval');
  if(sbar)sbar.style.width=sp+'%'; if(sval)sval.textContent=sp+'%';
  if(nbar)nbar.style.width=np+'%'; if(nval)nval.textContent=np+'%';
  const nlbl=document.getElementById('dv-nlbl'); if(nlbl)nlbl.textContent=`Noisy xₜ (t=${t})`;
  const dvlbl=document.getElementById('dvlbl'); if(dvlbl)dvlbl.textContent=`t=${t}`;
  const msgs={0:'t=0: Clean image. ᾱ₀≈1 — pure signal.',5:'t=5: Slight noise. ᾱ₅≈0.75. Easy to denoise.',10:'t=10: Structure fading. ᾱ₁₀≈0.45. Moderate noise.',15:'t=15: Heavy noise. ᾱ₁₅≈0.18. Original barely visible.',19:'t=T−1: Pure noise. ᾱ₁₉≈0.02. Starting point for generation.'};
  const info=document.getElementById('dv-info'); if(info)info.innerHTML=msgs[t]||`t=${t}: ᾱₜ=${(ab*100).toFixed(1)}% signal.`;
}

function diffVizNext(){renderDVStep(Math.min(dvStep+1,DIFF_T-1));}
function diffVizPrev(){renderDVStep(Math.max(dvStep-1,0));}
function diffVizAuto(){
  if(dvAutoTimer){clearInterval(dvAutoTimer);dvAutoTimer=null;const b=document.getElementById('dvauto');if(b)b.textContent='Auto ▶';return;}
  const b=document.getElementById('dvauto');if(b)b.textContent='Stop ◼';
  dvAutoTimer=setInterval(()=>{if(dvStep>=DIFF_T-1)dvStep=-1;renderDVStep(dvStep+1);},380);
}
