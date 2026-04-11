// js/db.js — localStorage wrapper for all persistence
const DB = {
  save(key, val) {
    try { localStorage.setItem('dl_' + key, JSON.stringify(val)); } catch(e) {}
  },
  load(key, def = null) {
    try {
      const v = localStorage.getItem('dl_' + key);
      return v !== null ? JSON.parse(v) : def;
    } catch(e) { return def; }
  },
  del(key) {
    try { localStorage.removeItem('dl_' + key); } catch(e) {}
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('dl_'))
        .forEach(k => localStorage.removeItem(k));
    } catch(e) {}
  }
};
