"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/tokens";
import { ApiError } from "@/lib/api";
import {
  adminApi,
  type AdminOverview,
  type AdminUser,
  type AdminQuestion,
  type AdminArticle,
  type AdminSection,
  type AdminSettings,
  type OptionInput
} from "@/lib/admin";

type Tab = "overview" | "users" | "questions" | "articles" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "questions", label: "Questions" },
  { id: "articles", label: "Articles" },
  { id: "settings", label: "Settings" }
];

export default function AdminConsole() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <p className="py-16 text-center text-slate-400">Loading…</p>;
  }

  if (!user) return null;

  if (!user.is_staff) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <h1 className="text-xl font-bold text-red-700">403 — Access denied</h1>
        <p className="mt-2 text-sm text-red-600">
          This area is restricted to staff accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Admin Console
        </h1>
        <p className="text-sm text-slate-500">
          Manage content, users and orders for HanBridge.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "questions" && <QuestionsTab />}
      {tab === "articles" && <ArticlesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ------------------------------ Settings ---------------------------- */
function SettingsTab() {
  const token = useToken();
  const [data, setData] = useState<AdminSettings | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await adminApi.settings(token));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await adminApi.updateSettings(token, {
        gemini_api_key: keyInput
      });
      setData(next);
      setKeyInput("");
      setNotice("Saved. The AI tutor now uses the live Gemini key.");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function clearKey() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await adminApi.updateSettings(token, { gemini_api_key: "" });
      setData(next);
      setKeyInput("");
      setNotice("Gemini key cleared. The tutor falls back to offline mode.");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && <ErrorBox message={error} />}
      {notice && (
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">AI Tutor (Gemini)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste your Google Gemini API key to switch the AI tutor from offline
          fallback to live responses. Get one free at Google AI Studio
          (aistudio.google.com). The key is stored securely and only its last 4
          characters are ever shown.
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              data?.ai_enabled ? "bg-green-500" : "bg-slate-300"
            }`}
          />
          <span className="font-medium text-slate-700">
            {data?.ai_enabled ? "Live AI enabled" : "Offline fallback"}
          </span>
          {data?.gemini_key_set && (
            <span className="text-slate-400">
              · current key {data.gemini_key_masked}
            </span>
          )}
        </div>

        <form onSubmit={save} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIza… (Gemini API key)"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !keyInput.trim()}
            className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save key"}
          </button>
        </form>

        {data?.gemini_key_set && (
          <button
            type="button"
            onClick={clearKey}
            disabled={busy}
            className="mt-3 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Clear key (revert to offline)
          </button>
        )}
      </section>
    </div>
  );
}

function useToken(): string {
  return getAccessToken() ?? "";
}

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return `${e.status} — ${e.message}`;
  if (e instanceof Error) return e.message;
  return "Unexpected error";
}

/* ----------------------------- Overview ----------------------------- */
function OverviewTab() {
  const token = useToken();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .overview(token)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(errMsg(e)));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  const cards = [
    { label: "Total users", value: data.total_users },
    { label: "Active VIP", value: data.vip_users },
    { label: "Questions", value: data.total_questions },
    { label: "Mock tests", value: data.total_mock_tests },
    { label: "Articles", value: data.total_articles },
    { label: "Orders", value: data.total_orders },
    { label: "Revenue", value: data.total_revenue }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <p className="text-2xl font-extrabold text-slate-900">{c.value}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Users ------------------------------ */
function UsersTab() {
  const token = useToken();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (q?: string) => {
      setError(null);
      try {
        setUsers(await adminApi.users(token, q));
      } catch (e) {
        setError(errMsg(e));
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(id: number, payload: Parameters<typeof adminApi.updateUser>[2]) {
    setBusy(true);
    try {
      await adminApi.updateUser(token, id, payload);
      await load(query);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  function grantVip(id: number, days: number) {
    const until = new Date(Date.now() + days * 86400000).toISOString();
    mutate(id, { vip_until: until });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {error && <ErrorBox message={error} />}

      <div className="table-wrapper overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">VIP until</th>
              <th className="px-3 py-2">Staff</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{u.id}</td>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {u.email ?? u.phone ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {u.vip_until ? u.vip_until.slice(0, 10) : "—"}
                </td>
                <td className="px-3 py-2">{u.is_staff ? "✅" : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() => grantVip(u.id, 30)}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      +30d VIP
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => grantVip(u.id, 365)}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      +1y VIP
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => mutate(u.id, { is_staff: !u.is_staff })}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {u.is_staff ? "Revoke staff" : "Make staff"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------- Questions ---------------------------- */
function QuestionsTab() {
  const token = useToken();
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // New-question form state
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { label: "A", content: "", is_correct: true },
    { label: "B", content: "", is_correct: false }
  ]);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    adminApi
      .sections(token)
      .then((s) => {
        setSections(s);
        if (s.length && sectionId === null) setSectionId(s[0].id);
      })
      .catch((e) => setError(errMsg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadQuestions = useCallback(
    async (id: number) => {
      setError(null);
      try {
        setQuestions(await adminApi.questions(token, id));
      } catch (e) {
        setError(errMsg(e));
      }
    },
    [token]
  );

  useEffect(() => {
    if (sectionId) loadQuestions(sectionId);
  }, [sectionId, loadQuestions]);

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionId) return;
    setError(null);
    setNotice(null);
    try {
      await adminApi.createQuestion(token, {
        section_id: sectionId,
        stem,
        options
      });
      setStem("");
      setOptions([
        { label: "A", content: "", is_correct: true },
        { label: "B", content: "", is_correct: false }
      ]);
      setNotice("Question created.");
      await loadQuestions(sectionId);
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function runImport() {
    if (!sectionId) return;
    setError(null);
    setNotice(null);
    try {
      const parsed = JSON.parse(importText);
      const rows = Array.isArray(parsed) ? parsed : parsed.questions;
      const res = await adminApi.importQuestions(token, sectionId, rows);
      setNotice(`Imported ${res.imported_count} questions.`);
      setImportText("");
      await loadQuestions(sectionId);
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function remove(id: number) {
    if (!sectionId) return;
    try {
      await adminApi.deleteQuestion(token, id);
      await loadQuestions(sectionId);
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Section</label>
        <select
          value={sectionId ?? ""}
          onChange={(e) => setSectionId(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} · {s.title} ({s.question_type})
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorBox message={error} />}
      {notice && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create question */}
        <form
          onSubmit={createQuestion}
          className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <h2 className="font-bold text-slate-900">New question</h2>
          <textarea
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            required
            placeholder="Question stem (中文 / prompt)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={2}
          />
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={o.label}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((p, j) =>
                      j === i ? { ...p, label: e.target.value } : p
                    )
                  )
                }
                className="w-12 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
              <input
                value={o.content}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((p, j) =>
                      j === i ? { ...p, content: e.target.value } : p
                    )
                  )
                }
                placeholder={`Option ${o.label}`}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={o.is_correct}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((p, j) =>
                        j === i ? { ...p, is_correct: e.target.checked } : p
                      )
                    )
                  }
                />
                correct
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setOptions((prev) => [
                ...prev,
                {
                  label: String.fromCharCode(65 + prev.length),
                  content: "",
                  is_correct: false
                }
              ])
            }
            className="text-xs font-medium text-brand-600"
          >
            + Add option
          </button>
          <button className="block w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
            Create question
          </button>
        </form>

        {/* Bulk import */}
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Bulk import (JSON)</h2>
          <p className="text-xs text-slate-500">
            Array of objects with <code>stem</code>, optional{" "}
            <code>difficulty</code>, and <code>options</code> (each with{" "}
            <code>label</code>, <code>content</code>, <code>is_correct</code>).
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"stem":"...","options":[{"label":"A","content":"...","is_correct":true}]}]'
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            rows={8}
          />
          <button
            type="button"
            onClick={runImport}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
          >
            Import into section
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-2">
        <h2 className="font-bold text-slate-900">
          Questions ({questions.length})
        </h2>
        {questions.map((q) => (
          <div
            key={q.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium text-slate-800">
                #{q.id} {q.stem}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {q.options.map((o) => `${o.label}${o.is_correct ? "✔" : ""}`).join("  ")}
              </p>
            </div>
            <button
              onClick={() => remove(q.id)}
              className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Articles ----------------------------- */
function ArticlesTab() {
  const token = useToken();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lang, setLang] = useState("en");

  const load = useCallback(async () => {
    setError(null);
    try {
      setArticles(await adminApi.articles(token));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.createArticle(token, { slug, title, body, lang });
      setSlug("");
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function remove(id: number) {
    try {
      await adminApi.deleteArticle(token, id);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={create}
        className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-bold text-slate-900">New article</h2>
        {error && <ErrorBox message={error} />}
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          placeholder="slug (e.g. how-to-pass-hsk6)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Title"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="vi">Tiếng Việt</option>
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (Markdown / HTML)"
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Publish article
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-bold text-slate-900">
          Articles ({articles.length})
        </h2>
        {articles.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium text-slate-800">{a.title}</p>
              <p className="text-xs text-slate-500">
                /{a.slug} · {a.lang}
              </p>
            </div>
            <button
              onClick={() => remove(a.id)}
              className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      {message}
    </p>
  );
}
