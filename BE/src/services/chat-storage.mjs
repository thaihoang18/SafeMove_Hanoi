import { sql } from "../db.mjs";

let schemaReadyPromise;

function ensureChatSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        create table if not exists airpath.chat_sessions (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references airpath.users(id) on delete cascade,
          title text not null default 'New chat',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;

      await sql`
        create table if not exists airpath.chat_messages (
          id uuid primary key default gen_random_uuid(),
          session_id uuid not null references airpath.chat_sessions(id) on delete cascade,
          role text not null check (role in ('system', 'user', 'assistant', 'tool')),
          content text not null,
          tool_name text,
          created_at timestamptz not null default now()
        )
      `;

      await sql`
        create index if not exists idx_chat_sessions_user_updated
        on airpath.chat_sessions(user_id, updated_at desc)
      `;

      await sql`
        create index if not exists idx_chat_messages_session_time
        on airpath.chat_messages(session_id, created_at asc)
      `;
    })();
  }

  return schemaReadyPromise;
}

export async function createChatSession(userId, title = "New chat") {
  await ensureChatSchema();

  const [session] = await sql`
    insert into airpath.chat_sessions (user_id, title)
    values (${userId}, ${title})
    returning *
  `;

  return session;
}

export async function listChatSessions(userId) {
  await ensureChatSchema();

  return sql`
    select
      s.id,
      s.user_id,
      s.title,
      s.created_at,
      s.updated_at,
      (
        select content
        from airpath.chat_messages m
        where m.session_id = s.id
        order by m.created_at desc
        limit 1
      ) as last_message
    from airpath.chat_sessions s
    where s.user_id = ${userId}
    order by s.updated_at desc
  `;
}

export async function getChatSession(sessionId) {
  await ensureChatSchema();

  const rows = await sql`
    select *
    from airpath.chat_sessions
    where id = ${sessionId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function listChatMessages(sessionId) {
  await ensureChatSchema();

  return sql`
    select id, session_id, role, content, tool_name, created_at
    from airpath.chat_messages
    where session_id = ${sessionId}
    order by created_at asc
  `;
}

export async function appendChatMessage(sessionId, role, content, toolName = null) {
  await ensureChatSchema();

  const [message] = await sql`
    insert into airpath.chat_messages (session_id, role, content, tool_name)
    values (${sessionId}, ${role}, ${content}, ${toolName})
    returning *
  `;

  await sql`
    update airpath.chat_sessions
    set updated_at = now()
    where id = ${sessionId}
  `;

  return message;
}

export async function renameChatSession(sessionId, title) {
  await ensureChatSchema();

  const [session] = await sql`
    update airpath.chat_sessions
    set
      title = ${title},
      updated_at = now()
    where id = ${sessionId}
    returning *
  `;

  return session ?? null;
}

