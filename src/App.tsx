import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Gift,
  Heart,
  Lightbulb,
  Link as LinkIcon,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Notebook,
  Pencil,
  Plus,
  Send,
  Share,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { answerChat, buildContextDigest, buildRecommendations, extractMapInfo } from "./contextEngine";
import { loadState, nowIso, saveState, uid } from "./storage";
import type { AppState, ChatMessage, Idea, IdeaType, Page, Person, PlacePreview, Recommendation } from "./types";

const PEOPLE_COLORS = ["#ff7a66", "#ffd166", "#4bd6bc", "#9fd356", "#f8b4d9", "#b8a4ff", "#f4f1de"];

const NAV_ITEMS: Array<{ id: Page; label: string; Icon: typeof MessageCircle }> = [
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "people", label: "People", Icon: Users },
  { id: "ideas", label: "Ideas", Icon: Lightbulb },
  { id: "recommendations", label: "Recs", Icon: Sparkles },
  { id: "notepad", label: "Notes", Icon: Notebook },
];

type ModalState =
  | { kind: "person"; personId?: string }
  | { kind: "idea"; ideaId?: string; ideaType: IdeaType }
  | null;

type Toast = {
  id: string;
  text: string;
};

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activePage, setActivePage] = useState<Page>("chat");
  const [ideaTab, setIdeaTab] = useState<IdeaType>("gift");
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const showInstallCoachmark = useIosInstallCoachmark();

  const recommendations = useMemo(() => buildRecommendations(state), [state]);
  const contextDigest = useMemo(() => buildContextDigest(state), [state]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!selectedPersonId && state.people.length > 0) {
      setSelectedPersonId(state.people[0].id);
    }
  }, [selectedPersonId, state.people]);

  useEffect(() => {
    if (!selectedNoteId && state.notes.length > 0) {
      setSelectedNoteId(state.notes[0].id);
    }
  }, [selectedNoteId, state.notes]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!state.settings.notificationsEnabled || !state.settings.lastNotificationAt || recommendations.length === 0) {
      return;
    }

    const last = new Date(state.settings.lastNotificationAt).getTime();
    if (Number.isNaN(last) || Date.now() - last < 1000 * 60 * 60 * 20) {
      return;
    }

    const timer = window.setTimeout(() => {
      void showRecommendationNotification(recommendations[0], false);
    }, 2500);

    return () => window.clearTimeout(timer);
    // The notification helper writes lastNotificationAt, which is the only state field this effect needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.notificationsEnabled, state.settings.lastNotificationAt, recommendations]);

  function showToast(text: string) {
    setToast({ id: uid("toast"), text });
  }

  function completeOnboarding(girlfriendName: string) {
    const cleanName = girlfriendName.trim();
    const greeting: ChatMessage = {
      id: uid("msg"),
      role: "assistant",
      content: `I am ready. Add the people, ideas, and details that matter to ${cleanName}; I will use them as context when you ask for help.`,
      createdAt: nowIso(),
    };

    setState((current) => ({
      ...current,
      girlfriendName: cleanName,
      messages: current.messages.length > 0 ? current.messages : [greeting],
    }));
  }

  function handleCreateClick() {
    if (activePage === "people") {
      setModal({ kind: "person" });
    }

    if (activePage === "ideas") {
      setModal({ kind: "idea", ideaType: ideaTab });
    }

    if (activePage === "notepad") {
      createNote();
    }
  }

  function savePerson(person: Omit<Person, "id" | "createdAt" | "updatedAt" | "notes"> & { id?: string }) {
    setState((current) => {
      const timestamp = nowIso();
      if (person.id) {
        return {
          ...current,
          people: current.people.map((item) =>
            item.id === person.id
              ? {
                  ...item,
                  name: person.name,
                  relationship: person.relationship,
                  color: person.color,
                  updatedAt: timestamp,
                }
              : item,
          ),
        };
      }

      const created: Person = {
        id: uid("person"),
        name: person.name,
        relationship: person.relationship,
        color: person.color,
        notes: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      setSelectedPersonId(created.id);
      return {
        ...current,
        people: [created, ...current.people],
      };
    });
    setModal(null);
  }

  function deletePerson(personId: string) {
    setState((current) => ({
      ...current,
      people: current.people.filter((person) => person.id !== personId),
    }));
    setSelectedPersonId((current) => (current === personId ? null : current));
  }

  function addPersonNote(personId: string, text: string) {
    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    setState((current) => ({
      ...current,
      people: current.people.map((person) =>
        person.id === personId
          ? {
              ...person,
              notes: [{ id: uid("pnote"), text: cleanText, createdAt: nowIso() }, ...person.notes],
              updatedAt: nowIso(),
            }
          : person,
      ),
    }));
  }

  function saveIdea(values: Omit<Idea, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
    setState((current) => {
      const timestamp = nowIso();
      if (values.id) {
        return {
          ...current,
          ideas: current.ideas.map((idea) =>
            idea.id === values.id
              ? {
                  ...idea,
                  ...values,
                  updatedAt: timestamp,
                }
              : idea,
          ),
        };
      }

      const created: Idea = {
        id: uid("idea"),
        type: values.type,
        title: values.title,
        link: values.link,
        description: values.description,
        previewImage: values.previewImage,
        mapQuery: values.mapQuery,
        sourceTitle: values.sourceTitle,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        ideas: [created, ...current.ideas],
      };
    });
    setModal(null);
  }

  function deleteIdea(ideaId: string) {
    setState((current) => ({
      ...current,
      ideas: current.ideas.filter((idea) => idea.id !== ideaId),
    }));
  }

  function createNote() {
    const timestamp = nowIso();
    const note = {
      id: uid("note"),
      title: "Untitled",
      body: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setState((current) => ({
      ...current,
      notes: [note, ...current.notes],
    }));
    setSelectedNoteId(note.id);
  }

  function updateNote(noteId: string, updates: { title?: string; body?: string }) {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...updates,
              updatedAt: nowIso(),
            }
          : note,
      ),
    }));
  }

  function deleteNote(noteId: string) {
    setState((current) => {
      const nextNotes = current.notes.filter((note) => note.id !== noteId);
      setSelectedNoteId(nextNotes[0]?.id ?? null);
      return {
        ...current,
        notes: nextNotes,
      };
    });
  }

  function sendChatMessage(content: string) {
    const cleanContent = content.trim();
    if (!cleanContent) {
      return;
    }

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: cleanContent,
      createdAt: nowIso(),
    };

    setState((current) => {
      const withUser = {
        ...current,
        messages: [...current.messages, userMessage],
      };
      const assistantMessage: ChatMessage = {
        id: uid("msg"),
        role: "assistant",
        content: answerChat(withUser, cleanContent),
        createdAt: nowIso(),
      };

      return {
        ...withUser,
        messages: [...withUser.messages, assistantMessage],
      };
    });
  }

  async function copyRecommendation(rec: Recommendation) {
    await navigator.clipboard?.writeText(rec.body.replace(/^Send: /, ""));
    showToast("Copied");
  }

  async function showRecommendationNotification(rec: Recommendation, askPermission = true) {
    if (!("Notification" in window)) {
      showToast("Notifications are not available here");
      return;
    }

    const permission = Notification.permission === "granted" ? "granted" : askPermission ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") {
      showToast("Notifications are off");
      return;
    }

    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready.catch(() => undefined) : undefined;
    const options: NotificationOptions = {
      body: rec.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "keeper-recommendation",
    };

    if (registration?.showNotification) {
      await registration.showNotification(rec.title, options);
    } else {
      new Notification(rec.title, options);
    }

    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        notificationsEnabled: true,
        lastNotificationAt: nowIso(),
      },
    }));
  }

  if (!state.girlfriendName) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const activeTitle = NAV_ITEMS.find((item) => item.id === activePage)?.label ?? "Keeper";
  const showCreate = activePage === "people" || activePage === "ideas" || activePage === "notepad";

  return (
    <div className="app-background">
      <div className="app-frame">
        <aside className="desktop-rail" aria-label="Primary navigation">
          <div className="brand-mark">
            <Heart size={22} />
          </div>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              className={`rail-button ${activePage === id ? "is-active" : ""}`}
              key={id}
              type="button"
              onClick={() => setActivePage(id)}
              aria-label={label}
            >
              <Icon size={21} />
            </button>
          ))}
        </aside>

        <main className="app-main">
          <header className="topbar">
            <div>
              <p className="eyebrow">Keeper for {state.girlfriendName}</p>
              <h1>{activeTitle}</h1>
            </div>
            {showCreate ? (
              <button className="icon-button add-button" type="button" onClick={handleCreateClick} aria-label="Create new">
                <Plus size={23} />
              </button>
            ) : (
              <div className="context-pill">
                <Sparkles size={16} />
                <span>{state.people.length + state.ideas.length + state.notes.length} signals</span>
              </div>
            )}
          </header>

          <section className="screen-panel">
            {activePage === "chat" ? <ChatScreen messages={state.messages} onSend={sendChatMessage} contextDigest={contextDigest} /> : null}
            {activePage === "people" ? (
              <PeopleScreen
                people={state.people}
                selectedPersonId={selectedPersonId}
                onSelect={setSelectedPersonId}
                onEdit={(personId) => setModal({ kind: "person", personId })}
                onDelete={deletePerson}
                onAddNote={addPersonNote}
                onCreate={() => setModal({ kind: "person" })}
              />
            ) : null}
            {activePage === "ideas" ? (
              <IdeasScreen
                ideas={state.ideas}
                activeTab={ideaTab}
                onTabChange={setIdeaTab}
                onCreate={(type) => setModal({ kind: "idea", ideaType: type })}
                onEdit={(ideaId, ideaType) => setModal({ kind: "idea", ideaId, ideaType })}
                onDelete={deleteIdea}
              />
            ) : null}
            {activePage === "recommendations" ? (
              <RecommendationsScreen
                recommendations={recommendations}
                notificationsEnabled={state.settings.notificationsEnabled}
                onCopy={copyRecommendation}
                onNotify={(rec) => showRecommendationNotification(rec)}
                onCreateIdea={(type) => {
                  setIdeaTab(type);
                  setActivePage("ideas");
                  setModal({ kind: "idea", ideaType: type });
                }}
              />
            ) : null}
            {activePage === "notepad" ? (
              <NotepadScreen
                notes={state.notes}
                selectedNoteId={selectedNoteId}
                onSelect={setSelectedNoteId}
                onCreate={createNote}
                onUpdate={updateNote}
                onDelete={deleteNote}
              />
            ) : null}
          </section>
        </main>

        <BottomNav activePage={activePage} onChange={setActivePage} />
      </div>

      {showInstallCoachmark ? <IosInstallCoachmark onDismiss={() => dismissIosInstallCoachmark()} /> : null}

      {modal?.kind === "person" ? (
        <PersonForm
          person={modal.personId ? state.people.find((person) => person.id === modal.personId) : undefined}
          onCancel={() => setModal(null)}
          onSave={savePerson}
        />
      ) : null}

      {modal?.kind === "idea" ? (
        <IdeaForm
          idea={modal.ideaId ? state.ideas.find((idea) => idea.id === modal.ideaId) : undefined}
          ideaType={modal.ideaType}
          onCancel={() => setModal(null)}
          onSave={saveIdea}
        />
      ) : null}

      {toast ? <div className="toast">{toast.text}</div> : null}
    </div>
  );
}

function isStandaloneDisplay() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function useIosInstallCoachmark() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("keeper-ios-install-dismissed") === "true";
    setShouldShow(isIosDevice() && !isStandaloneDisplay() && !dismissed);

    const media = window.matchMedia("(display-mode: standalone)");
    const update = () => setShouldShow(isIosDevice() && !isStandaloneDisplay() && !dismissed);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return shouldShow;
}

function dismissIosInstallCoachmark() {
  window.localStorage.setItem("keeper-ios-install-dismissed", "true");
  window.dispatchEvent(new Event("keeper-dismiss-install"));
}

function IosInstallCoachmark({ onDismiss }: { onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = () => setIsVisible(false);
    window.addEventListener("keeper-dismiss-install", handler);
    return () => window.removeEventListener("keeper-dismiss-install", handler);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="install-coachmark" aria-label="Install Keeper">
      <div className="install-icon">
        <Share size={19} />
      </div>
      <div>
        <strong>Install Keeper</strong>
        <p>Tap Share, choose Add to Home Screen, then open Keeper from the new icon for full-screen mode.</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss install tip">
        <X size={18} />
      </button>
    </aside>
  );
}

function Onboarding({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="brand-lockup">
          <span className="brand-mark large">
            <Heart size={30} />
          </span>
          <span>Keeper</span>
        </div>
        <h1>Build a private memory system for loving better.</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) {
              onComplete(name);
            }
          }}
        >
          <label htmlFor="girlfriend-name">Her name</label>
          <div className="onboarding-input">
            <input
              id="girlfriend-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Avery"
              autoComplete="given-name"
              autoFocus
            />
            <button type="submit" aria-label="Continue" disabled={!name.trim()}>
              <ChevronRight size={22} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BottomNav({ activePage, onChange }: { activePage: Page; onChange: (page: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button className={activePage === id ? "is-active" : ""} key={id} type="button" onClick={() => onChange(id)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ChatScreen({
  messages,
  onSend,
  contextDigest,
}: {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  contextDigest: string;
}) {
  const [draft, setDraft] = useState("");
  const quickPrompts = ["What should I do this week?", "Gift ideas", "Date ideas", "Context summary"];

  function submitMessage(content = draft) {
    const cleanContent = content.trim();
    if (!cleanContent) {
      return;
    }

    onSend(cleanContent);
    setDraft("");
  }

  return (
    <div className="chat-layout">
      <div className="chat-thread" aria-live="polite">
        {messages.map((message) => (
          <article className={`chat-bubble ${message.role}`} key={message.id}>
            {message.role === "assistant" ? <Bot size={17} /> : null}
            <p>{message.content}</p>
          </article>
        ))}
      </div>
      <div className="quick-prompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about gifts, dates, people, notes..."
          rows={1}
        />
        <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
          <Send size={20} />
        </button>
      </form>
      <details className="context-details">
        <summary>Context loaded into chat</summary>
        <pre>{contextDigest}</pre>
      </details>
    </div>
  );
}

function PeopleScreen({
  people,
  selectedPersonId,
  onSelect,
  onEdit,
  onDelete,
  onAddNote,
  onCreate,
}: {
  people: Person[];
  selectedPersonId: string | null;
  onSelect: (personId: string) => void;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
  onAddNote: (personId: string, text: string) => void;
  onCreate: () => void;
}) {
  const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? people[0];

  if (people.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus size={34} />}
        title="No people saved"
        body="Add the people who come up in her stories, plans, stresses, and celebrations."
        actionLabel="Add person"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="people-layout">
      <div className="bubble-field">
        {people.map((person, index) => {
          const size = 116 + Math.min(person.notes.length * 9, 34) + (index % 3) * 10;
          return (
            <button
              className={`person-bubble ${selectedPerson?.id === person.id ? "is-selected" : ""}`}
              key={person.id}
              style={{ "--bubble": `${size}px`, "--bubble-color": person.color } as React.CSSProperties}
              type="button"
              onClick={() => onSelect(person.id)}
            >
              <span>{person.name.slice(0, 1)}</span>
              <strong>{person.name}</strong>
              <small>{person.relationship || `${person.notes.length} notes`}</small>
            </button>
          );
        })}
      </div>

      {selectedPerson ? (
        <PersonDetail person={selectedPerson} onEdit={onEdit} onDelete={onDelete} onAddNote={onAddNote} />
      ) : null}
    </div>
  );
}

function PersonDetail({
  person,
  onEdit,
  onDelete,
  onAddNote,
}: {
  person: Person;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
  onAddNote: (personId: string, text: string) => void;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote("");
  }, [person.id]);

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <span className="detail-dot" style={{ background: person.color }} />
          <h2>{person.name}</h2>
          <p>{person.relationship || "Person"}</p>
        </div>
        <div className="icon-row">
          <button className="icon-button ghost" type="button" onClick={() => onEdit(person.id)} aria-label="Edit person">
            <Pencil size={18} />
          </button>
          <button className="icon-button ghost danger" type="button" onClick={() => onDelete(person.id)} aria-label="Delete person">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <form
        className="mini-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAddNote(person.id, note);
          setNote("");
        }}
      >
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note about them" />
        <button type="submit" disabled={!note.trim()} aria-label="Save note">
          <Plus size={18} />
        </button>
      </form>

      <div className="note-stack">
        {person.notes.length === 0 ? <p className="muted">No notes yet.</p> : null}
        {person.notes.map((item) => (
          <article className="person-note" key={item.id}>
            <p>{item.text}</p>
            <span>{formatDate(item.createdAt)}</span>
          </article>
        ))}
      </div>
    </aside>
  );
}

function IdeasScreen({
  ideas,
  activeTab,
  onTabChange,
  onCreate,
  onEdit,
  onDelete,
}: {
  ideas: Idea[];
  activeTab: IdeaType;
  onTabChange: (type: IdeaType) => void;
  onCreate: (type: IdeaType) => void;
  onEdit: (ideaId: string, ideaType: IdeaType) => void;
  onDelete: (ideaId: string) => void;
}) {
  const filteredIdeas = ideas.filter((idea) => idea.type === activeTab);

  return (
    <div className="ideas-layout">
      <div className="segmented">
        <button className={activeTab === "gift" ? "is-active" : ""} type="button" onClick={() => onTabChange("gift")}>
          <Gift size={17} />
          Gifts
        </button>
        <button className={activeTab === "date" ? "is-active" : ""} type="button" onClick={() => onTabChange("date")}>
          <CalendarDays size={17} />
          Dates
        </button>
      </div>

      {filteredIdeas.length === 0 ? (
        <EmptyState
          icon={activeTab === "gift" ? <Gift size={34} /> : <CalendarDays size={34} />}
          title={activeTab === "gift" ? "No gift ideas" : "No date ideas"}
          body={activeTab === "gift" ? "Save clues while they are fresh." : "Bank places, tiny adventures, and reliable fallback plans."}
          actionLabel={activeTab === "gift" ? "Add gift" : "Add date"}
          onAction={() => onCreate(activeTab)}
        />
      ) : (
        <div className="idea-grid">
          {filteredIdeas.map((idea) => (
            <article className={`idea-card ${idea.type}`} key={idea.id}>
              {idea.type === "date" && idea.mapQuery ? (
                <div className="map-preview">
                  {idea.previewImage ? <img src={idea.previewImage} alt="" loading="lazy" /> : null}
                  <iframe
                    title={`${idea.title} map`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(idea.mapQuery)}&output=embed`}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="idea-sigil">
                  {idea.type === "gift" ? <Gift size={26} /> : <CalendarDays size={26} />}
                </div>
              )}
              <div className="idea-copy">
                <span className="idea-kind">{idea.type}</span>
                <h2>{idea.title}</h2>
                {idea.description ? <p>{idea.description}</p> : null}
                {idea.link ? (
                  <a href={idea.link} target="_blank" rel="noreferrer">
                    <LinkIcon size={15} />
                    Open link
                  </a>
                ) : null}
              </div>
              <div className="card-actions">
                <button className="icon-button ghost" type="button" onClick={() => onEdit(idea.id, idea.type)} aria-label="Edit idea">
                  <Pencil size={18} />
                </button>
                <button className="icon-button ghost danger" type="button" onClick={() => onDelete(idea.id)} aria-label="Delete idea">
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationsScreen({
  recommendations,
  notificationsEnabled,
  onCopy,
  onNotify,
  onCreateIdea,
}: {
  recommendations: Recommendation[];
  notificationsEnabled: boolean;
  onCopy: (rec: Recommendation) => void;
  onNotify: (rec: Recommendation) => void;
  onCreateIdea: (type: IdeaType) => void;
}) {
  const featured = recommendations[0];

  return (
    <div className="recommendations-layout">
      {featured ? (
        <section className="hero-rec">
          <span className="rec-category">{featured.category}</span>
          <h2>{featured.title}</h2>
          <p>{featured.body}</p>
          <div className="hero-actions">
            <button type="button" onClick={() => onNotify(featured)}>
              <Bell size={18} />
              {notificationsEnabled ? "Push again" : "Enable push"}
            </button>
            {featured.category === "message" ? (
              <button className="secondary" type="button" onClick={() => onCopy(featured)}>
                <Copy size={18} />
                Copy
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="rec-actions">
        <button type="button" onClick={() => onCreateIdea("gift")}>
          <Gift size={18} />
          Gift
        </button>
        <button type="button" onClick={() => onCreateIdea("date")}>
          <MapPin size={18} />
          Date
        </button>
      </div>

      <div className="rec-list">
        {recommendations.map((rec) => (
          <article className="rec-card" key={rec.id}>
            <div className="rec-icon">{categoryIcon(rec.category)}</div>
            <div>
              <span>{rec.source}</span>
              <h3>{rec.title}</h3>
              <p>{rec.body}</p>
              <strong>{rec.action}</strong>
            </div>
            {rec.category === "message" ? (
              <button className="icon-button ghost" type="button" onClick={() => onCopy(rec)} aria-label="Copy message">
                <Copy size={18} />
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function NotepadScreen({
  notes,
  selectedNoteId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: {
  notes: AppState["notes"];
  selectedNoteId: string | null;
  onSelect: (noteId: string) => void;
  onCreate: () => void;
  onUpdate: (noteId: string, updates: { title?: string; body?: string }) => void;
  onDelete: (noteId: string) => void;
}) {
  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? notes[0];

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={34} />}
        title="No entries"
        body="Start with the details that are too small for a calendar and too important to forget."
        actionLabel="New entry"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="notepad-layout">
      <nav className="entry-list" aria-label="Notebook entries">
        {notes.map((note) => (
          <button className={selectedNote?.id === note.id ? "is-active" : ""} key={note.id} type="button" onClick={() => onSelect(note.id)}>
            <span>{note.title || "Untitled"}</span>
            <small>{formatDate(note.updatedAt)}</small>
          </button>
        ))}
      </nav>

      {selectedNote ? (
        <article className="editor">
          <div className="editor-toolbar">
            <input
              value={selectedNote.title}
              onChange={(event) => onUpdate(selectedNote.id, { title: event.target.value })}
              placeholder="Entry title"
            />
            <button className="icon-button ghost danger" type="button" onClick={() => onDelete(selectedNote.id)} aria-label="Delete entry">
              <Trash2 size={18} />
            </button>
          </div>
          <textarea
            value={selectedNote.body}
            onChange={(event) => onUpdate(selectedNote.id, { body: event.target.value })}
            placeholder="Write the detail before it slips..."
          />
        </article>
      ) : null}
    </div>
  );
}

function PersonForm({
  person,
  onCancel,
  onSave,
}: {
  person?: Person;
  onCancel: () => void;
  onSave: (person: Omit<Person, "id" | "createdAt" | "updatedAt" | "notes"> & { id?: string }) => void;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [relationship, setRelationship] = useState(person?.relationship ?? "");
  const [color, setColor] = useState(person?.color ?? PEOPLE_COLORS[0]);

  return (
    <Sheet title={person ? "Edit person" : "New person"} onCancel={onCancel}>
      <form
        className="sheet-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            return;
          }
          onSave({ id: person?.id, name: name.trim(), relationship: relationship.trim(), color });
        }}
      >
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya" autoFocus />
        </label>
        <label>
          Relationship
          <input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Best friend, sister, coworker" />
        </label>
        <div className="swatches" role="radiogroup" aria-label="Bubble color">
          {PEOPLE_COLORS.map((swatch) => (
            <button
              className={color === swatch ? "is-active" : ""}
              key={swatch}
              style={{ background: swatch }}
              type="button"
              onClick={() => setColor(swatch)}
              aria-label={`Choose ${swatch}`}
            />
          ))}
        </div>
        <button className="primary-action" type="submit" disabled={!name.trim()}>
          <Check size={18} />
          Save
        </button>
      </form>
    </Sheet>
  );
}

function IdeaForm({
  idea,
  ideaType,
  onCancel,
  onSave,
}: {
  idea?: Idea;
  ideaType: IdeaType;
  onCancel: () => void;
  onSave: (idea: Omit<Idea, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
}) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [link, setLink] = useState(idea?.link ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [preview, setPreview] = useState<PlacePreview | null>(
    idea?.mapQuery ? { title: idea.sourceTitle || idea.title, image: idea.previewImage, mapQuery: idea.mapQuery } : null,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  async function refreshPreview() {
    if (ideaType !== "date" || !link.trim()) {
      return;
    }

    setIsLoadingPreview(true);
    const fallback = extractMapInfo(link);

    try {
      const response = await fetch(`/api/place-preview?url=${encodeURIComponent(link)}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("Preview unavailable");
      }
      const data = (await response.json()) as Partial<PlacePreview>;
      const nextPreview = {
        title: data.title || fallback?.title || title || "Saved map spot",
        image: data.image || fallback?.image,
        mapQuery: data.mapQuery || fallback?.mapQuery || data.title || title || link,
      };
      setPreview(nextPreview);
      if (nextPreview.title && nextPreview.title !== "Saved map spot") {
        setTitle(nextPreview.title);
      }
    } catch {
      if (fallback) {
        setPreview(fallback);
        if (!title.trim()) {
          setTitle(fallback.title);
        }
      }
    } finally {
      setIsLoadingPreview(false);
    }
  }

  return (
    <Sheet title={idea ? "Edit idea" : ideaType === "gift" ? "New gift" : "New date"} onCancel={onCancel}>
      <form
        className="sheet-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() && !description.trim() && !link.trim()) {
            return;
          }
          const mapFallback = ideaType === "date" ? preview ?? extractMapInfo(link) : null;
          onSave({
            id: idea?.id,
            type: ideaType,
            title: title.trim() || mapFallback?.title || "Untitled",
            link: link.trim(),
            description: description.trim(),
            previewImage: mapFallback?.image,
            mapQuery: mapFallback?.mapQuery,
            sourceTitle: mapFallback?.title,
          });
        }}
      >
        <label>
          Name
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={ideaType === "gift" ? "Silk scarf" : "Corner wine bar"} autoFocus />
        </label>
        <label>
          Link
          <div className="input-with-button">
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              onBlur={() => void refreshPreview()}
              placeholder={ideaType === "date" ? "Google Maps link" : "Store link"}
            />
            {ideaType === "date" ? (
              <button type="button" onClick={() => void refreshPreview()} aria-label="Refresh map preview" disabled={!link.trim() || isLoadingPreview}>
                {isLoadingPreview ? <LoaderCircle className="spin" size={18} /> : <MapPin size={18} />}
              </button>
            ) : null}
          </div>
        </label>
        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why it fits, timing, size, reservation notes..." />
        </label>

        {ideaType === "date" && preview ? (
          <div className="inline-preview">
            <MapPin size={18} />
            <span>{preview.title}</span>
          </div>
        ) : null}

        <button className="primary-action" type="submit">
          <Check size={18} />
          Save
        </button>
      </form>
    </Sheet>
  );
}

function Sheet({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button className="icon-button ghost" type="button" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <button type="button" onClick={onAction}>
        <Plus size={18} />
        {actionLabel}
      </button>
    </div>
  );
}

function categoryIcon(category: Recommendation["category"]) {
  if (category === "gift") {
    return <Gift size={20} />;
  }

  if (category === "date") {
    return <CalendarDays size={20} />;
  }

  if (category === "people") {
    return <Users size={20} />;
  }

  if (category === "message") {
    return <MessageCircle size={20} />;
  }

  return <Heart size={20} />;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export default App;
