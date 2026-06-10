export type Page = "chat" | "people" | "ideas" | "recommendations" | "notepad";

export type IdeaType = "gift" | "date";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface PersonNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  color: string;
  notes: PersonNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  type: IdeaType;
  title: string;
  link: string;
  description: string;
  previewImage?: string;
  mapQuery?: string;
  sourceTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  lastNotificationAt?: string;
  seedVersion?: number;
}

export interface AppState {
  girlfriendName: string;
  people: Person[];
  ideas: Idea[];
  notes: NotebookEntry[];
  messages: ChatMessage[];
  settings: AppSettings;
}

export interface Recommendation {
  id: string;
  category: "gift" | "date" | "care" | "people" | "message";
  title: string;
  body: string;
  action: string;
  source: string;
  priority: number;
}

export interface PlacePreview {
  title: string;
  image?: string;
  mapQuery: string;
}
