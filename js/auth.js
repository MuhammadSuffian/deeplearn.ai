// js/auth.js — authentication & session management
let currentUser = null;

function switchAuthTab(t) {
  ['signin', 'signup'].forEach(s => {
    document.getElementById(s + '-form').style.display = s === t ? 'block' : 'none';
    document.getElementById('tab-' + s).classList.toggle('active', s === t);
  });
  document.getElementById('auth-err').style.display = 'none';
}

function checkStrength(pwd) {
  const score = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
  const colors = ['#ff6b9d', '#ff6b9d', '#ffa94d', '#7c6bff', '#00d4aa'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const fill = document.getElementById('strength-fill');
  if (fill) { fill.style.width = (score * 25) + '%'; fill.style.background = colors[score]; }
  const lbl = document.getElementById('strength-lbl');
  if (lbl) lbl.textContent = labels[score];
}

function showAuthErr(msg) {
  const el = document.getElementById('auth-err');
  el.textContent = msg;
  el.style.display = 'block';
}

function makeDefaultProgress(email) {
  const isDemo = email === 'demo@deeplearn.ai';
  return {
    xp: isDemo ? 340 : 0,
    streak: isDemo ? 7 : 0,
    quizAvg: null,
    completedModules: isDemo ? ['Fundamentals'] : [],
    diffExProgress: [false, false, false, false],
    diffExXP: 0,
    quizScores: {},
    srCards: getDefaultSRCards(),
    activity: isDemo ? [true,true,true,true,true,true,true] : Array(7).fill(false),
    settings: { notif: true, sr: true, sol: false },
    bio: '',
    goal: 'career'
  };
}

function getDefaultSRCards() {
  return [
    { id: 'bp-chain',     topic: 'Backpropagation', concept: 'Chain rule & gradient flow',    interval: 1, ef: 2.5, nextReview: 0, reps: 2 },
    { id: 'attn-softmax', topic: 'Attention',        concept: 'Softmax scaling √d_k',          interval: 3, ef: 2.3, nextReview: 2, reps: 3 },
    { id: 'rnn-vanish',   topic: 'RNNs',             concept: 'Vanishing gradient problem',     interval: 1, ef: 2.1, nextReview: 0, reps: 1 },
    { id: 'cnn-recept',   topic: 'CNNs',             concept: 'Receptive field calculation',   interval: 7, ef: 2.6, nextReview: 5, reps: 4 },
    { id: 'diff-ab',      topic: 'Diffusion',        concept: 'Forward process ᾱₜ formula',    interval: 1, ef: 2.5, nextReview: 1, reps: 0 },
    { id: 'lstm-gates',   topic: 'RNNs',             concept: 'LSTM forget gate mechanism',    interval: 2, ef: 2.2, nextReview: 0, reps: 2 },
    { id: 'tfm-pe',       topic: 'Transformers',     concept: 'Positional encoding formula',   interval: 4, ef: 2.4, nextReview: 3, reps: 3 },
  ];
}

function doSignIn() {
  const email = document.getElementById('si-email').value.trim();
  const pass  = document.getElementById('si-pass').value;
  if (!email || !pass) { showAuthErr('Please enter email and password.'); return; }
  const accounts = DB.load('accounts', []);
  const acc = accounts.find(a => a.email === email);
  if (acc && acc.password === pass) { loginAs(acc); return; }
  if (pass === 'demo123') {
    const demo = { email, name: email.split('@')[0] || 'Learner', level: 'intermediate', color: '#7c6bff', joinDate: new Date().toISOString() };
    loginAs(demo); return;
  }
  showAuthErr('No account found or wrong password. Try password "demo123" for demo access.');
}

function doSignUp() {
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-pass').value;
  const level = document.getElementById('su-level').value;
  if (!name || !email || !pass) { showAuthErr('Please fill in all fields.'); return; }
  if (pass.length < 8) { showAuthErr('Password must be at least 8 characters.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showAuthErr('Please enter a valid email address.'); return; }
  const accounts = DB.load('accounts', []);
  if (accounts.find(a => a.email === email)) { showAuthErr('Email already registered. Sign in instead.'); return; }
  const palette = ['#7c6bff','#ff6b9d','#00d4aa','#ffa94d','#e040fb'];
  const acc = { email, password: pass, name, level, color: palette[accounts.length % palette.length], joinDate: new Date().toISOString() };
  accounts.push(acc);
  DB.save('accounts', accounts);
  loginAs(acc);
}

function doDemo() {
  loginAs({ email: 'demo@deeplearn.ai', name: 'Demo Learner', level: 'intermediate', color: '#7c6bff', joinDate: new Date().toISOString() });
}

function loginAs(acc) {
  currentUser = { ...acc };
  DB.save('current_user', acc);
  let prog = DB.load('progress_' + acc.email, null);
  if (!prog) { prog = makeDefaultProgress(acc.email); DB.save('progress_' + acc.email, prog); }
  currentUser.prog = prog;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  updateTopbar();
  showPage('viz');
  if (typeof initApp === 'function') initApp();
  showSaveIndicator();
}

function doSignOut() {
  currentUser = null;
  DB.del('current_user');
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('si-email').value = '';
  document.getElementById('si-pass').value = '';
  document.getElementById('auth-err').style.display = 'none';
}

function saveProgress() {
  if (!currentUser) return;
  DB.save('progress_' + currentUser.email, currentUser.prog);
  showSaveIndicator();
}

function showSaveIndicator() {
  const tb = document.querySelector('.topbar');
  if (!tb) return;
  document.querySelectorAll('.save-indicator').forEach(el => el.remove());
  const el = document.createElement('div');
  el.className = 'save-indicator';
  el.textContent = '✓ Saved';
  tb.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// SM-2 algorithm
function sm2Update(card, q) {
  const newEF = Math.max(1.3, card.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  let newInterval;
  if (q < 3)             newInterval = 1;
  else if (card.reps === 0) newInterval = 1;
  else if (card.reps === 1) newInterval = 6;
  else                   newInterval = Math.round(card.interval * newEF);
  card.ef = newEF;
  card.interval = newInterval;
  card.nextReview = newInterval;
  card.reps++;
}

// Auto-login on page load
(function restoreSession() {
  const saved = DB.load('current_user', null);
  if (saved) {
    const prog = DB.load('progress_' + saved.email, null);
    if (prog) { saved.prog = prog; loginAs(saved); }
  }
})();
