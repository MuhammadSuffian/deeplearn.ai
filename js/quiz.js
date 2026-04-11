// js/quiz.js — quiz system with SM-2 spaced repetition
const quizBanks = {
  'Neural Networks': { icon: '🔗', color: '#7c6bff', qs: [
    { q: 'What does ReLU do to negative inputs?', opts: ['Squares them','Returns unchanged','Sets to zero','Absolute value'], ans: 2, exp: 'ReLU(x)=max(0,x). Negatives become 0, creating sparsity and avoiding vanishing gradients.' },
    { q: 'Best weight init for ReLU layers?', opts: ['All zeros','Xavier','He initialization','Random large'], ans: 2, exp: 'He: w~N(0,2/n_in). Factor 2 compensates for ReLU zeroing half neurons on average.' },
    { q: 'What problem does BatchNorm address?', opts: ['Overfitting','Internal covariate shift','Slow inference','Underfitting'], ans: 1, exp: 'BatchNorm normalizes layer inputs to zero mean and unit variance, stabilizing and accelerating training.' },
  ]},
  'Backpropagation': { icon: '↩', color: '#ff6b9d', qs: [
    { q: 'Backpropagation uses which mathematical rule?', opts: ['Product rule','Chain rule','Power rule','Quotient rule'], ans: 1, exp: 'Chain rule: ∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w. Decomposes complex gradients into simpler products.' },
    { q: 'What is the vanishing gradient problem?', opts: ['Gradients too large','Gradients shrink to near zero through deep layers','Weights become negative','Loss stops decreasing'], ans: 1, exp: 'Sigmoid derivatives ≤0.25 multiply across layers. Over many layers the product → 0, making early layers learn very slowly.' },
  ]},
  'Attention & Transformers': { icon: '⚡', color: '#00d4aa', qs: [
    { q: 'What are Q, K, V in attention?', opts: ['Features, values, outputs','Query, Key, Value','Input, hidden, output','Embeddings, tokens, positions'], ans: 1, exp: 'Query (what I seek), Key (what I offer), Value (my content). output=softmax(QKᵀ/√d)·V' },
    { q: 'Why divide attention scores by √d_k?', opts: ['Larger gradients','Prevent softmax saturation','Normalize embeddings','Reduce parameters'], ans: 1, exp: 'Large d_k causes large dot products, pushing softmax into near-zero-gradient regions. √d_k scaling keeps variance ~1.' },
    { q: 'What does positional encoding add?', opts: ['Random noise','Position information to embeddings','A learned weight matrix','Token frequency counts'], ans: 1, exp: 'Transformers are permutation-invariant. PE adds sine/cosine waves of different frequencies to encode each token\'s position.' },
  ]},
  'CNNs': { icon: '⊞', color: '#ffa94d', qs: [
    { q: 'Output of a 7×7 input with 3×3 kernel, no padding, stride 1?', opts: ['7×7','5×5','6×6','4×4'], ans: 1, exp: '(7−3+0)/1+1=5. Output is 5×5.' },
    { q: 'What does max pooling do?', opts: ['Averages a region','Takes maximum in window','Applies learned filter','Doubles dimensions'], ans: 1, exp: 'Takes the max in each pooling window. Halves spatial dimensions, provides translation invariance.' },
  ]},
  'RNNs & LSTMs': { icon: '↻', color: '#e040fb', qs: [
    { q: 'Main advantage of LSTM over vanilla RNN?', opts: ['Faster training','Long-range memory via cell state','Fewer parameters','No backprop needed'], ans: 1, exp: 'Cell state = gradient highway. Gating prevents vanishing/exploding gradients across many timesteps.' },
    { q: 'What does the forget gate decide?', opts: ['What new info to write','What fraction of cell state to erase','What to output','How many layers to use'], ans: 1, exp: 'f_t=σ(W_f·[h_{t-1},x_t]+b_f). Values near 0 erase, near 1 keep. Controls what the LSTM "remembers".' },
    { q: 'Most susceptible to vanishing gradients?', opts: ['LSTM','GRU','Vanilla RNN','Transformer'], ans: 2, exp: 'Vanilla RNNs multiply the same W_h at every timestep, driving gradients exponentially to 0 over long sequences.' },
  ]},
  'Diffusion Models': { icon: '~', color: '#ff6b9d', qs: [
    { q: 'What does the forward process q(xₜ|x₀) do?', opts: ['Generates new images','Adds Gaussian noise over T steps','Removes noise from xₜ','Trains the U-Net'], ans: 1, exp: 'q(xₜ|x₀)=N(√ᾱₜ x₀,(1−ᾱₜ)I). Progressively corrupts x₀ with Gaussian noise over T timesteps.' },
    { q: 'What does the U-Net predict during DDPM training?', opts: ['The clean image x₀','The noisy image xₜ','The noise ε added at timestep t','The class label'], ans: 2, exp: 'DDPM trains ε̂θ to predict noise ε from (xₜ, t). Loss: E[‖ε−ε̂θ(xₜ,t)‖²]. Simple MSE!' },
    { q: 'What is ᾱₜ (alpha bar)?', opts: ['Learning rate schedule','Cumulative product ∏(1−βᵢ) from i=0 to t','Noise level only','U-Net activation output'], ans: 1, exp: 'ᾱₜ=∏ᵢ(1−βᵢ). Controls signal/noise ratio. Used in xₜ=√ᾱₜ·x₀+√(1−ᾱₜ)·ε.' },
    { q: 'Key difference: DDPM vs DDIM?', opts: ['Different U-Net architectures','DDIM is deterministic, needs fewer steps','DDIM adds more noise','DDPM is faster'], ans: 1, exp: 'DDIM rewrites sampling as a deterministic ODE — 20-50 steps vs 1000. Both reuse the same trained U-Net.' },
  ]},
};

let activeQuizTopic = '', qIdx = 0, qCorrect = 0, qAnswers = [], isSRMode = false, currentSRCard = null;

function renderQuizHub() {
  const page = document.getElementById('page-quiz');
  if (!page) return;
  page.innerHTML = `
    <div class="quiz-page">
      <div class="pg-t">Quiz Hub</div>
      <div class="pg-s">Test your knowledge. Earn XP. Spaced repetition surfaces weak spots.</div>
      ${renderSRPanel()}
      <div style="font-size:14px;font-weight:600;margin-bottom:10px">All topic banks</div>
      <div class="quiz-hub">
        ${Object.entries(quizBanks).map(([t, d]) => {
          const dueCount = currentUser?.prog?.srCards?.filter(c => c.topic === t.split(' ')[0] && c.nextReview <= 0).length ?? 0;
          return `<div class="quiz-hub-card" onclick="startQuiz('${t}', false)">
            <div style="font-size:20px;margin-bottom:8px">${d.icon}</div>
            <div style="font-size:13px;font-weight:600;margin-bottom:3px">${t}</div>
            <div style="font-size:11px;color:var(--mut)">${d.qs.length} questions · +${d.qs.length * 20} XP</div>
            <div class="qc-bar"><div class="qc-fill" style="width:${Math.floor(Math.random()*60)}%;background:${d.color}"></div></div>
            ${dueCount > 0 ? `<div class="qc-due">⚡ ${dueCount} due for review</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderSRPanel() {
  if (!currentUser?.prog?.srCards) return '';
  const cards = currentUser.prog.srCards;
  const dueToday = cards.filter(c => c.nextReview <= 0).length;
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const today = 3;
  let calHtml = days.map(d => `<div class="sr-day sr-day-hdr">${d}</div>`).join('');
  for (let i = 0; i < 28; i++) {
    const dueCount = cards.filter(c => c.nextReview === i % 7).length;
    const cls = i === today ? 'today' : dueCount > 0 && i < today ? 'overdue' : dueCount > 0 ? 'has-review' : i < today ? 'done' : '';
    calHtml += `<div class="sr-day sr-day-cell ${cls}"><div style="font-size:11px;font-weight:600">${i + 1}</div><div style="font-size:9px;color:var(--mut)">${dueCount > 0 ? dueCount + '📚' : ''}</div></div>`;
  }
  const queueHtml = cards.sort((a, b) => a.nextReview - b.nextReview).slice(0, 5).map(c =>
    `<div class="sr-q-item" onclick="startSRReview('${c.id}')">
      <div style="width:8px;height:8px;border-radius:50%;background:${c.nextReview<=0?'var(--acc2)':c.nextReview<=2?'var(--amb)':'var(--acc3)'}"></div>
      <div class="sr-q-topic">${c.concept}<div class="sr-q-meta">${c.topic}</div></div>
      <div style="font-size:10px;font-family:var(--mono);color:var(--mut)">EF ${c.ef.toFixed(1)}</div>
      <div class="sr-q-due ${c.nextReview<=0?'due-over':c.nextReview<=2?'due-soon':'due-today'}">${c.nextReview<=0?'Due now':c.nextReview===1?'Tomorrow':'In '+c.nextReview+'d'}</div>
    </div>`
  ).join('');
  return `
    <div class="sr-panel">
      <div class="sr-ph"><div class="sr-ph-title">Spaced repetition scheduler</div><div style="font-size:11px;color:var(--mut);font-family:var(--mono)">${dueToday} due today</div></div>
      <div class="sr-calendar">${calHtml}</div>
      <div style="padding:0 14px 5px;font-size:10px;color:var(--mut);font-family:var(--mono)">Review queue</div>
      <div style="padding:0 14px 14px">${queueHtml}</div>
    </div>`;
}

function startSRReview(id) {
  currentSRCard = currentUser?.prog?.srCards?.find(c => c.id === id);
  if (!currentSRCard) return;
  const topicMap = { 'Backpropagation':'Backpropagation', 'Attention':'Attention & Transformers', 'Transformers':'Attention & Transformers', 'CNNs':'CNNs', 'RNNs':'RNNs & LSTMs', 'Diffusion':'Diffusion Models' };
  startQuiz(topicMap[currentSRCard.topic] || 'Neural Networks', true);
}

function startQuiz(topic, srMode) {
  activeQuizTopic = topic; isSRMode = srMode;
  qIdx = 0; qCorrect = 0; qAnswers = [];
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const bank = quizBanks[activeQuizTopic];
  if (!bank) return;
  const q = bank.qs[qIdx];
  const total = bank.qs.length;
  const page = document.getElementById('page-quiz');
  if (!page) return;
  page.innerHTML = `
    <div class="quiz-page">
      <div class="pg-t">${activeQuizTopic}${isSRMode ? ' — Review' : ''}</div>
      <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden">
        <div style="height:3px;background:var(--bdr)"><div style="height:100%;background:var(--acc);width:${(qIdx/total*100).toFixed(0)}%;transition:width .4s"></div></div>
        <div style="padding:10px 16px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between"><span style="font-size:11px;color:var(--mut);font-family:var(--mono)">Q ${qIdx+1}/${total}</span><span style="font-size:11px;color:var(--acc);font-family:var(--mono)">${activeQuizTopic}</span></div>
        <div style="padding:18px">
          <div style="font-size:15px;font-weight:500;margin-bottom:16px">${q.q}</div>
          <div id="q-opts">${q.opts.map((o,i)=>`<button class="qopt" onclick="answerQ(${i})">${o}</button>`).join('')}</div>
          <div id="q-fb" style="display:none;margin-top:12px;padding:11px 13px;border-radius:7px;font-size:13px;line-height:1.6"></div>
          <div id="sm2-panel" style="display:none;margin-top:12px">
            <div style="font-size:11px;color:var(--mut);font-family:var(--mono);margin-bottom:7px">SM-2 rating — affects next review interval</div>
            <div class="sm2-row">
              ${[['0','Blackout'],['1','Wrong'],['2','Hard'],['3','OK'],['4','Easy'],['5','Perfect']].map(([v,l])=>`<div class="sm2-btn" onclick="rateSM2(${v})">${v}<div style="font-size:9px;color:var(--mut)">${l}</div></div>`).join('')}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--bdr);display:flex;justify-content:flex-end">
          <div id="q-xp" style="font-size:11px;font-family:var(--mono);color:var(--acc3);margin-right:auto"></div>
          <button class="cb pri" id="q-next" style="display:none" onclick="quizNext()">Next →</button>
        </div>
      </div>
    </div>`;
}

function answerQ(idx) {
  const q = quizBanks[activeQuizTopic].qs[qIdx];
  document.querySelectorAll('.qopt').forEach(o => o.disabled = true);
  const ok = idx === q.ans;
  if (ok) qCorrect++;
  qAnswers.push({ ok, q: q.q, right: q.opts[q.ans] });
  document.querySelectorAll('.qopt')[idx].classList.add(ok ? 'correct' : 'wrong');
  if (!ok) document.querySelectorAll('.qopt')[q.ans].classList.add('reveal');
  const fb = document.getElementById('q-fb');
  if (fb) {
    fb.style.display = 'block';
    fb.className = 'qfb ' + (ok ? 'ok' : 'bad');
    fb.textContent = (ok ? '✓ Correct! ' : '✗ Not quite. ') + q.exp;
  }
  addXP(ok ? 20 : 5);
  const xpEl = document.getElementById('q-xp'); if (xpEl) xpEl.textContent = ok ? '+20 XP' : '+5 XP';
  const next = document.getElementById('q-next'); if (next) { next.style.display = 'block'; next.textContent = qIdx < quizBanks[activeQuizTopic].qs.length - 1 ? 'Next →' : 'Results →'; }
  if (isSRMode) { const sm2 = document.getElementById('sm2-panel'); if (sm2) sm2.style.display = 'block'; }
}

function rateSM2(q) {
  if (currentSRCard) { sm2Update(currentSRCard, q); saveProgress(); }
  document.getElementById('sm2-panel').style.display = 'none';
  quizNext();
}

function quizNext() {
  qIdx++;
  if (qIdx >= quizBanks[activeQuizTopic].qs.length) { showQuizResults(); return; }
  renderQuizQuestion();
}

function showQuizResults() {
  const total = quizBanks[activeQuizTopic].qs.length;
  const pct = Math.round(qCorrect / total * 100);
  const page = document.getElementById('page-quiz');
  if (!page) return;
  page.innerHTML = `
    <div class="quiz-page">
      <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);padding:28px 20px;text-align:center">
        <div style="font-size:52px;font-weight:700;font-family:var(--mono);color:var(--acc);margin-bottom:4px">${pct}%</div>
        <div style="font-size:13px;color:var(--mut);margin-bottom:20px">${qCorrect}/${total} correct — ${activeQuizTopic}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;text-align:left">
          <div style="background:var(--surf2);border-radius:7px;padding:10px 12px"><div style="font-size:18px;font-weight:700;font-family:var(--mono);color:var(--acc3)">${qCorrect}</div><div style="font-size:10px;color:var(--mut)">Correct</div></div>
          <div style="background:var(--surf2);border-radius:7px;padding:10px 12px"><div style="font-size:18px;font-weight:700;font-family:var(--mono);color:var(--acc2)">${total-qCorrect}</div><div style="font-size:10px;color:var(--mut)">Missed</div></div>
          <div style="background:var(--surf2);border-radius:7px;padding:10px 12px"><div style="font-size:18px;font-weight:700;font-family:var(--mono);color:var(--acc)">${qCorrect*20+(total-qCorrect)*5}</div><div style="font-size:10px;color:var(--mut)">XP earned</div></div>
        </div>
        ${pct < 80 ? `<div style="background:linear-gradient(135deg,#7c6bff18,#ff6b9d12);border:1px solid #7c6bff44;border-radius:9px;padding:12px 14px;margin-bottom:16px;text-align:left;font-size:13px">🔁 <strong>${total-qCorrect} concept${total-qCorrect!==1?'s':''}</strong> scheduled for spaced repetition review.</div>` : ''}
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="cb pri" onclick="startQuiz('${activeQuizTopic}',false)">Retry</button>
          <button class="cb" onclick="renderQuizHub()">Quiz hub</button>
        </div>
      </div>
    </div>`;
  saveProgress();
}
