// js/leaderboard.js
function renderLB() {
  const base = [
    {name:'Aisha K.',  av:'AK', c:'#7c6bff', xp:2840, streak:34, badge:'🏆'},
    {name:'Marcos R.', av:'MR', c:'#ff6b9d', xp:2610, streak:21, badge:'🥈'},
    {name:'Yuki T.',   av:'YT', c:'#00d4aa', xp:2490, streak:18, badge:'🥉'},
    {name:'Priya S.',  av:'PS', c:'#ffa94d', xp:1980, streak:12},
    {name:'Leo M.',    av:'LM', c:'#e040fb', xp:1740, streak:9 },
    {name:'Chen W.',   av:'CW', c:'#7c6bff', xp:1590, streak:7 },
    {name:'Sofia B.',  av:'SB', c:'#ff6b9d', xp:1430, streak:14},
    {name:'Dev P.',    av:'DP', c:'#00d4aa', xp:1280, streak:5 },
  ];
  const myXP = currentUser?.prog?.xp ?? 0;
  const myName = currentUser?.name ?? 'You';
  const myColor = currentUser?.color ?? '#7c6bff';
  const myInitials = myName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const myStreak = currentUser?.prog?.streak ?? 0;
  const all = [...base, { name: myName, av: myInitials, c: myColor, xp: myXP, streak: myStreak, isMe: true }]
    .sort((a, b) => b.xp - a.xp)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const page = document.getElementById('page-lb');
  if (!page) return;

  const myEntry = all.find(p => p.isMe);

  page.innerHTML = `
    <div class="pg">
      <div class="pg-t">Leaderboard</div>
      <div class="pg-s">Global rankings — earn XP to climb the board</div>
      ${myEntry ? `
        <div style="background:linear-gradient(135deg,#7c6bff18,#ff6b9d0f);border:1px solid #7c6bff44;border-radius:9px;padding:11px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:${myEntry.c}33;color:${myEntry.c};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--mono)">${myEntry.av}</div>
            <div><div style="font-size:13px;font-weight:600">You — rank <strong style="color:var(--acc)">#${myEntry.rank}</strong></div><div style="font-size:11px;color:var(--mut)">${myEntry.xp} XP · ${myStreak} day streak</div></div>
          </div>
          <div style="font-size:12px;color:var(--acc3);font-family:var(--mono)">${myEntry.rank <= 3 ? '🏆 Top 3!' : myEntry.rank <= 10 ? '↑ Top 10' : `Rank #${myEntry.rank}`}</div>
        </div>` : ''}
      <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden">
        ${all.map(p => `
          <div style="display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid var(--bdr);transition:background .15s;${p.isMe?'background:linear-gradient(135deg,#7c6bff0f,#ff6b9d08);border-left:3px solid var(--acc)':''}">
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;min-width:26px;color:var(--mut)">${p.rank}</div>
            <div style="width:32px;height:32px;border-radius:7px;background:${p.c}33;color:${p.c};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:var(--mono);flex-shrink:0">${p.av}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500">${p.name}${p.badge ? ' ' + p.badge : ''}${p.isMe ? ' <span style="font-size:10px;font-family:var(--mono);background:var(--acc);color:#fff;padding:1px 5px;border-radius:3px;margin-left:4px">YOU</span>' : ''}</div>
              <div style="font-size:10px;color:var(--mut);font-family:var(--mono)">${p.streak} day streak</div>
            </div>
            <div style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--acc)">${p.xp}</div>
          </div>`).join('')}
      </div>
    </div>`;
}
