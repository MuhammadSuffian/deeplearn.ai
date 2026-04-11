// js/diffusion.js — shared diffusion math used by viz + exercise visualizer
const DIFF_T = 20;
let origImg = null;

function genSmiley() {
  const img = [];
  for (let r = 0; r < 16; r++) {
    const row = [];
    for (let c = 0; c < 16; c++) {
      const dr = r - 7.5, dc = c - 7.5, d = Math.sqrt(dr*dr + dc*dc);
      let v = 20;
      if (d < 7 && d > 5.5) v = 210;
      if (r >= 4 && r <= 6 && (c === 5 || c === 10)) v = 210;
      if (r >= 9 && r <= 11 && c >= 5 && c <= 10 && r - 5 >= Math.abs(c - 7.5)) v = 210;
      row.push(v);
    }
    img.push(row);
  }
  return img;
}

function getAlphaBar(t, schedule = 'cosine') {
  let ab = 1;
  for (let i = 0; i <= t; i++) {
    let beta;
    if (schedule === 'linear') {
      beta = 0.0001 + (0.02 - 0.0001) * i / (DIFF_T - 1);
    } else {
      const s = 0.008;
      const f = x => Math.cos(((x / DIFF_T) + s) / (1 + s) * Math.PI / 2) ** 2;
      beta = Math.min(1 - f(i + 1) / f(i), 0.999);
    }
    ab *= (1 - beta);
  }
  return ab;
}

function noisyAt(orig, t) {
  const ab = getAlphaBar(t);
  const sq = Math.sqrt(ab), sq2 = Math.sqrt(1 - ab);
  return orig.map(row => row.map(v => {
    const u1 = Math.random() + 1e-10, u2 = Math.random();
    const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(255, sq * v + sq2 * 128 * n));
  }));
}

function drawCanvas(canvasId, img) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  const rows = img.length, cols = img[0].length;
  const cw = c.width / cols, ch = c.height / rows;
  img.forEach((row, r) => row.forEach((v, col) => {
    ctx.fillStyle = `rgb(${Math.round(v)},${Math.round(v)},${Math.round(v)})`;
    ctx.fillRect(col * cw, r * ch, cw, ch);
  }));
}

function drawImgOnCanvas(canvas, img) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rows = img.length, cols = img[0].length;
  const cw = canvas.width / cols, ch = canvas.height / rows;
  img.forEach((row, r) => row.forEach((v, col) => {
    ctx.fillStyle = `rgb(${Math.round(v)},${Math.round(v)},${Math.round(v)})`;
    ctx.fillRect(col * cw, r * ch, cw, ch);
  }));
}

function getOrCreateOrigImg() {
  if (!origImg) origImg = genSmiley();
  return origImg;
}
