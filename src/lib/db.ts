import { neon } from "@neondatabase/serverless";
import { Expense, Settlement, AppSettings, AppUser, UserRole, UserPublicProfile } from "@/types";
import { DEFAULT_SETTINGS, INITIAL_SAMPLE_EXPENSES, INITIAL_USERS } from "./utils";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".app-data.json");

interface LocalData {
  users: AppUser[];
  sessions: { token: string; userId: UserRole; expiresAt: string }[];
  expenses: Expense[];
  settlements: Settlement[];
  settings: AppSettings;
}

function getLocalData(): LocalData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_USERS;
      }
      if (!parsed.sessions) {
        parsed.sessions = [];
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading local data file:", err);
  }

  const initial: LocalData = {
    users: INITIAL_USERS,
    sessions: [],
    expenses: INITIAL_SAMPLE_EXPENSES,
    settlements: [],
    settings: DEFAULT_SETTINGS,
  };
  saveLocalData(initial);
  return initial;
}

function saveLocalData(data: LocalData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local data:", err);
  }
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
}

/**
 * Initialize Neon DB tables including users & sessions and seed initial users if empty
 */
export async function initNeonDb(connectionString?: string) {
  const connStr = connectionString || getDatabaseUrl();
  if (!connStr) return false;

  try {
    const sql = neon(connStr);
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(50) DEFAULT '🧑🏻‍💻',
        is_email_verified BOOLEAN DEFAULT FALSE,
        verification_otp VARCHAR(20),
        otp_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      );
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `;

    // Create expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        category VARCHAR(64) NOT NULL,
        date VARCHAR(32) NOT NULL,
        paid_by VARCHAR(32) NOT NULL,
        split_type VARCHAR(32) NOT NULL,
        user1_amount NUMERIC(12, 2) NOT NULL,
        user2_amount NUMERIC(12, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Create settlements table
    await sql`
      CREATE TABLE IF NOT EXISTS settlements (
        id VARCHAR(64) PRIMARY KEY,
        from_user VARCHAR(32) NOT NULL,
        to_user VARCHAR(32) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        date VARCHAR(32) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(32) PRIMARY KEY DEFAULT 'current',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Seed default users if users table is empty
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users;`;
    if (Number(existingUsers[0]?.count || 0) === 0) {
      for (const u of INITIAL_USERS) {
        await sql`
          INSERT INTO users (id, name, email, password_hash, avatar, is_email_verified, created_at)
          VALUES (${u.id}, ${u.name}, ${u.email}, ${u.passwordHash}, ${u.avatar}, ${u.isEmailVerified}, ${u.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    return true;
  } catch (err) {
    console.error("Neon DB Init error:", err);
    return false;
  }
}

/* =========================================================
   USER & AUTH DATABASE METHODS (STRICT 2-USER CAPACITY)
   ========================================================= */

export async function getAllUsers(): Promise<AppUser[]> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      const rows = await sql`SELECT * FROM users ORDER BY created_at ASC;`;
      return rows.map((r: any) => ({
        id: r.id as UserRole,
        name: r.name,
        email: r.email,
        passwordHash: r.password_hash,
        avatar: r.avatar || "🧑🏻‍💻",
        isEmailVerified: !!r.is_email_verified,
        verificationOtp: r.verification_otp,
        otpExpiresAt: r.otp_expires_at ? new Date(r.otp_expires_at).toISOString() : undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
      }));
    } catch (err) {
      console.warn("Neon DB users query failed, using local store:", err);
    }
  }

  const local = getLocalData();
  return local.users || [];
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export async function getUserById(id: UserRole): Promise<AppUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export async function saveUser(user: AppUser): Promise<AppUser> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      await sql`
        INSERT INTO users (
          id, name, email, password_hash, avatar, is_email_verified, verification_otp, otp_expires_at, created_at, last_login_at
        ) VALUES (
          ${user.id}, ${user.name}, ${user.email}, ${user.passwordHash}, ${user.avatar}, 
          ${user.isEmailVerified}, ${user.verificationOtp || null}, ${user.otpExpiresAt || null}, 
          ${user.createdAt}, ${user.lastLoginAt || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          avatar = EXCLUDED.avatar,
          is_email_verified = EXCLUDED.is_email_verified,
          verification_otp = EXCLUDED.verification_otp,
          otp_expires_at = EXCLUDED.otp_expires_at,
          last_login_at = EXCLUDED.last_login_at;
      `;
    } catch (err) {
      console.warn("Neon DB save user failed, saving locally:", err);
    }
  }

  const local = getLocalData();
  const idx = local.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    local.users[idx] = user;
  } else {
    if (local.users.length >= 2) {
      throw new Error("Duo space is full. Maximum 2 users allowed.");
    }
    local.users.push(user);
  }
  saveLocalData(local);
  return user;
}

export async function createSession(userId: UserRole): Promise<string> {
  const token = `nst_${Date.now()}_${Math.random().toString(36).substr(2, 16)}_${Math.random().toString(36).substr(2, 16)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      await sql`
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (${token}, ${userId}, ${expiresAt});
      `;
    } catch (err) {
      console.warn("Neon DB session save failed, saving locally:", err);
    }
  }

  const local = getLocalData();
  if (!local.sessions) local.sessions = [];
  local.sessions.push({ token, userId, expiresAt });
  saveLocalData(local);
  return token;
}

export async function validateSession(token: string): Promise<AppUser | null> {
  if (!token) return null;

  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        SELECT u.* FROM users u
        JOIN sessions s ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW();
      `;
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id as UserRole,
          name: r.name,
          email: r.email,
          passwordHash: r.password_hash,
          avatar: r.avatar || "🧑🏻‍💻",
          isEmailVerified: !!r.is_email_verified,
          verificationOtp: r.verification_otp,
          otpExpiresAt: r.otp_expires_at ? new Date(r.otp_expires_at).toISOString() : undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
        };
      }
    } catch (err) {
      console.warn("Neon DB session validate failed, checking local:", err);
    }
  }

  const local = getLocalData();
  const session = (local.sessions || []).find(
    (s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now()
  );
  if (!session) return null;

  return local.users.find((u) => u.id === session.userId) || null;
}

export async function deleteSession(token: string): Promise<boolean> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      await sql`DELETE FROM sessions WHERE token = ${token};`;
    } catch (err) {
      console.warn("Neon DB session delete failed:", err);
    }
  }

  const local = getLocalData();
  if (local.sessions) {
    local.sessions = local.sessions.filter((s) => s.token !== token);
    saveLocalData(local);
  }
  return true;
}

/* =========================================================
   EXPENSES, SETTLEMENTS & SETTINGS METHODS
   ========================================================= */

export async function getExpenses(): Promise<Expense[]> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      const rows = await sql`
        SELECT * FROM expenses ORDER BY date DESC, created_at DESC;
      `;
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        amount: Number(r.amount),
        currency: r.currency || "INR",
        category: r.category,
        date: r.date,
        paidBy: r.paid_by,
        splitType: r.split_type,
        user1Amount: Number(r.user1_amount),
        user2Amount: Number(r.user2_amount),
        notes: r.notes || "",
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("Neon DB query failed, using local cache:", err);
    }
  }

  const local = getLocalData();
  return (local.expenses || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveExpense(expense: Expense): Promise<Expense> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      await sql`
        INSERT INTO expenses (
          id, title, amount, currency, category, date, paid_by, split_type, user1_amount, user2_amount, notes, created_at
        ) VALUES (
          ${expense.id}, ${expense.title}, ${expense.amount}, ${expense.currency}, 
          ${expense.category}, ${expense.date}, ${expense.paidBy}, ${expense.splitType}, 
          ${expense.user1Amount}, ${expense.user2Amount}, ${expense.notes || ""}, ${expense.createdAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          category = EXCLUDED.category,
          date = EXCLUDED.date,
          paid_by = EXCLUDED.paid_by,
          split_type = EXCLUDED.split_type,
          user1_amount = EXCLUDED.user1_amount,
          user2_amount = EXCLUDED.user2_amount,
          notes = EXCLUDED.notes,
          updated_at = NOW();
      `;
    } catch (err) {
      console.warn("Neon DB save failed, saving locally:", err);
    }
  }

  const local = getLocalData();
  if (!local.expenses) local.expenses = [];
  const idx = local.expenses.findIndex((e) => e.id === expense.id);
  if (idx >= 0) {
    local.expenses[idx] = expense;
  } else {
    local.expenses.unshift(expense);
  }
  saveLocalData(local);
  return expense;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      await sql`DELETE FROM expenses WHERE id = ${id};`;
    } catch (err) {
      console.warn("Neon DB delete failed:", err);
    }
  }

  const local = getLocalData();
  local.expenses = (local.expenses || []).filter((e) => e.id !== id);
  saveLocalData(local);
  return true;
}

export async function getSettlements(): Promise<Settlement[]> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`SELECT * FROM settlements ORDER BY date DESC, created_at DESC;`;
      return rows.map((r: any) => ({
        id: r.id,
        fromUser: r.from_user,
        toUser: r.to_user,
        amount: Number(r.amount),
        currency: r.currency || "INR",
        date: r.date,
        notes: r.notes || "",
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("Neon DB settlements fetch failed:", err);
    }
  }

  const local = getLocalData();
  return local.settlements || [];
}

export async function saveSettlement(settlement: Settlement): Promise<Settlement> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      await sql`
        INSERT INTO settlements (
          id, from_user, to_user, amount, currency, date, notes, created_at
        ) VALUES (
          ${settlement.id}, ${settlement.fromUser}, ${settlement.toUser}, 
          ${settlement.amount}, ${settlement.currency}, ${settlement.date}, 
          ${settlement.notes || ""}, ${settlement.createdAt}
        );
      `;
    } catch (err) {
      console.warn("Neon DB settlement save failed:", err);
    }
  }

  const local = getLocalData();
  if (!local.settlements) local.settlements = [];
  local.settlements.unshift(settlement);
  saveLocalData(local);
  return settlement;
}

export async function deleteSettlement(id: string): Promise<boolean> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      await sql`DELETE FROM settlements WHERE id = ${id};`;
    } catch (err) {
      console.warn("Neon DB settlement delete failed:", err);
    }
  }

  const local = getLocalData();
  local.settlements = (local.settlements || []).filter((s) => s.id !== id);
  saveLocalData(local);
  return true;
}

export async function getSettings(): Promise<AppSettings> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`SELECT data FROM app_settings WHERE id = 'current';`;
      if (rows && rows.length > 0) {
        return {
          ...DEFAULT_SETTINGS,
          ...rows[0].data,
          neonDbConnected: true,
        };
      }
    } catch (err) {
      console.warn("Neon DB settings fetch failed:", err);
    }
  }

  const local = getLocalData();
  return {
    ...DEFAULT_SETTINGS,
    ...local.settings,
    neonDbConnected: !!connStr,
  };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const connStr = getDatabaseUrl();
  if (connStr) {
    try {
      await initNeonDb(connStr);
      const sql = neon(connStr);
      await sql`
        INSERT INTO app_settings (id, data, updated_at)
        VALUES ('current', ${JSON.stringify(settings)}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    } catch (err) {
      console.warn("Neon DB settings save failed:", err);
    }
  }

  const local = getLocalData();
  local.settings = settings;
  saveLocalData(local);
  return settings;
}
