const SAVE_KEY = 'top-down-adventure-save-v2';

export class SaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static save(data) {
    const existing = SaveManager.load() ?? {};
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...existing, ...data, savedAt: Date.now() }));
  }
}
