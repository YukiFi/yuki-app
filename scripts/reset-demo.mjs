#!/usr/bin/env node
// Wipe every row whose id starts with `demo_`. Safe to run any time;
// only touches data the seed script created.

import { readFileSync } from "node:fs";
import { Pool } from "pg";

const envPath = new URL("../.env.local", import.meta.url);
try {
  const txt = readFileSync(envPath, "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
} catch {}

if (!process.env.DATABASE_URL) {
  console.error("[reset-demo] DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Order matters: child tables first, then users.
    const tables = ["contacts", "deposits", "withdrawals", "handle_history"];
    for (const t of tables) {
      const r = await client.query(`DELETE FROM ${t} WHERE id LIKE 'demo_%'`);
      console.log(`[reset-demo] ${t}: deleted ${r.rowCount}`);
    }
    // contacts also reference users via contact_user_id; remove rows pointing to demo users.
    await client.query(
      `DELETE FROM contacts WHERE contact_user_id LIKE 'demo_%' OR user_id LIKE 'demo_%'`
    );
    const u = await client.query(`DELETE FROM users WHERE id LIKE 'demo_%'`);
    console.log(`[reset-demo] users: deleted ${u.rowCount}`);
    await client.query("COMMIT");
    console.log("[reset-demo] done.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[reset-demo] FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
