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
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export interface EarnedBadge {
  code: string;
  name: string;
  description: string;
  icon: string;
  threshold_type: string;
  threshold_value: number;
  earned_at: string;
}

export interface Gamification {
  xp: number;
  level: number;
  xp_into_level: number;
  xp_for_next_level: number;
  streak_days: number;
  longest_streak: number;
  last_active_date: string | null;
  badges: EarnedBadge[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  xp: number;
  level: number;
  streak_days: number;
  is_me: boolean;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  my_rank: number | null;
}

export const gamificationApi = {
  me: (token: string) => call<Gamification>("/me/gamification", { token }),
  leaderboard: (token?: string) =>
    call<Leaderboard>("/leaderboard", { token })
};
