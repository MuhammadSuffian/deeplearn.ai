// js/init.js — app bootstrap, called after all modules load

function initApp() {
  updateTopbar();
  // Render the default visualizer page
  renderVizPage();
  // Ensure diffusion images are ready
  getOrCreateOrigImg();
}

// Expose renderVizPage so showPage() can call it
window.renderVizPage = renderVizPage;
