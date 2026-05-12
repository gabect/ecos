const SAVE_KEY = 'echoes-of-liora-save-v1';

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

  static rememberDiscovery(id) {
    const save = SaveManager.load() ?? {};
    const discoveries = new Set(save.discoveries ?? []);
    discoveries.add(id);
    SaveManager.save({ discoveries: [...discoveries] });
  }
}
