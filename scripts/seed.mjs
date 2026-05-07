#!/usr/bin/env node
// Seed Neon with demo data scoped to a single wallet address (the developer's).
// Usage:
//   pnpm db:seed [walletAddress]
//   SEED_WALLET=0x... pnpm db:seed
//
// Idempotent: re-running upserts the demo user, replaces this user's demo rows,
// and leaves other users alone. Demo rows are tagged with id prefix `demo_`
// so `pnpm db:reset` can wipe them cleanly.

import { readFileSync } from "node:fs";
import { Pool } from "pg";

// Load .env.local without bringing in dotenv as a dep.
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
} catch {
  // .env.local missing — assume env already set
}

const wallet =
  (process.argv[2] || process.env.SEED_WALLET || "").toLowerCase();

if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
  console.error(
    "[seed] Provide a wallet address. Usage: pnpm db:seed 0xYourSmartWalletAddress"
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("[seed] DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const YUSD_BASE = "0x4621b7a9c75199271f773ebd9a499dbd165c3191"; // adjust if your token differs

// Friend users to populate the contacts list.
const FRIENDS = [
  {
    suffix: "alice",
    address: "0x1111111111111111111111111111111111111111",
    username: "@alice_demo",
    display: "Alice (demo)",
    bio: "early yuki tester",
    avatar: null,
  },
  {
    suffix: "bob",
    address: "0x2222222222222222222222222222222222222222",
    username: "@bob_demo",
    display: "Bob (demo)",
    bio: null,
    avatar: null,
  },
  {
    suffix: "carla",
    address: "0x3333333333333333333333333333333333333333",
    username: "@carla_demo",
    display: "Carla (demo)",
    bio: "splits dinner the smart way",
    avatar: null,
  },
];

function toWei(usd) {
  // USDC has 6 decimals; we keep amounts as strings (numeric on-chain unit).
  return (BigInt(Math.round(usd * 1e6))).toString();
}

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- 1. Demo "me" user (linked to your real wallet) ---
    const meId = `demo_user_${wallet.slice(2, 10)}`;
    await client.query(
      `INSERT INTO users (id, wallet_address, auth_provider, email, username, display_name, bio, email_verified, created_at, updated_at)
       VALUES ($1, $2, 'alchemy', $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         wallet_address = EXCLUDED.wallet_address,
         email = COALESCE(users.email, EXCLUDED.email),
         updated_at = CURRENT_TIMESTAMP`,
      [meId, wallet, "demo@yuki.local", "@you_demo", "You (demo)", "this is your dev account"]
    );

    // --- 2. Friend users ---
    for (const f of FRIENDS) {
      const id = `demo_user_${f.suffix}`;
      await client.query(
        `INSERT INTO users (id, wallet_address, auth_provider, username, display_name, bio, email_verified, created_at, updated_at)
         VALUES ($1, $2, 'alchemy', $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           wallet_address = EXCLUDED.wallet_address,
           display_name = EXCLUDED.display_name,
           updated_at = CURRENT_TIMESTAMP`,
        [id, f.address, f.username, f.display, f.bio]
      );
    }

    // --- 3. Wipe + reseed THIS user's demo rows so script is idempotent ---
    await client.query(`DELETE FROM contacts WHERE user_id = $1 AND id LIKE 'demo_%'`, [meId]);
    await client.query(`DELETE FROM deposits WHERE user_id = $1 AND id LIKE 'demo_%'`, [meId]);
    await client.query(`DELETE FROM withdrawals WHERE user_id = $1 AND id LIKE 'demo_%'`, [meId]);

    // --- 4. Contacts: add all three friends ---
    for (const f of FRIENDS) {
      await client.query(
        `INSERT INTO contacts (id, user_id, contact_user_id, nickname, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [`demo_contact_${f.suffix}`, meId, `demo_user_${f.suffix}`, f.display]
      );
    }

    // --- 5. Deposits ---
    const deposits = [
      { id: "demo_dep_1", amount: 250.0,  status: "confirmed", days: 14, hash: "0xdep1deadbeef0000000000000000000000000000000000000000000000000001" },
      { id: "demo_dep_2", amount: 1000.0, status: "confirmed", days: 7,  hash: "0xdep2deadbeef0000000000000000000000000000000000000000000000000002" },
      { id: "demo_dep_3", amount: 50.5,   status: "pending",   days: 0,  hash: null },
    ];
    for (const d of deposits) {
      await client.query(
        `INSERT INTO deposits (id, user_id, wallet_address, tx_hash, amount_wei, token_address, status, created_at, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          d.id, meId, wallet, d.hash, toWei(d.amount), USDC_BASE, d.status,
          daysAgo(d.days),
          d.status === "confirmed" ? daysAgo(d.days) : null,
        ]
      );
    }

    // --- 6. Withdrawals ---
    const withdrawals = [
      { id: "demo_wd_1", amount: 75.0,  status: "completed", days: 5, dest: FRIENDS[0].address, hash: "0xwd1deadbeef00000000000000000000000000000000000000000000000000001" },
      { id: "demo_wd_2", amount: 200.0, status: "pending",   days: 0, dest: FRIENDS[1].address, hash: null },
    ];
    for (const w of withdrawals) {
      await client.query(
        `INSERT INTO withdrawals (id, user_id, wallet_address, tx_hash, amount_wei, token_address, destination_address, status, created_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          w.id, meId, wallet, w.hash, toWei(w.amount), USDC_BASE,
          w.dest, w.status, daysAgo(w.days),
          w.status === "completed" ? daysAgo(w.days) : null,
        ]
      );
    }

    await client.query("COMMIT");
    console.log("[seed] OK — wallet:", wallet);
    console.log("[seed]   demo user id:", meId);
    console.log("[seed]   friends:", FRIENDS.map(f => f.username).join(", "));
    console.log("[seed]   deposits:", deposits.length, "  withdrawals:", withdrawals.length);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[seed] FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
