#!/usr/bin/env node
// scripts/setup-db.js
// Usage: DATABASE_URL=postgresql://... node scripts/setup-db.js
//    or: set DATABASE_URL in your shell, then: npm run db:setup

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "❌  DATABASE_URL is not set.\n" +
    "    Run: DATABASE_URL=postgresql://user:pass@localhost:5432/mydb npm run db:setup"
  );
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString });
  try {
    console.log("Connecting to database…");
    const sql = fs.readFileSync(
      path.join(__dirname, "../sql/schema.sql"),
      "utf-8"
    );
    await pool.query(sql);
    console.log("✅  Schema applied successfully");
  } catch (err) {
    console.error("❌  Error applying schema:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
