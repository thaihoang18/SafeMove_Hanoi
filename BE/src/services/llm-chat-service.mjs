import { chatTools, executeChatTool } from "./chat-tools.mjs";

const baseUrl = process.env.LLM_BASE_URL?.trim() || "http://127.0.0.1:11434/v1";
const apiKey = process.env.LLM_API_KEY?.trim() || "ollama";
const model = process.env.LLM_MODEL?.trim() || "qwen2.5:7b";
const provider = process.env.LLM_PROVIDER?.trim() || "ollama";

const systemPrompt = `You are SafeMove HaNoi AI, an AQI assistant inside an air-pollution route and health app.

Rules:
- Answer in Vietnamese unless the user clearly writes in another language.
- Use tool data whenever the question depends on AQI, profile, alerts, locations, or SafeMove HaNoi app state.
- Do not invent AQI values, routes, medical facts, or notifications.
- If tool data is missing, say what is missing.
- Give practical, concise guidance.
- For health-related questions, avoid diagnosis and focus on caution, exposure reduction, and app data.`;

export async function generateChatReply({ userId, messages }) {
  const conversation = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    return await runToolCallingLoop({ userId, messages: conversation });
  } catch (error) {
    return {
      content: buildFallbackReply(error),
      toolEvents: [],
      provider,
      model,
    };
  }
}

async function runToolCallingLoop({ userId, messages }) {
  const toolEvents = [];
  const workingMessages = [...messages];

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: workingMessages,
        tools: chatTools,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`);
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message;
    if (!message) {
      throw new Error("LLM returned no message.");
    }

    if (!message.tool_calls?.length) {
      return {
        content: message.content?.trim() || "Tôi chưa có câu trả lời phù hợp.",
        toolEvents,
        provider,
        model,
      };
    }

    workingMessages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function?.name;
      const rawArguments = toolCall.function?.arguments || "{}";
      const parsedArguments = safeJsonParse(rawArguments);
      const result = await executeChatTool(toolName, { ...parsedArguments, userId });
      const serialized = JSON.stringify(result);

      toolEvents.push({
        name: toolName,
        arguments: parsedArguments,
        result,
      });

      workingMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: serialized,
      });
    }
  }

  throw new Error("LLM tool loop exceeded the maximum number of iterations.");
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function buildFallbackReply(error) {
  const reason = error instanceof Error ? error.message : "unknown error";
  return `Chat AI hiện chưa kết nối được tới model server (${reason}). Nếu bạn đang dùng Ollama local, hãy bật Ollama và pull model trước, ví dụ: ollama pull qwen2.5:7b`;
}

