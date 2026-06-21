const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

async function call<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_V1}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });
  if (!res.ok) {
    throw new Error(`AI request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface ExplainResult {
  explanation: string;
  is_correct: boolean | null;
  correct_answer: string | null;
  ai_generated: boolean;
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface TutorReply {
  reply: string;
  ai_generated: boolean;
}

export interface StudyPlanItem {
  section_id: number;
  section_title: string;
  level_code: string;
  skill_name: string;
  answered: number;
  accuracy: number;
  reason: string;
}

export interface StudyPlan {
  summary: string;
  recommendations: StudyPlanItem[];
  ai_generated: boolean;
}

export const aiApi = {
  status: () => call<{ ai_enabled: boolean }>("/ai/status"),

  explain: (
    params: {
      question_id: number;
      chosen_option_id?: number | null;
      text_answer?: string | null;
      locale?: string;
    },
    token?: string
  ) =>
    call<ExplainResult>("/ai/explain", {
      method: "POST",
      body: JSON.stringify(params),
      token
    }),

  chat: (message: string, locale: string, token: string) =>
    call<TutorReply>("/ai/tutor/chat", {
      method: "POST",
      body: JSON.stringify({ message, locale }),
      token
    }),

  history: (token: string) =>
    call<TutorMessage[]>("/ai/tutor/history", { token }),

  studyPlan: (token: string) => call<StudyPlan>("/ai/study-plan", { token })
};
