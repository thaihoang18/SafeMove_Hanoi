import {
  appendChatMessage,
  createChatSession,
  getChatSession,
  listChatMessages,
  listChatSessions,
  renameChatSession,
} from "../services/chat-storage.mjs";
import { generateChatReply } from "../services/llm-chat-service.mjs";
import { assert, isNonEmptyString } from "../utils/validation.mjs";

export async function listChatSessionsController(searchParams) {
  const userId = (searchParams.get("userId") ?? "").trim();
  assert(isNonEmptyString(userId), "userId is required.");

  return {
    sessions: await listChatSessions(userId),
  };
}

export async function getChatSessionMessagesController(sessionId) {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error("Chat session not found.");
  }

  return {
    session,
    messages: await listChatMessages(sessionId),
  };
}

export async function createChatSessionController(body) {
  const userId = String(body.userId ?? "").trim();
  assert(isNonEmptyString(userId), "userId is required.");

  const title = isNonEmptyString(body.title) ? body.title.trim() : "New chat";
  const session = await createChatSession(userId, title);

  return { session, messages: [] };
}

export async function sendChatMessageController(body) {
  const userId = String(body.userId ?? "").trim();
  const input = String(body.message ?? "").trim();
  assert(isNonEmptyString(userId), "userId is required.");
  assert(isNonEmptyString(input), "message is required.");

  let session = null;
  if (isNonEmptyString(body.sessionId)) {
    session = await getChatSession(body.sessionId.trim());
  }

  if (!session) {
    const title = input.length > 48 ? `${input.slice(0, 45)}...` : input;
    session = await createChatSession(userId, title);
  }

  await appendChatMessage(session.id, "user", input);

  const persistedMessages = await listChatMessages(session.id);
  const llmMessages = persistedMessages.map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const reply = await generateChatReply({
    userId,
    messages: llmMessages,
  });

  await appendChatMessage(session.id, "assistant", reply.content);

  if (session.title === "New chat" || session.title === input) {
    const nextTitle = input.length > 48 ? `${input.slice(0, 45)}...` : input;
    session = (await renameChatSession(session.id, nextTitle)) ?? session;
  }

  return {
    session,
    reply: {
      role: "assistant",
      content: reply.content,
      provider: reply.provider,
      model: reply.model,
      toolEvents: reply.toolEvents,
    },
    messages: await listChatMessages(session.id),
  };
}

