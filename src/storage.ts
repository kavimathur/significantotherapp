import type { AppState } from "./types";

const STORAGE_KEY = "keeper-pwa-state-v1";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function defaultState(): AppState {
  return {
    girlfriendName: "",
    people: [],
    ideas: [],
    notes: [],
    messages: [],
    settings: {
      notificationsEnabled: false,
    },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();

    return {
      ...base,
      ...parsed,
      people: Array.isArray(parsed.people) ? parsed.people : base.people,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : base.ideas,
      notes: Array.isArray(parsed.notes) ? parsed.notes : base.notes,
      messages: Array.isArray(parsed.messages) ? parsed.messages : base.messages,
      settings: {
        ...base.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
