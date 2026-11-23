/**
 * DEBUGX — History Manager
 * Section 11: Manages persistent debugging sessions in localStorage.
 */

class HistoryManager {
  constructor() {
    this.storageKey = 'debugx_sessions_history';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      // Seed with initial items from sampleData.js
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_HISTORY_ITEMS));
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read history:", e);
      return [];
    }
  }

  saveSession(session) {
    const list = this.getAll();
    const newSession = {
      id: 'session_' + Date.now(),
      is_sample: !!session.is_sample,
      language: session.language || 'Python',
      error_title: session.error_title || 'Untitled Error',
      error_category: session.error_category || 'Runtime Error',
      severity: session.severity || 'Medium',
      confidence: session.confidence || 0.9,
      problematic_lines: session.problematic_lines || [1],
      summary: session.summary || '',
      root_cause: session.root_cause || '',
      original_code: session.original_code || '',
      corrected_code: session.corrected_code || '',
      explanation: session.explanation || [],
      prevention_tips: session.prevention_tips || [],
      related_concepts: session.related_concepts || [],
      timestamp: this.formatDate(new Date()),
      starred: false
    };

    // Prepend to list
    list.unshift(newSession);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return newSession;
  }

  deleteSession(id) {
    const list = this.getAll().filter(item => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  toggleStar(id) {
    const list = this.getAll();
    const item = list.find(i => i.id === id);
    if (item) {
      item.starred = !item.starred;
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    }
    return item;
  }

  clearAll() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
  }

  filter({ query = '', language = 'all' }) {
    let list = this.getAll();

    if (language && language.toLowerCase() !== 'all') {
      list = list.filter(item => item.language.toLowerCase() === language.toLowerCase());
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(item =>
        item.error_title.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.original_code && item.original_code.toLowerCase().includes(q))
      );
    }

    return list;
  }

  formatDate(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(date);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${hours}:${mins}`;
  }
}

window.historyManager = new HistoryManager();
