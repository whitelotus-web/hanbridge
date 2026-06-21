// Admin CMS API client — talks to the staff-guarded /admin/* endpoints.
import { ApiError } from "./api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

async function adminRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_V1}/admin${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...headers
    }
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg)
        detail = body.detail[0].msg;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface AdminOverview {
  total_users: number;
  vip_users: number;
  total_questions: number;
  total_mock_tests: number;
  total_articles: number;
  total_orders: number;
  total_revenue: string;
}

export interface AdminUser {
  id: number;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  locale: string;
  is_active: boolean;
  is_staff: boolean;
  vip_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserUpdate {
  display_name?: string | null;
  is_active?: boolean;
  is_staff?: boolean;
  vip_until?: string | null;
}

export interface AdminOption {
  id: number;
  label: string;
  content: string;
  is_correct: boolean;
}

export interface AdminQuestion {
  id: number;
  section_id: number;
  stem: string;
  audio_url: string | null;
  image_url: string | null;
  explanation: string | null;
  translation: string | null;
  difficulty: number;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  options: AdminOption[];
}

export interface OptionInput {
  label: string;
  content: string;
  is_correct: boolean;
}

export interface QuestionCreate {
  section_id: number;
  stem: string;
  difficulty?: number;
  explanation?: string | null;
  translation?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  options: OptionInput[];
}

export interface AdminArticle {
  id: number;
  slug: string;
  title: string;
  body: string;
  lang: string;
  is_sample: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleCreate {
  slug: string;
  title: string;
  body?: string;
  lang?: string;
  published_at?: string | null;
}

export interface AdminLevel {
  id: number;
  code: string;
  name: string;
  order: number;
}

export interface AdminSkill {
  id: number;
  level_id: number;
  type: string;
  name: string;
  order: number;
}

export interface AdminSection {
  id: number;
  skill_id: number;
  title: string;
  question_type: string;
  order: number;
  is_free: boolean;
}

export interface ImportResult {
  imported_count: number;
}

export const adminApi = {
  overview: (token: string) => adminRequest<AdminOverview>("/overview", token),

  // Users
  users: (token: string, query?: string) =>
    adminRequest<AdminUser[]>(
      `/users${query ? `?query=${encodeURIComponent(query)}` : ""}`,
      token
    ),
  updateUser: (token: string, id: number, payload: AdminUserUpdate) =>
    adminRequest<AdminUser>(`/users/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  // Content tree
  levels: (token: string) => adminRequest<AdminLevel[]>("/levels", token),
  skills: (token: string, levelId?: number) =>
    adminRequest<AdminSkill[]>(
      `/skills${levelId ? `?level_id=${levelId}` : ""}`,
      token
    ),
  sections: (token: string, skillId?: number) =>
    adminRequest<AdminSection[]>(
      `/sections${skillId ? `?skill_id=${skillId}` : ""}`,
      token
    ),

  // Questions
  questions: (token: string, sectionId?: number) =>
    adminRequest<AdminQuestion[]>(
      `/questions${sectionId ? `?section_id=${sectionId}` : ""}`,
      token
    ),
  createQuestion: (token: string, payload: QuestionCreate) =>
    adminRequest<AdminQuestion>("/questions", token, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteQuestion: (token: string, id: number) =>
    adminRequest<void>(`/questions/${id}`, token, { method: "DELETE" }),
  importQuestions: (
    token: string,
    sectionId: number,
    questions: unknown[]
  ) =>
    adminRequest<ImportResult>("/questions/import", token, {
      method: "POST",
      body: JSON.stringify({ section_id: sectionId, questions })
    }),

  // Articles
  articles: (token: string) => adminRequest<AdminArticle[]>("/articles", token),
  createArticle: (token: string, payload: ArticleCreate) =>
    adminRequest<AdminArticle>("/articles", token, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteArticle: (token: string, id: number) =>
    adminRequest<void>(`/articles/${id}`, token, { method: "DELETE" }),

  // Settings
  settings: (token: string) =>
    adminRequest<AdminSettings>("/settings", token),
  updateSettings: (token: string, payload: AdminSettingsUpdate) =>
    adminRequest<AdminSettings>("/settings", token, {
      method: "PUT",
      body: JSON.stringify(payload)
    })
};

export interface AdminSettings {
  gemini_key_set: boolean;
  gemini_key_masked: string;
  ai_enabled: boolean;
}

export interface AdminSettingsUpdate {
  gemini_api_key?: string;
}
