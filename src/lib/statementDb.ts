import { neon } from "@neondatabase/serverless";
import { AppUser, StatementSession, StatementSessionInput, UserRole } from "@/types";
import { getDatabaseUrl } from "./db";
import { isStatementOwner } from "./statement";
import { getRequestUser } from "./personalDb";

/**
 * Statement analyses live only in Neon. Each row is one named session with its
 * parsed transactions stored as JSONB, so editing a category is a single row update.
 */
function getSql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("Statement analyses need DATABASE_URL (Neon) to be set");
  return neon(url);
}

let tableReady: Promise<void> | null = null;

function ensureTable() {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS statement_sessions (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     VARCHAR(32) NOT NULL,
          name        TEXT NOT NULL,
          file_name   TEXT NOT NULL DEFAULT '',
          days        INTEGER NOT NULL CHECK (days >= 1),
          end_date    DATE NOT NULL,
          txns        JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS statement_sessions_user_idx ON statement_sessions (user_id, created_at DESC)`;
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

/** The logged-in user, but only if they own the statement analyzer. */
export async function getStatementOwner(req: Request): Promise<AppUser | null> {
  const user = await getRequestUser(req);
  return user && isStatementOwner(user.email) ? user : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSession(r: any): StatementSession {
  return {
    id: r.id,
    name: r.name,
    fileName: r.file_name,
    days: Number(r.days),
    endDate: r.end_date_text,
    txns: r.txns ?? [],
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export async function listStatementSessions(userId: UserRole): Promise<StatementSession[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT *, to_char(end_date, 'YYYY-MM-DD') AS end_date_text
    FROM statement_sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows.map(toSession);
}

export async function createStatementSession(userId: UserRole, s: StatementSessionInput): Promise<StatementSession> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO statement_sessions (user_id, name, file_name, days, end_date, txns)
    VALUES (${userId}, ${s.name}, ${s.fileName}, ${s.days}, ${s.endDate}, ${JSON.stringify(s.txns)}::jsonb)
    RETURNING *, to_char(end_date, 'YYYY-MM-DD') AS end_date_text
  `;
  return toSession(rows[0]);
}

export async function updateStatementSession(
  userId: UserRole,
  id: string,
  s: StatementSessionInput
): Promise<StatementSession | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    UPDATE statement_sessions SET
      name = ${s.name}, file_name = ${s.fileName}, days = ${s.days}, end_date = ${s.endDate},
      txns = ${JSON.stringify(s.txns)}::jsonb, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *, to_char(end_date, 'YYYY-MM-DD') AS end_date_text
  `;
  return rows[0] ? toSession(rows[0]) : null;
}

export async function deleteStatementSession(userId: UserRole, id: string): Promise<boolean> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`DELETE FROM statement_sessions WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}
