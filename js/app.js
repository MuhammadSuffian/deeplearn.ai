// js/app.js — page navigation, XP, topbar

function showPage(p) {
  const pages = ['viz', 'diffex', 'quiz', 'lb', 'progress', 'profile'];
  pages.forEach(id => {
    const el = document.getElementById('page-' + id);
    if (el) el.style.display = id === p ? (id === 'diffex' ? 'flex' : 'block') : 'none';
  });
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.toggle('active', pages[i] === p);
  });
  document.getElementById('user-menu').classList.remove('open');

  if (p === 'viz')      { if (typeof renderVizPage === 'function') renderVizPage(); }
  if (p === 'diffex')   { if (typeof renderDiffExercise === 'function') renderDiffExercise(0); }
  if (p === 'quiz')     { if (typeof renderQuizHub === 'function') renderQuizHub(); }
  if (p === 'lb')       { if (typeof renderLB === 'function') renderLB(); }
  if (p === 'progress') { if (typeof renderProgress === 'function') renderProgress(); }
  if (p === 'profile')  { if (typeof renderProfile === 'function') renderProfile(); }
}

function updateTopbar() {
  if (!currentUser) return;
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = document.getElementById('topbar-av');
  if (av) { av.textContent = initials; av.style.background = currentUser.color + '33'; av.style.color = currentUser.color; }
  const nm = document.getElementById('topbar-name'); if (nm) nm.textContent = currentUser.name;
  const xp = document.getElementById('topbar-xp');   if (xp) xp.textContent = (currentUser.prog?.xp ?? 0) + ' XP';
}

function addXP(n) {
  if (!currentUser?.prog) return;
  currentUser.prog.xp += n;
  updateTopbar();
  saveProgress();
}

function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.user-pill')) {
    document.getElementById('user-menu')?.classList.remove('open');
  }
});

function initApp() {
  updateTopbar();
  if (typeof initDiffViz === 'function') initDiffViz();
  if (typeof renderDiffExercise === 'function') renderDiffExercise(currentDiffEx || 0);
}
