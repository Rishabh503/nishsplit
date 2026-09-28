import { NextResponse } from "next/server";
import { initNeonDb, getExpenses, getSettlements, getSettings } from "@/lib/db";
import { neon } from "@neondatabase/serverless";

export async function POST(req: Request) {
  try {
    const { connectionString, migrate } = await req.json();

    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: "Connection string is required" },
        { status: 400 }
      );
    }

    // Test Neon connection and create schema
    const initialized = await initNeonDb(connectionString);
    if (!initialized) {
      return NextResponse.json(
        { success: false, error: "Could not connect to Neon PostgreSQL database. Please check your credentials." },
        { status: 400 }
      );
    }

    let migratedCount = 0;

    if (migrate) {
      // Push existing local expenses to Neon DB
      const localExpenses = await getExpenses();
      const localSettlements = await getSettlements();
      const localSettings = await getSettings();
      const sql = neon(connectionString);

      for (const exp of localExpenses) {
        await sql`
          INSERT INTO expenses (
            id, title, amount, currency, category, date, paid_by, split_type, user1_amount, user2_amount, notes, created_at
          ) VALUES (
            ${exp.id}, ${exp.title}, ${exp.amount}, ${exp.currency}, 
            ${exp.category}, ${exp.date}, ${exp.paidBy}, ${exp.splitType}, 
            ${exp.user1Amount}, ${exp.user2Amount}, ${exp.notes || ""}, ${exp.createdAt}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
        migratedCount++;
      }

      for (const set of localSettlements) {
        await sql`
          INSERT INTO settlements (
            id, from_user, to_user, amount, currency, date, notes, created_at
          ) VALUES (
            ${set.id}, ${set.fromUser}, ${set.toUser}, 
            ${set.amount}, ${set.currency}, ${set.date}, 
            ${set.notes || ""}, ${set.createdAt}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      await sql`
        INSERT INTO app_settings (id, data, updated_at)
        VALUES ('current', ${JSON.stringify(localSettings)}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Connected successfully to Neon DB! ${migrate ? `Migrated ${migratedCount} records.` : ""}`,
      migratedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect to Neon DB" },
      { status: 500 }
    );
  }
}
