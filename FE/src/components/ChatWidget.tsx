import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, Plus, SendHorizonal, X } from "lucide-react";
import { fetchChatMessages, fetchChatSessions, sendChatMessage } from "@/lib/api";
import type { ChatMessage, ChatSession, User } from "@/lib/types";

type Props = {
  user: User;
};

export function ChatWidget({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoadingSessions(true);
    fetchChatSessions(user.id)
      .then(async (data) => {
        setSessions(data.sessions);
        const current = data.sessions[0] ?? null;
        setActiveSession(current);
        if (current) {
          const detail = await fetchChatMessages(current.id);
          setMessages(detail.messages);
        } else {
          setMessages([]);
        }
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Không tải được chat.");
      })
      .finally(() => setLoadingSessions(false));
  }, [open, user.id]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const greeting = useMemo(
    () =>
      `Xin chào ${user.full_name || user.email}. Bạn có thể hỏi về AQI hiện tại, cảnh báo gần đây, hồ sơ sức khỏe, hoặc nên làm gì để giảm phơi nhiễm.`,
    [user.email, user.full_name],
  );

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError(null);
    setInput("");

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      session_id: activeSession?.id ?? "pending",
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const data = await sendChatMessage({
        userId: user.id,
        sessionId: activeSession?.id ?? null,
        message,
      });
      setActiveSession(data.session);
      setMessages(data.messages);
      const refreshedSessions = await fetchChatSessions(user.id);
      setSessions(refreshedSessions.sessions);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không gửi được tin nhắn.");
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  async function openSession(session: ChatSession) {
    setActiveSession(session);
    setLoadingSessions(true);
    setError(null);

    try {
      const data = await fetchChatMessages(session.id);
      setMessages(data.messages);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không tải được nội dung chat.");
    } finally {
      setLoadingSessions(false);
    }
  }

  function startNewChat() {
    setActiveSession(null);
    setMessages([]);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-xl shadow-blue-600/25 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open ? (
        <div className="fixed bottom-40 right-4 z-40 flex h-[min(72vh,680px)] w-[min(92vw,420px)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:bottom-24 sm:right-6">
          <aside className="hidden w-40 border-r border-slate-200 bg-slate-50/80 md:flex md:flex-col">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Chat</div>
              <button
                onClick={startNewChat}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 overflow-auto px-2 pb-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => void openSession(session)}
                  className={`w-full rounded-2xl px-3 py-2 text-left text-xs ${
                    activeSession?.id === session.id
                      ? "bg-white text-slate-900 ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  <div className="truncate">{session.title}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-900">AirPath AI</div>
                    <div className="text-xs text-slate-500">AQI chatbot + cảnh báo + gợi ý</div>
                  </div>
                </div>
                <button
                  onClick={startNewChat}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                >
                  Chat mới
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-auto bg-slate-50/60 px-4 py-4">
              {loadingSessions ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
                  Đang tải lịch sử chat...
                </div>
              ) : null}

              {!messages.length && !loadingSessions ? (
                <Bubble role="assistant" content={greeting} />
              ) : null}

              {messages.map((message) => (
                <Bubble key={message.id} role={message.role} content={message.content} />
              ))}

              {loading ? <Bubble role="assistant" content="Đang suy nghĩ..." pending /> : null}

              {error ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Hỏi về AQI, cảnh báo, hồ sơ sức khỏe, hoặc nên làm gì lúc này..."
                  className="min-h-[48px] flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-slate-200"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Bubble({
  role,
  content,
  pending = false,
}: {
  role: ChatMessage["role"];
  content: string;
  pending?: boolean;
}) {
  const assistant = role !== "user";

  return (
    <div className={`flex ${assistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          assistant
            ? "bg-white text-slate-700 ring-1 ring-slate-200"
            : "bg-gradient-to-r from-blue-600 to-emerald-500 text-white"
        } ${pending ? "animate-pulse" : ""}`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
