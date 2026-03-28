export interface Persona {
  id: string;
  name: string;
  department: string;
  role: string;
  icon: string;
  avatar: string;
}

export interface Message {
  id?: string;
  session_id: string;
  persona: string;
  round: number;
  content: string;
  status: string;
  created_at?: string;
}

export interface Session {
  id: string;
  idea: string;
  status: "pending" | "evaluating" | "complete" | "error";
  summary: string | null;
  created_at: string;
  messages?: Message[];
}

export type PersonaStatus = "idle" | "thinking" | "speaking" | "done";

export interface PersonaState {
  status: PersonaStatus;
  messages: { round: number; content: string }[];
}

export interface SSEEvent {
  type: string;
  persona?: string;
  round?: number;
  content?: string;
  summary?: string;
  status?: string;
}
