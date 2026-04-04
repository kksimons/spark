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

export type AgentPhase =
  | "entering"
  | "thinking"
  | "responded"
  | "questioning"
  | "waiting"
  | "followup"
  | "done";

export interface AgentState {
  personaId: string;
  phase: AgentPhase;
  assessment: string | null;
  question: string | null;
  followup: string | null;
  userAnswer: string | null;
}

export interface DiscussionMsg {
  personaId: string;
  content: string;
}

export interface SSEEvent {
  type: string;
  id?: string;
  persona?: string;
  round?: number;
  content?: string;
  status?: string;
  sections?: SpecSection[];
}

export interface SpecSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  order: number;
  status?: "skeleton" | "writing" | "complete";
  writingBy?: string;
}

export interface Spec {
  id: string;
  sessionId: string;
  content: string;
  sections: SpecSection[];
  version: number;
  updatedAt: string;
  githubUrl?: string;
}

export interface SpecVersion {
  id: string;
  specId: string;
  content: string;
  version: number;
  createdAt: string;
}
