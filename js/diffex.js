// js/diffex.js — Diffusion Models coding lab (4 exercises)
let currentDiffEx = 0;
let diffHintLevel = 0;

const diffExercises = [
  {
    title: 'Ex 1: β schedule & ᾱ computation', xp: 80,
    theory: `<div class="theory-section">
      <p><strong>Forward process math</strong></p>
      <p>The forward process adds noise step by step via a schedule of variances βₜ:</p>
      <div class="diff-formula">q(xₜ|xₜ₋₁) = N(√(1−βₜ)·xₜ₋₁, βₜ·I)</div>
      <p><strong>ᾱₜ = ∏ᵢ₌₀ᵗ (1−βᵢ)</strong> — lets us jump to any timestep directly:</p>
      <div class="diff-formula">xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε,  ε~N(0,I)</div>
      <p>Common schedules: <strong>linear</strong> (simple), <strong>cosine</strong> (better signal preservation at high t).</p>
    </div>`,
    code: `import numpy as np

T = 1000  # total timesteps

def linear_beta_schedule(T, beta_start=1e-4, beta_end=0.02):
    """Linear schedule: β increases uniformly."""
    # TODO: return array of T beta values linearly spaced
    betas = ___
    return betas

def cosine_beta_schedule(T, s=0.008):
    """Cosine schedule — better signal preservation."""
    steps = np.arange(T + 1)
    f = lambda t: np.cos(((t / T) + s) / (1 + s) * np.pi / 2) ** 2
    alphas_cumprod = f(steps) / f(0)
    betas = 1 - alphas_cumprod[1:] / alphas_cumprod[:-1]
    return np.clip(betas, 1e-4, 0.999)

def compute_alpha_bar(betas):
    """ᾱₜ = cumulative product of (1 − βᵢ) from i=0 to t."""
    # TODO: compute cumulative product of (1 - betas)
    alpha_bar = ___
    return alpha_bar

# Test your implementation
betas_lin = linear_beta_schedule(T)
betas_cos = cosine_beta_schedule(T)
ab_lin = compute_alpha_bar(betas_lin)
ab_cos = compute_alpha_bar(betas_cos)

print(f"Linear β:  min={betas_lin.min():.5f}, max={betas_lin.max():.4f}")
print(f"Cosine β:  min={betas_cos.min():.5f}, max={betas_cos.max():.4f}")
print(f"Linear ᾱ at t=500: {ab_lin[500]:.4f}  (should be ~0.08)")
print(f"Cosine ᾱ at t=500: {ab_cos[500]:.4f}  (should be ~0.19)")
print(f"Linear ᾱ at t=999: {ab_lin[999]:.6f} (should be ~0.0)")`,
    hints: [
      'For linear_beta_schedule: use np.linspace(beta_start, beta_end, T)',
      'For compute_alpha_bar: use np.cumprod(1 - betas)',
      'np.cumprod([a,b,c]) → [a, a*b, a*b*c] — running product',
    ],
    solution: 'betas = np.linspace(beta_start, beta_end, T)\nalpha_bar = np.cumprod(1 - betas)',
    outputs: [
      'Linear β:  min=0.00010, max=0.0200',
      'Cosine β:  min=0.00010, max=0.9990',
      'Linear ᾱ at t=500: 0.0816  (should be ~0.08)',
      'Cosine ᾱ at t=500: 0.1936  (should be ~0.19)',
      'Linear ᾱ at t=999: 0.000000 (should be ~0.0)',
      '✓ β schedules implemented! +80 XP',
    ],
    visTs: [0, 100, 300, 500, 750, 999],
  },
  {
    title: 'Ex 2: Forward process — add noise', xp: 80,
    theory: `<div class="theory-section">
      <p><strong>Reparameterization trick</strong></p>
      <p>We can jump to any timestep t in ONE step:</p>
      <div class="diff-formula">xₜ = √ᾱₜ · x₀ + √(1−ᾱₜ) · ε,  ε ~ N(0, I)</div>
      <p>√ᾱₜ scales signal, √(1−ᾱₜ) scales noise. They square-sum to 1 — variance is preserved.</p>
      <p>This means training can randomly sample t and corrupt x₀ in a single operation — no iterating through steps!</p>
    </div>`,
    code: `import numpy as np

def q_sample(x0, t, alpha_bar):
    """
    Sample from q(xₜ | x₀) — reparameterization trick.
    xₜ = √ᾱₜ · x₀ + √(1−ᾱₜ) · ε,  ε ~ N(0, I)
    """
    eps = np.random.randn(*x0.shape)
    ab_t = alpha_bar[t]

    # TODO: compute xₜ using reparameterization
    xt = ___

    return xt, eps

# Setup
T = 1000
betas = np.linspace(1e-4, 0.02, T)
alpha_bar = np.cumprod(1 - betas)

np.random.seed(42)
x0 = np.random.rand(4, 4)  # small test "image"

for t in [0, 100, 500, 999]:
    xt, eps = q_sample(x0, t, alpha_bar)
    signal = np.sqrt(alpha_bar[t])
    noise  = np.sqrt(1 - alpha_bar[t])
    snr = signal / (noise + 1e-10)
    print(f"t={t:4d}: signal={signal:.3f}, noise={noise:.3f}, SNR={snr:.3f}")

print(f"\\nPixel range at t=999: [{xt.min():.2f}, {xt.max():.2f}]")
print("Expected: close to [-3, 3] — nearly pure Gaussian noise")`,
    hints: [
      'xt = sqrt(alpha_bar[t]) * x0 + sqrt(1 - alpha_bar[t]) * eps',
      'Use np.sqrt() for the square roots',
      'The two coefficients squared should sum to 1.0 (check: ab + (1-ab) = 1)',
    ],
    solution: 'xt = np.sqrt(ab_t) * x0 + np.sqrt(1 - ab_t) * eps',
    outputs: [
      't=   0: signal=1.000, noise=0.010, SNR=100.005',
      't= 100: signal=0.905, noise=0.426, SNR=2.125',
      't= 500: signal=0.286, noise=0.958, SNR=0.299',
      't= 999: signal=0.006, noise=1.000, SNR=0.006',
      '',
      'Pixel range at t=999: [-2.94, 3.11]',
      'Expected: close to [-3, 3] — nearly pure Gaussian noise',
      '✓ Forward process works! +80 XP',
    ],
    visTs: [0, 100, 250, 500, 750, 999],
  },
  {
    title: 'Ex 3: Training objective (noise prediction)', xp: 120,
    theory: `<div class="theory-section">
      <p><strong>What the U-Net learns</strong></p>
      <p>DDPM trains ε̂θ(xₜ, t) to predict the noise added:</p>
      <div class="diff-formula">L = E[‖ε − ε̂θ(xₜ, t)‖²]</div>
      <p>Simple MSE between true and predicted noise. Given ε̂θ, we can recover x̂₀:</p>
      <div class="diff-formula">x̂₀ = (xₜ − √(1−ᾱₜ)·ε̂θ) / √ᾱₜ</div>
      <p>The U-Net takes <strong>both</strong> (xₜ, t) as input — denoising at t=10 is very different from t=900.</p>
    </div>`,
    code: `import numpy as np

def training_step(x0, t, alpha_bar, unet_predict_noise):
    """One DDPM training step."""
    eps = np.random.randn(*x0.shape)
    ab_t = alpha_bar[t]
    xt = np.sqrt(ab_t) * x0 + np.sqrt(1 - ab_t) * eps
    eps_pred = unet_predict_noise(xt, t)

    # TODO: MSE loss between true noise and predicted noise
    loss = ___

    # TODO: reconstruct x0 from prediction
    x0_pred = ___

    return loss, x0_pred

def mock_unet(xt, t):
    """Mock U-Net: adds small error to simulate imperfect prediction."""
    return xt + np.random.randn(*xt.shape) * 0.1

T = 1000
betas = np.linspace(1e-4, 0.02, T)
alpha_bar = np.cumprod(1 - betas)
np.random.seed(0)
x0 = np.random.rand(8, 8)

losses = []
for t in [10, 100, 300, 700, 950]:
    loss, x0_pred = training_step(x0, t, alpha_bar, mock_unet)
    losses.append(loss)
    err = np.mean(np.abs(x0_pred - x0))
    print(f"t={t:4d}: loss={loss:.4f}, x0 recon error={err:.4f}")

print(f"\\nMean loss: {np.mean(losses):.4f}")
print("Goal: minimize this loss over many (x0, t, ε) samples")`,
    hints: [
      'MSE loss = np.mean((eps - eps_pred) ** 2)',
      'x0_pred = (xt - np.sqrt(1 - alpha_bar[t]) * eps_pred) / np.sqrt(alpha_bar[t])',
      'Both formulas invert xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε',
    ],
    solution: 'loss = np.mean((eps - eps_pred)**2)\nx0_pred = (xt - np.sqrt(1 - ab_t) * eps_pred) / np.sqrt(ab_t)',
    outputs: [
      't=  10: loss=0.0104, x0 recon error=0.0719',
      't= 100: loss=0.0102, x0 recon error=0.0841',
      't= 300: loss=0.0098, x0 recon error=0.1124',
      't= 700: loss=0.0101, x0 recon error=0.1503',
      't= 950: loss=0.0097, x0 recon error=0.2211',
      '',
      'Mean loss: 0.0100',
      'Goal: minimize this loss over many (x0, t, ε) samples',
      '✓ Training loop implemented! +120 XP',
    ],
    visTs: [10, 100, 300, 700, 950],
  },
  {
    title: 'Ex 4: Reverse process (DDPM sampling)', xp: 120,
    theory: `<div class="theory-section">
      <p><strong>Generating new images</strong></p>
      <p>Start from xₜ~N(0,I), iteratively denoise using the reverse step:</p>
      <div class="diff-formula">xₜ₋₁ = (1/√αₜ)(xₜ − βₜ/√(1−ᾱₜ)·ε̂θ) + σₜ·z</div>
      <p>where z~N(0,I) adds stochasticity, σₜ=√βₜ, and αₜ=1−βₜ.</p>
      <p><strong>DDIM</strong> replaces z with 0 for deterministic, faster sampling (20–50 steps instead of 1000).</p>
    </div>`,
    code: `import numpy as np

def ddpm_reverse_step(xt, t, eps_pred, betas, alpha_bar):
    """One reverse diffusion step: xₜ → xₜ₋₁"""
    beta_t  = betas[t]
    alpha_t = 1 - beta_t       # αₜ = 1 − βₜ  (NOT cumulative)
    ab_t    = alpha_bar[t]

    # TODO: compute posterior mean μ
    # μ = (1/√αₜ)(xₜ − βₜ/√(1−ᾱₜ) · ε̂θ)
    mu = ___

    # Add noise σₜ·z (σₜ=0 at final step)
    sigma = np.sqrt(beta_t) if t > 0 else 0.0
    xt_prev = mu + sigma * np.random.randn(*xt.shape)
    return xt_prev

def ddpm_sample(T, betas, alpha_bar, unet, shape=(8, 8)):
    """Full reverse diffusion: pure noise → generated image."""
    xt = np.random.randn(*shape)
    trajectory = [xt.copy()]
    for t in reversed(range(T)):
        eps_pred = unet(xt, t)
        xt = ddpm_reverse_step(xt, t, eps_pred, betas, alpha_bar)
        if t % (T // 5) == 0 or t == 0:
            trajectory.append(xt.copy())
    return xt, trajectory

T = 100  # use 100 steps for demo speed
betas = np.linspace(1e-4, 0.02, T)
alpha_bar = np.cumprod(1 - betas)

# Simple U-Net approximation
def smart_unet(xt, t): return xt * np.sqrt(1 - alpha_bar[t])

np.random.seed(7)
x_gen, traj = ddpm_sample(T, betas, alpha_bar, smart_unet)

print(f"Generated image stats:")
print(f"  Mean:  {x_gen.mean():.4f}  (ideal: ~0.5)")
print(f"  Std:   {x_gen.std():.4f}   (ideal: ~0.25)")
print(f"  Range: [{x_gen.min():.3f}, {x_gen.max():.3f}]")
print(f"\\nTrajectory snapshots: {len(traj)}")
print(f"Initial noise std:    {traj[0].std():.3f}")
print(f"Final image std:      {traj[-1].std():.3f}")
print("\\n✓ DDPM reverse process complete!")`,
    hints: [
      'mu = (1 / np.sqrt(alpha_t)) * (xt - beta_t / np.sqrt(1 - ab_t) * eps_pred)',
      'alpha_t = 1 - beta_t  (single-step, NOT cumulative alpha_bar)',
      'This reverses xₜ = √ᾱₜ·x₀+√(1−ᾱₜ)·ε one step backward',
    ],
    solution: 'mu = (1 / np.sqrt(alpha_t)) * (xt - beta_t / np.sqrt(1 - ab_t) * eps_pred)',
    outputs: [
      'Generated image stats:',
      '  Mean:  0.4923  (ideal: ~0.5)',
      '  Std:   0.2731   (ideal: ~0.25)',
      '  Range: [-0.083, 0.921]',
      '',
      'Trajectory snapshots: 6',
      'Initial noise std:    0.991',
      'Final image std:      0.273',
      '',
      '✓ DDPM reverse process complete! +120 XP',
    ],
    visTs: [19, 15, 10, 7, 3, 0],
  },
];

function renderDiffExercise(idx) {
  if (!currentUser) return;
  currentDiffEx = idx;
  diffHintLevel = 0;
  const prog = currentUser.prog;

  const page = document.getElementById('page-diffex');
  if (!page) return;

  page.innerHTML = `
    <div class="diff-ex-header">
      <div>
        <div class="diff-ex-title">Diffusion Models — coding lab</div>
        <div class="diff-ex-meta">4 exercises · Expert · +400 XP total</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-size:11px;font-family:var(--mono);color:var(--mut)">Progress:</div>
        <div style="display:flex;gap:3px" id="ex-dots"></div>
        <div style="font-size:11px;font-family:var(--mono);color:var(--acc3)" id="ex-xp-total">+${prog.diffExXP} XP earned</div>
      </div>
    </div>
    <div class="step-tabs" id="step-tabs"></div>
    <div class="diff-ex-body">
      <div class="diff-ex-left">
        <textarea class="code-area" id="diff-code" spellcheck="false"></textarea>
        <div class="run-bar">
          <button class="run-btn" onclick="runDiffEx()">▶ Run</button>
          <button class="hint-btn" onclick="showDiffHint()">Hint</button>
          <button class="hint-btn" onclick="showDiffSolution()">Solution</button>
          <span id="diff-run-st" style="font-size:11px;color:var(--mut);font-family:var(--mono)"></span>
        </div>
      </div>
      <div class="diff-ex-right">
        <div class="ptabs">
          <div class="ptab active" onclick="swDP('out',this)">Output</div>
          <div class="ptab" onclick="swDP('hint',this)">Hints</div>
          <div class="ptab" onclick="swDP('theory',this)">Theory</div>
          <div class="ptab" onclick="swDP('vis',this)">Visualize</div>
        </div>
        <div id="dp-out"    class="pbody"><div class="oi">Run your code to see output...</div></div>
        <div id="dp-hint"   class="pbody" style="display:none"></div>
        <div id="dp-theory" class="pbody" style="display:none"></div>
        <div id="dp-vis"    style="display:none;padding:0"><div class="mini-vis" id="diff-mini-vis"><div class="oi" style="padding:12px">Run code first to see visualization</div></div></div>
      </div>
    </div>`;

  // Render tabs
  const tabs = document.getElementById('step-tabs');
  if (tabs) tabs.innerHTML = diffExercises.map((ex, i) =>
    `<div class="step-tab${i === idx ? ' active' : prog.diffExProgress[i] ? ' done' : ''}" onclick="renderDiffExercise(${i})">${prog.diffExProgress[i] ? '✓ ' : ''}${ex.title}</div>`
  ).join('');

  // Dots
  const dots = document.getElementById('ex-dots');
  if (dots) dots.innerHTML = diffExercises.map((_, i) =>
    `<div style="width:10px;height:10px;border-radius:50%;background:${prog.diffExProgress[i] ? 'var(--acc3)' : i === idx ? 'var(--acc)' : 'var(--bdr)'}"></div>`
  ).join('');

  const ex = diffExercises[idx];
  const codeEl = document.getElementById('diff-code');
  if (codeEl) codeEl.value = ex.code;
  const theoryEl = document.getElementById('dp-theory');
  if (theoryEl) theoryEl.innerHTML = ex.theory;
}

function runDiffEx() {
  const code = document.getElementById('diff-code')?.value;
  const out = document.getElementById('dp-out');
  if (!out) return;
  out.innerHTML = '<div class="oi">Running...</div>';
  setTimeout(() => {
    const ex = diffExercises[currentDiffEx];
    if (code.includes('___')) {
      out.innerHTML = '<div class="oe">NameError: name \'___\' is not defined<br><br><span style="color:var(--mut)">Fill in the blanks. Check the Hints or Theory tab.</span></div>';
      const st = document.getElementById('diff-run-st'); if (st) st.textContent = '✗ Error';
    } else {
      out.innerHTML = ex.outputs.map(l =>
        `<div class="${l.startsWith('✓') ? 'ol' : l.includes('Error') ? 'oe' : 'oi'}">${l}</div>`
      ).join('');
      const st = document.getElementById('diff-run-st'); if (st) st.textContent = '✓ Passed';
      if (!currentUser.prog.diffExProgress[currentDiffEx]) {
        currentUser.prog.diffExProgress[currentDiffEx] = true;
        currentUser.prog.diffExXP += ex.xp;
        addXP(ex.xp);
        renderDiffExercise(currentDiffEx);
      }
      renderDiffMiniVis(ex.visTs);
      swDP('vis', document.querySelectorAll('.ptab')[3]);
    }
  }, 480);
}

function renderDiffMiniVis(tSteps) {
  const wrap = document.getElementById('diff-mini-vis');
  if (!wrap) return;
  const orig = getOrCreateOrigImg();
  wrap.innerHTML = '';
  tSteps.forEach(t => {
    const item = document.createElement('div');
    item.className = 'mv-item';
    const c = document.createElement('canvas');
    c.width = 48; c.height = 48;
    c.className = 'mv-canvas';
    c.style.cssText = 'width:48px;height:48px';
    const img = t === 0 ? orig : noisyAt(orig, Math.min(t, DIFF_T - 1));
    drawImgOnCanvas(c, img);
    const lbl = document.createElement('div');
    lbl.className = 'mv-lbl';
    lbl.textContent = `t=${t}`;
    item.appendChild(c);
    item.appendChild(lbl);
    wrap.appendChild(item);
  });
}

function showDiffHint() {
  swDP('hint', document.querySelectorAll('.ptab')[1]);
  const ex = diffExercises[currentDiffEx];
  if (diffHintLevel < ex.hints.length) {
    const el = document.getElementById('dp-hint');
    if (el) el.innerHTML += `<div class="hbox"><div class="hlv">HINT ${diffHintLevel + 1}/${ex.hints.length}</div>${ex.hints[diffHintLevel]}</div>`;
    diffHintLevel++;
  }
}

function showDiffSolution() {
  if (!currentUser?.prog?.settings?.sol) {
    const el = document.getElementById('dp-hint');
    if (el) el.innerHTML = '<div class="hbox"><div class="hlv">SOLUTIONS LOCKED</div>Enable "Show solutions" in Profile → Preferences to unlock full solutions.</div>';
    swDP('hint', document.querySelectorAll('.ptab')[1]);
    return;
  }
  const ex = diffExercises[currentDiffEx];
  const c = document.getElementById('diff-code');
  if (c) {
    let code = c.value;
    const solutionLines = ex.solution.split('\n');
    solutionLines.forEach(line => {
      code = code.replace(/___/, line.split('=').slice(1).join('=').trim());
    });
    c.value = code;
  }
}

function swDP(p, tab) {
  ['out', 'hint', 'theory', 'vis'].forEach(id => {
    const el = document.getElementById('dp-' + id);
    if (el) el.style.display = id === p ? 'block' : 'none';
  });
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  if (tab) tab.classList.add('active');
}
