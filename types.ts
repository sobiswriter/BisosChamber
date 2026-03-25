
export interface Persona {
  id: string;
  name: string;
  role: string;
  personality: string;
  bio: string;
  interests: string[];
  speakingStyle: string;
  greeting: string;
  avatar: string;
  color: string;
  memories?: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  personality: string;
  interests: string[];
  avatar: string;
  color: string;
  isAnonymous?: boolean;
}

export interface AppSettings {
  model: 'gemini-3-flash-preview' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-3.1-flash-lite-preview';
  apiKey?: string;
  showDateTimeContext?: boolean;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio';
  url: string;
  mimeType: string;
  base64?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  personaId?: string; // ID of the persona who spoke
  text: string;
  timestamp: number;
  attachment?: Attachment;
  isScenario?: boolean;
  scenarioImage?: Attachment;
}

export interface ChatSession {
  id: string;
  personaId: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface CastMember {
  personaId: string;
  sceneRole: string; // Specific role/instruction for this simulation
}

export interface PlaygroundSession {
  id: string;
  title: string;
  cast: CastMember[]; // Ordered list of participants
  messages: Message[];
  currentScene: string;
  updatedAt: number;
}
