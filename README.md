# DeepLearn.ai — Complete Deep Learning Platform

A full-featured interactive deep learning education platform built with vanilla HTML, CSS, and JavaScript. No build tools, no dependencies — just open `index.html` in a browser.

## Features

- **7 Algorithm Visualizers**: Backpropagation, Attention, Gradient Descent, CNN, Transformer, RNN/LSTM, Diffusion Models
- **Diffusion Models Coding Lab**: 4 progressive exercises implementing DDPM from scratch (β schedule, forward process, training objective, reverse sampling)
- **Quiz System**: 6 topic banks, SM-2 spaced repetition scheduler, per-question feedback
- **Leaderboard**: Global XP rankings
- **User Auth**: Sign up / sign in / demo mode — all stored in localStorage
- **Persistent Progress**: All XP, quiz scores, exercise completions survive page refresh
- **Profile & Settings**: Edit name, bio, toggle preferences, view certificates

## Quick Start

### Option 1 — Open directly (Chrome/Firefox)
- Email: [anything@example.com](https://muhammadsuffian.github.io/deeplearn.ai/)
Most browsers allow file:// access. If visualizations don't render, use Option 2.

### Option 2 — Local server (recommended)
```bash
# Python 3
cd deeplearn-ai
python3 -m http.server 8080
# Then open: http://localhost:8080

# Node.js (npx)
npx serve .
# Then open the URL shown
```

### Option 3 — VS Code Live Server
Install the "Live Server" extension, right-click `index.html` → "Open with Live Server"

## Demo Login
- Email: anything@example.com
- Password: `demo123`

This creates a demo account with pre-populated progress (340 XP, 7-day streak, Fundamentals completed).

## File Structure
```
deeplearn-ai/
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Layout, variables, shared components
│   ├── auth.css        # Auth screen & profile styles
│   ├── viz.css         # Visualizer & diffusion lab styles
│   ├── quiz.css        # Quiz & spaced repetition styles
│   └── diffex.css      # Exercise-specific styles
└── js/
    ├── db.js           # localStorage persistence wrapper
    ├── auth.js         # Authentication, session, SM-2 algorithm
    ├── app.js          # Page navigation, XP system, topbar
    ├── diffusion.js    # Shared diffusion math (noise, alpha_bar)
    ├── viz.js          # All 7 algorithm visualizers
    ├── diffex.js       # Diffusion coding exercises
    ├── quiz.js         # Quiz engine + spaced repetition UI
    ├── leaderboard.js  # Leaderboard rendering
    ├── progress.js     # Progress page
    ├── profile.js      # Profile & settings
    └── init.js         # App bootstrap
```

## Extending the Platform

**Add a new algorithm visualizer:**
1. Add a new entry to `algoMeta` in `viz.js`
2. Add a `renderXViz(container)` function
3. Add the function to the `renderers` map in `renderAlgoContent()`

**Add a new quiz bank:**
1. Add a new entry to `quizBanks` in `quiz.js`
2. Each question needs: `q` (text), `opts` (array of 4), `ans` (0-indexed), `exp` (explanation)

**Add a new exercise:**
1. Add a new object to `diffExercises` in `diffex.js`
2. Fields: `title`, `xp`, `theory` (HTML), `code`, `hints` (array), `solution`, `outputs` (array), `visTs` (timesteps to visualize)

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- No frameworks, no build tools
- Google Fonts (Space Mono + DM Sans)
- All data stored in localStorage

## Browser Support
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
