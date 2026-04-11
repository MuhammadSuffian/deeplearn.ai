// js/progress.js
const modules = [
  {n:'Fundamentals',   s:'Perceptrons, activations, loss', ic:'🧠', col:'#7c6bff22', basePct:100, baseSt:'done'},
  {n:'Neural Networks',s:'Layers, backprop, optimizers',   ic:'🔗', col:'#ff6b9d22', basePct:65,  baseSt:'active'},
  {n:'CNNs',           s:'Convolutions, pooling',          ic:'⊞', col:'#ffa94d22', basePct:0,   baseSt:'locked'},
  {n:'RNNs & LSTMs',   s:'Sequences, memory',              ic:'↻', col:'#e040fb22', basePct:0,   baseSt:'locked'},
  {n:'Transformers',   s:'Attention, GPT',                 ic:'⚡', col:'#00d4aa22', basePct:0,   baseSt:'locked'},
  {n:'Diffusion Models',s:'DDPM, DDIM, U-Net',             ic:'~',  col:'#ff6b9d22', basePct:0,   baseSt:'locked'},
];

function renderProgress() {
  if (!currentUser?.prog) return;
  const prog = currentUser.prog;
  const page = document.getElementById('page-progress');
  if (!page) return;

  // Compute diffusion module progress from exercises
  const diffDone = prog.diffExProgress ? prog.diffExProgress.filter(Boolean).length : 0;
  const diffPct  = Math.round(diffDone / 4 * 100);
  const diffSt   = diffDone === 4 ? 'done' : diffDone > 0 ? 'active' : 'locked';

  const mods = modules.map(m => ({
    ...m,
    pct: m.n === 'Diffusion Models' ? diffPct : m.basePct,
    st:  m.n === 'Diffusion Models' ? diffSt : m.baseSt,
  }));

  const days = ['M','T','W','T','F','S','S'];
  const streakHtml = days.map((d, i) => `<div class="sk-d ${prog.activity[i] ? 'skd' : i === 6 ? 'skt' : ''}">${d}</div>`).join('');

  const certs = (prog.completedModules || []).map(m =>
    `<div class="cert-card"><div style="font-size:28px">🎓</div><div><div style="font-size:13px;font-weight:600">Certificate — ${m}</div><div style="font-size:11px;color:var(--mut);margin-top:3px">Completed · Shareable</div></div></div>`
  ).join('');

  page.innerHTML = `
    <div class="prog-pg">
      <div class="pg-t" style="margin-bottom:4px">Learning Path</div>
      <div class="pg-s">Welcome back, ${currentUser.name.split(' ')[0]}!</div>
      <div class="sg">
        <div class="sc"><div class="sn" style="color:var(--acc)">${prog.xp}</div><div class="sl">Total XP</div></div>
        <div class="sc"><div class="sn" style="color:var(--acc2)">${prog.streak}</div><div class="sl">Day streak</div></div>
        <div class="sc"><div class="sn" style="color:var(--acc3)">${(prog.completedModules||[]).length}</div><div class="sl">Completed</div></div>
        <div class="sc"><div class="sn" style="color:var(--amb)">${prog.quizAvg ? Math.round(prog.quizAvg / 10 * 100) + '%' : '—'}</div><div class="sl">Quiz avg</div></div>
      </div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:7px;font-family:var(--mono)">Recent activity</div>
      <div class="sk-row">${streakHtml}</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:9px">Modules</div>
      ${mods.map(m => `
        <div class="mc" onclick="${m.n==='Diffusion Models'?"showPage('diffex')":"showPage('quiz')"}">
          <div class="mi" style="background:${m.col}">${m.ic}</div>
          <div style="flex:1">
            <div class="mn">${m.n}</div>
            <div class="ms">${m.s}</div>
            ${m.pct > 0 ? `<div class="pbw"><div class="pbf" style="width:${m.pct}%;background:${m.st==='done'?'#00d4aa':'#7c6bff'}"></div></div>` : ''}
          </div>
          <div class="mst ${m.st==='done'?'s-d':m.st==='active'?'s-a':'s-l'}">${m.st==='done'?'✓':m.st==='active'?m.pct+'%':'🔒'}</div>
        </div>`).join('')}
      ${certs ? `<div style="font-size:14px;font-weight:600;margin:14px 0 9px">Certificates</div>${certs}` : ''}
    </div>`;
}
