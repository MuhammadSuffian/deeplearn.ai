// js/profile.js
function renderProfile() {
  if (!currentUser?.prog) return;
  const prog = currentUser.prog;
  const page = document.getElementById('page-profile');
  if (!page) return;

  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const levels = { beginner:'Complete beginner', intermediate:'Developer with Python', advanced:'University / Research' };

  page.innerHTML = `
    <div class="profile-pg">
      <div class="pg-t" style="margin-bottom:14px">Profile &amp; settings</div>
      <div class="profile-header">
        <div class="profile-av-lg" style="background:${currentUser.color}33;color:${currentUser.color}">${initials}</div>
        <div style="flex:1">
          <div class="profile-name">${currentUser.name}</div>
          <div class="profile-joined">${currentUser.email}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:3px">${levels[currentUser.level] || currentUser.level}</div>
        </div>
        <button class="cb pri" onclick="saveProfile()">Save changes</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
        <div class="ps-card"><div class="ps-num" style="color:var(--acc)">${prog.xp}</div><div class="ps-lbl">Total XP</div></div>
        <div class="ps-card"><div class="ps-num" style="color:var(--acc2)">${prog.streak}</div><div class="ps-lbl">Day streak</div></div>
        <div class="ps-card"><div class="ps-num" style="color:var(--acc3)">${(prog.completedModules||[]).length}</div><div class="ps-lbl">Modules done</div></div>
      </div>
      <div class="vc" style="margin-bottom:14px">
        <div class="vh"><div class="vt">Edit profile</div></div>
        <div class="vb" style="display:flex;flex-direction:column;gap:12px">
          <div><label class="form-label">Display name</label><input class="form-input" id="edit-name" type="text" value="${currentUser.name}"/></div>
          <div><label class="form-label">Bio</label><input class="form-input" id="edit-bio" type="text" placeholder="e.g. ML researcher, Python enthusiast..." value="${prog.bio||''}"/></div>
          <div><label class="form-label">Learning goal</label>
            <select class="form-input" id="edit-goal">
              ${[['career','Career transition into ML'],['research','Academic research'],['hobby','Personal project / hobby'],['upskill','Upskill at current job']].map(([v,l])=>`<option value="${v}"${(prog.goal||'career')===v?' selected':''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="vc" style="margin-bottom:14px">
        <div class="vh"><div class="vt">Preferences</div></div>
        <div class="vb">
          ${[
            ['notif','sr','Email notifications','Daily review reminders'],
            ['sr','sr','Spaced repetition','SM-2 algorithm for review scheduling'],
            ['sol','sol','Show solutions','Allow viewing full solutions in exercises'],
          ].map(([k,,lbl,sub]) => `
            <div class="setting-row">
              <div><div class="setting-lbl">${lbl}</div><div class="setting-sub">${sub}</div></div>
              <button class="toggle ${(prog.settings||{})[k]!==false?'on':'off'}" id="tog-${k}" onclick="toggleSetting('${k}',this)"></button>
            </div>`).join('')}
        </div>
      </div>
      <div class="danger-zone">
        <div style="font-size:13px;font-weight:600;color:var(--acc2);margin-bottom:8px">Danger zone</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="cb" onclick="resetProgress()" style="border-color:#ff6b9d55;color:var(--acc2)">Reset all progress</button>
          <button class="cb" onclick="doSignOut()" style="border-color:#ff6b9d55;color:var(--acc2)">Sign out</button>
        </div>
      </div>
    </div>`;
}

function saveProfile() {
  if (!currentUser) return;
  const name = document.getElementById('edit-name')?.value.trim();
  if (name) currentUser.name = name;
  currentUser.prog.bio  = document.getElementById('edit-bio')?.value || '';
  currentUser.prog.goal = document.getElementById('edit-goal')?.value || 'career';
  const accounts = DB.load('accounts', []);
  const idx = accounts.findIndex(a => a.email === currentUser.email);
  if (idx >= 0) { accounts[idx].name = currentUser.name; DB.save('accounts', accounts); }
  updateTopbar();
  saveProgress();
  renderProfile();
}

function toggleSetting(k, btn) {
  if (!currentUser?.prog) return;
  const on = btn.classList.toggle('on');
  btn.classList.toggle('off', !on);
  if (!currentUser.prog.settings) currentUser.prog.settings = {};
  currentUser.prog.settings[k] = on;
  saveProgress();
}

function resetProgress() {
  if (!currentUser) return;
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  currentUser.prog = {
    xp: 0, streak: 0, quizAvg: null, completedModules: [],
    diffExProgress: [false,false,false,false], diffExXP: 0,
    quizScores: {}, srCards: getDefaultSRCards(),
    activity: Array(7).fill(false),
    settings: { notif:true, sr:true, sol:false },
    bio: '', goal: 'career'
  };
  saveProgress();
  updateTopbar();
  renderProfile();
}
