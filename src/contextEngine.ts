import type { AppState, PlacePreview, Recommendation } from "./types";

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

const formatList = (items: string[]) => {
  if (items.length === 0) {
    return "none yet";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
};

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(iso));

export function extractMapInfo(link: string): PlacePreview | null {
  const trimmed = link.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isMapsLink = host.includes("google.") || host === "maps.app.goo.gl" || host.includes("goo.gl");

    if (!isMapsLink) {
      return null;
    }

    const queryParam = url.searchParams.get("q") ?? url.searchParams.get("query");
    const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
    const directoryMatch = url.pathname.match(/\/maps\/dir\/(?:[^/]+\/)?([^/]+)/);
    const extracted = queryParam ?? placeMatch?.[1] ?? directoryMatch?.[1] ?? "";
    const title = decodeURIComponent(extracted.replace(/\+/g, " ")).replace(/@[-.\d,]+.*/, "").trim();
    const mapQuery = title || trimmed;

    return {
      title: title || "Saved map spot",
      mapQuery,
    };
  } catch {
    return null;
  }
}

export function buildContextDigest(state: AppState) {
  const people = state.people
    .map((person) => {
      const latestNote = person.notes.at(-1)?.text;
      return `${person.name}${person.relationship ? ` (${person.relationship})` : ""}${
        latestNote ? `: ${latestNote}` : ""
      }`;
    })
    .join("\n");

  const ideas = state.ideas
    .map((idea) => `${idea.type}: ${idea.title || "Untitled"}${idea.description ? ` - ${idea.description}` : ""}`)
    .join("\n");

  const notes = state.notes
    .map((note) => `${note.title || "Untitled note"}: ${note.body.slice(0, 240)}`)
    .join("\n");

  return clean(
    [
      `${state.girlfriendName || "She"} context`,
      people ? `People:\n${people}` : "People: none yet",
      ideas ? `Ideas:\n${ideas}` : "Ideas: none yet",
      notes ? `Notes:\n${notes}` : "Notes: none yet",
    ].join("\n\n"),
  );
}

export function buildRecommendations(state: AppState): Recommendation[] {
  const name = state.girlfriendName || "her";
  const giftIdeas = state.ideas.filter((idea) => idea.type === "gift");
  const dateIdeas = state.ideas.filter((idea) => idea.type === "date");
  const newestNote = [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const peopleWithNotes = state.people.filter((person) => person.notes.length > 0);
  const newestPerson = [...peopleWithNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const lowerContext = buildContextDigest(state).toLowerCase();
  const recommendations: Recommendation[] = [];

  if (giftIdeas.length > 0) {
    const idea = giftIdeas[0];
    recommendations.push({
      id: `gift-${idea.id}`,
      category: "gift",
      title: `Move "${idea.title}" one step closer`,
      body: `Turn this from a thought into a plan: check price, shipping time, or a better version before it goes stale.`,
      action: "Choose the next buying step",
      source: "Gift ideas",
      priority: 92,
    });
  } else {
    recommendations.push({
      id: "gift-capture",
      category: "gift",
      title: `Capture one ${name} gift clue`,
      body: `Watch for a casual want, repeated brand, hobby upgrade, or comfort item and save it before it disappears from memory.`,
      action: "Add a gift idea",
      source: "Empty gift list",
      priority: 74,
    });
  }

  if (dateIdeas.length > 0) {
    const idea = dateIdeas[0];
    recommendations.push({
      id: `date-${idea.id}`,
      category: "date",
      title: `Put "${idea.title}" on the calendar`,
      body: idea.link
        ? `You already have the place. Pick a time window and make the logistics effortless.`
        : `Add one logistical detail so this can become a real plan instead of a someday idea.`,
      action: "Set a date window",
      source: "Date ideas",
      priority: 88,
    });
  } else {
    recommendations.push({
      id: "date-new",
      category: "date",
      title: `Design a low-friction date for ${name}`,
      body: `Choose something with a clear start, a small novelty, and an easy exit if the day gets busy.`,
      action: "Add a date idea",
      source: "Empty date list",
      priority: 70,
    });
  }

  if (newestPerson) {
    recommendations.push({
      id: `people-${newestPerson.id}`,
      category: "people",
      title: `Ask about ${newestPerson.name}`,
      body: `${newestPerson.name} is in ${name}'s orbit. A specific question shows you remember the cast of her life.`,
      action: "Send one thoughtful question",
      source: "People notes",
      priority: 82,
    });
  } else {
    recommendations.push({
      id: "people-map",
      category: "people",
      title: `Map one important person in ${name}'s life`,
      body: `Add a friend, family member, coworker, or pet with one useful note you can remember later.`,
      action: "Add a person",
      source: "People list",
      priority: 66,
    });
  }

  if (newestNote) {
    recommendations.push({
      id: `care-${newestNote.id}`,
      category: "care",
      title: `Follow up on "${newestNote.title || "that note"}"`,
      body: `You wrote this on ${shortDate(newestNote.updatedAt)}. Convert one detail into a small check-in, errand, or gesture.`,
      action: "Use the latest note",
      source: "Notepad",
      priority: 80,
    });
  }

  const messageBody = lowerContext.includes("stress") || lowerContext.includes("busy") || lowerContext.includes("work")
    ? `Send: "I know today has a lot in it. I am proud of how you are handling it, and I am here if you want backup."`
    : `Send: "I was just thinking about you. I hope something small and good finds you today."`;

  recommendations.push({
    id: "message-today",
    category: "message",
    title: `A small text for ${name}`,
    body: messageBody,
    action: "Copy and send",
    source: "Context pulse",
    priority: 78,
  });

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

export function answerChat(state: AppState, prompt: string) {
  const normalized = prompt.toLowerCase();
  const name = state.girlfriendName || "her";
  const giftIdeas = state.ideas.filter((idea) => idea.type === "gift");
  const dateIdeas = state.ideas.filter((idea) => idea.type === "date");
  const recs = buildRecommendations(state);

  if (normalized.includes("gift")) {
    if (giftIdeas.length === 0) {
      return `I do not have gift ideas saved yet. The strongest next move is to capture one clue about ${name}: something she repeats, touches in a store, saves online, or complains needs replacing.`;
    }

    return `Best gift thread right now: ${formatList(giftIdeas.slice(0, 3).map((idea) => idea.title))}. I would start with "${giftIdeas[0].title}" and check timing, price, and whether it connects to a recent note.`;
  }

  if (normalized.includes("date") || normalized.includes("place") || normalized.includes("restaurant")) {
    if (dateIdeas.length === 0) {
      return `No date ideas are saved yet. Build one with a clear mood: quiet, celebratory, restorative, or novel. For ${name}, I would add a low-friction option first so you have something easy to pull off.`;
    }

    return `Date options in the bank: ${formatList(dateIdeas.slice(0, 3).map((idea) => idea.title))}. The one I would make real first is "${dateIdeas[0].title}" because saved ideas lose value when they stay vague.`;
  }

  if (normalized.includes("people") || normalized.includes("friend") || normalized.includes("family")) {
    if (state.people.length === 0) {
      return `I do not have anyone in ${name}'s circle yet. Add the people who come up repeatedly, then attach small notes like relationships, tensions, wins, and upcoming events.`;
    }

    return `${name}'s circle currently includes ${formatList(state.people.map((person) => person.name))}. The richest profile is ${
      [...state.people].sort((a, b) => b.notes.length - a.notes.length)[0].name
    }, based on saved notes.`;
  }

  if (normalized.includes("note") || normalized.includes("remember")) {
    if (state.notes.length === 0) {
      return `No notepad entries yet. Start with tiny facts that age well: what she is excited about, what is draining her, what dates matter, and what she mentioned only once.`;
    }

    const latest = [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return `Most recent note: "${latest.title || "Untitled"}." The practical follow-up is to turn one detail from it into a question or gesture this week.`;
  }

  if (normalized.includes("recommend") || normalized.includes("should i") || normalized.includes("what should")) {
    const top = recs[0];
    return `Top move: ${top.title}. ${top.body} Action: ${top.action}.`;
  }

  if (normalized.includes("context") || normalized.includes("summary")) {
    return `Context snapshot for ${name}: ${state.people.length} people, ${giftIdeas.length} gift ideas, ${dateIdeas.length} date ideas, and ${state.notes.length} notebook entries. The current highest-signal recommendation is "${recs[0].title}".`;
  }

  return `For ${name}, I would keep this specific and observable. Current best signal: ${recs[0].title}. ${recs[0].body} You can ask me for gifts, dates, people, notes, recommendations, or a context summary.`;
}
