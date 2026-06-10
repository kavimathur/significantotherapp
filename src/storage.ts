import type { AppState } from "./types";

const STORAGE_KEY = "keeper-pwa-state-v1";
const CURRENT_SEED_VERSION = 1;
const SEED_CREATED_AT = "2026-06-10T12:00:00.000Z";
const KITCHEN_KNIFE_URL =
  "https://www.amazon.com/Sunnecko-Damascus-Kitchen-Handle-Professional-Japanese/dp/B09JBQD9S3/ref=sxin_18_pa_sp_search_thematic_sspa?content-id=amzn1.sym.9830f7a6-3831-47c8-8516-490493d4fc59%3Aamzn1.sym.9830f7a6-3831-47c8-8516-490493d4fc59&cv_ct_cx=kitchen+knife&keywords=kitchen+knife&pd_rd_i=B09JBQD9S3&pd_rd_r=7843cc3a-74b5-4ed9-8498-940ea0314d66&pd_rd_w=ob7rR&pd_rd_wg=48LLQ&pf_rd_p=9830f7a6-3831-47c8-8516-490493d4fc59&pf_rd_r=TE9YD9EVGJBBEB2DJTE1&qid=1781134103&sbo=RZvfv%2F%2FHxDF%2BO5021pAnSA%3D%3D&sr=1-1-7efdef4d-9875-47e1-927f-8c2c1c47ed49-spons&aref=EKPFivnkJr&sp_csd=d2lkZ2V0TmFtZT1zcF9zZWFyY2hfdGhlbWF0aWM&psc=1";
const LINDT_TRUFFLES_URL =
  "https://www.lindtusa.com/lindt-lindor-non-dairy-oatmilk-chocolate-candy-truffles-5p1-oz-4337l?srsltid=AfmBOooHaW-OqBOxBGkcgyUMM34NHxIKy5lu375jBLslF2TI-SfsUoLU";
const LA_TAZZA_PHOTO =
  "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHXgDzmmu4eDtc32ecrv_fVLvE1Ywb0yoJEx00uY4L4bY6vSmeX43b07ZZ1ZbC0MoTBO-5U9PVIFbh5seky7QHWkPlGgBPPFaFrev_xjZeGeH8NRdd6Juav2iJvMmbHPQaYLldP1_AVOfVa=w900-h675-k-no";
const ORNITHOLOGY_PHOTO =
  "https://lh3.googleusercontent.com/gps-cs-s/APNQkAElsyOZoeMUIf5JTazT7g5fDU9yBAn1AcjLQo0Lj_MDhmdWHgpMyJKeQzxTI-waRZ8q_7W-oI-2qPM9MuMZjVUl5zCeDMdYecYVRam-bxApN-X1WtQHJBsdPAIH9GIgUYGTdPe0GidKUY48=w900-h675-k-no";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

function emptyState(): AppState {
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

const seedPeople: AppState["people"] = [
  {
    id: "seed-person-sofia",
    name: "Sofia",
    relationship: "Friend",
    color: "#f8b4d9",
    notes: [
      {
        id: "seed-pnote-sofia",
        text: "Close friend. Good person to ask about when she talks about weekend plans.",
        createdAt: SEED_CREATED_AT,
      },
    ],
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-person-marco",
    name: "Marco",
    relationship: "Friend",
    color: "#4bd6bc",
    notes: [
      {
        id: "seed-pnote-marco",
        text: "One of the friends who makes her laugh. Remember to ask how he is doing.",
        createdAt: SEED_CREATED_AT,
      },
    ],
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-person-vivianna",
    name: "Vivianna",
    relationship: "Mom",
    color: "#ffd166",
    notes: [
      {
        id: "seed-pnote-vivianna",
        text: "Her mom. Ask warm follow-up questions when family plans come up.",
        createdAt: SEED_CREATED_AT,
      },
    ],
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-person-giuseppe",
    name: "Giuseppe",
    relationship: "Dad",
    color: "#b8a4ff",
    notes: [
      {
        id: "seed-pnote-giuseppe",
        text: "Her dad. Keep track of visits, birthdays, and anything she mentions about him.",
        createdAt: SEED_CREATED_AT,
      },
    ],
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
];

const seedIdeas: AppState["ideas"] = [
  {
    id: "seed-gift-kitchen-knife",
    type: "gift",
    title: "Kitchen Knife",
    link: KITCHEN_KNIFE_URL,
    description: "A sharp Damascus-style chef's knife for cooking nights and a practical kitchen upgrade.",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-gift-lindt-oatmilk-truffles",
    type: "gift",
    title: "Lindt Oatmilk Chocolate Truffles",
    link: LINDT_TRUFFLES_URL,
    description: "Non-dairy oatmilk chocolate truffles for a small sweet treat.",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-date-la-tazza",
    type: "date",
    title: "La Tazza D'Oro",
    link: "https://maps.app.goo.gl/KVy4HHzq2cTfJajq8",
    description: "Coffee date spot with an easy neighborhood-walk follow-up.",
    previewImage: LA_TAZZA_PHOTO,
    mapQuery: "La Tazza D'Oro NYC",
    sourceTitle: "La Tazza D'Oro NYC",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-date-ornithology",
    type: "date",
    title: "Ornithology Jazz Club",
    link: "https://maps.app.goo.gl/SsB9rbDdLVE5N3uh8",
    description: "Jazz club date for a night that feels intimate, memorable, and a little spontaneous.",
    previewImage: ORNITHOLOGY_PHOTO,
    mapQuery: "Ornithology Jazz Club",
    sourceTitle: "Ornithology Jazz Club",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
];

const seedNotes: AppState["notes"] = [
  {
    id: "seed-note-nice-date",
    title: "A nice date we had",
    body: "We had one of those easy, unhurried dates where the conversation kept going after dinner. Remember how much she liked when the night had a simple plan but still felt open-ended.",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-note-ocean-swimming",
    title: "She loves swimming in the ocean",
    body: "She really likes swimming in the ocean. Good future idea: plan a beach day, bring towels and snacks, and make it feel effortless.",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
  {
    id: "seed-note-last-birthday",
    title: "Her last birthday",
    body: "For her last birthday, she spent the day with people she loves, had a celebratory meal, and seemed happiest when the plan felt personal instead of overproduced.",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  },
];

function mergeSeeds<T extends { id: string; title?: string; name?: string; link?: string }>(
  currentItems: T[],
  seedItems: T[],
) {
  const exists = (seedItem: T) =>
    currentItems.some(
      (item) =>
        item.id === seedItem.id ||
        (seedItem.link && item.link === seedItem.link) ||
        (seedItem.title && item.title?.toLowerCase() === seedItem.title.toLowerCase()) ||
        (seedItem.name && item.name?.toLowerCase() === seedItem.name.toLowerCase()),
    );

  return [...seedItems.filter((seedItem) => !exists(seedItem)), ...currentItems];
}

function applySeedData(state: AppState): AppState {
  if ((state.settings.seedVersion ?? 0) >= CURRENT_SEED_VERSION) {
    return state;
  }

  return {
    ...state,
    people: mergeSeeds(state.people, seedPeople),
    ideas: mergeSeeds(state.ideas, seedIdeas),
    notes: mergeSeeds(state.notes, seedNotes),
    settings: {
      ...state.settings,
      seedVersion: CURRENT_SEED_VERSION,
    },
  };
}

export function defaultState(): AppState {
  return applySeedData(emptyState());
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
    const base = emptyState();

    return applySeedData({
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
    });
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
