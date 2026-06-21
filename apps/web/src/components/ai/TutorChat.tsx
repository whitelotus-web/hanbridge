"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { aiApi, type TutorMessage } from "@/lib/ai";
import { getAccessToken } from "@/lib/tokens";

export default function TutorChat() {
  const t = useTranslations("tutor");
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    aiApi.history(token).then(setMessages).catch(() => undefined);
    aiApi.status().then((s) => setAiEnabled(s.ai_enabled)).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    const token = getAccessToken();
    if (!text || !token || sending) return;
    setSending(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await aiApi.chat(text, locale, token);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("error") }
      ]);
    } finally {
      setSending(false);
    }
  }

  if (authLoading || !user) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
        {aiEnabled === false && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {t("offlineNotice")}
          </p>
        )}
      </div>

      <div className="flex min-h-[50vh] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-slate-400">
            {t("empty")}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-800"
            }
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder={t("placeholder")}
          className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="btn-primary !px-5 disabled:opacity-50"
        >
          {sending ? t("sending") : t("send")}
        </button>
      </div>
    </div>
  );
}
