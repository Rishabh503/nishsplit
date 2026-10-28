import { neon } from "@neondatabase/serverless";
import { AppUser, PersonalExpense, PersonalExpenseInput, UserRole } from "@/types";
import { getDatabaseUrl, validateSession } from "./db";

/**
 * Personal expenses live only in Neon (no local JSON fallback), one list per user.
 */
function getSql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("Personal expenses need DATABASE_URL (Neon) to be set");
  return neon(url);
}

let tableReady: Promise<void> | null = null;

function ensureTable() {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS personal_expenses (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     VARCHAR(32),
          title       TEXT NOT NULL,
          amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
          method      TEXT NOT NULL CHECK (method IN ('cash', 'upi')),
          spent_on    DATE NOT NULL DEFAULT CURRENT_DATE,
          is_split    BOOLEAN NOT NULL DEFAULT FALSE,
          people      INTEGER NOT NULL DEFAULT 1 CHECK (people >= 1),
          my_share    NUMERIC(12, 2) NOT NULL CHECK (my_share >= 0),
          paid_by_me  BOOLEAN NOT NULL DEFAULT TRUE,
          settled     BOOLEAN NOT NULL DEFAULT TRUE,
          split_with  TEXT NOT NULL DEFAULT '',
          note        TEXT NOT NULL DEFAULT '',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // The table may already exist from the standalone version, which had no user_id.
      await sql`ALTER TABLE personal_expenses ADD COLUMN IF NOT EXISTS user_id VARCHAR(32)`;
      await sql`CREATE INDEX IF NOT EXISTS personal_expenses_user_idx ON personal_expenses (user_id, spent_on DESC)`;
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

/** Reads the "Authorization: Bearer <session token>" header and returns the logged-in user. */
export async function getRequestUser(req: Request): Promise<AppUser | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token ? validateSession(token) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPersonalExpense(r: any): PersonalExpense {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    amount: Number(r.amount),
    method: r.method,
    spentOn: r.spent_on_text,
    isSplit: r.is_split,
    people: Number(r.people),
    myShare: Number(r.my_share),
    paidByMe: r.paid_by_me,
    settled: r.settled,
    splitWith: r.split_with,
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function listPersonalExpenses(userId: UserRole): Promise<PersonalExpense[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT *, to_char(spent_on, 'YYYY-MM-DD') AS spent_on_text
    FROM personal_expenses
    WHERE user_id = ${userId}
    ORDER BY spent_on DESC, created_at DESC
  `;
  return rows.map(toPersonalExpense);
}

export async function createPersonalExpense(userId: UserRole, e: PersonalExpenseInput): Promise<PersonalExpense> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO personal_expenses
      (user_id, title, amount, method, spent_on, is_split, people, my_share, paid_by_me, settled, split_with, note)
    VALUES
      (${userId}, ${e.title}, ${e.amount}, ${e.method}, ${e.spentOn}, ${e.isSplit}, ${e.people},
       ${e.myShare}, ${e.paidByMe}, ${e.settled}, ${e.splitWith}, ${e.note})
    RETURNING *, to_char(spent_on, 'YYYY-MM-DD') AS spent_on_text
  `;
  return toPersonalExpense(rows[0]);
}

export async function updatePersonalExpense(
  userId: UserRole,
  id: string,
  e: PersonalExpenseInput
): Promise<PersonalExpense | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    UPDATE personal_expenses SET
      title = ${e.title}, amount = ${e.amount}, method = ${e.method}, spent_on = ${e.spentOn},
      is_split = ${e.isSplit}, people = ${e.people}, my_share = ${e.myShare},
      paid_by_me = ${e.paidByMe}, settled = ${e.settled}, split_with = ${e.splitWith}, note = ${e.note}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *, to_char(spent_on, 'YYYY-MM-DD') AS spent_on_text
  `;
  return rows[0] ? toPersonalExpense(rows[0]) : null;
}

export async function setPersonalSettled(userId: UserRole, id: string, settled: boolean): Promise<PersonalExpense | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    UPDATE personal_expenses SET settled = ${settled}
    WHERE id = ${id} AND user_id = ${userId} AND is_split = TRUE
    RETURNING *, to_char(spent_on, 'YYYY-MM-DD') AS spent_on_text
  `;
  return rows[0] ? toPersonalExpense(rows[0]) : null;
}

export async function deletePersonalExpense(userId: UserRole, id: string): Promise<boolean> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`DELETE FROM personal_expenses WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}
