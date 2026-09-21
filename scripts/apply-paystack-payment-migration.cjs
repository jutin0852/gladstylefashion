require("dotenv").config();
const fs = require("fs");
const { neon } = require("@neondatabase/serverless");

async function run() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = neon(process.env.DATABASE_URL);
  const statements = fs.readFileSync("drizzle/0007_paystack_payment_reference.sql", "utf8").split(";").map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log("Paystack payment-reference migration applied.");
}

run().catch((error) => { console.error(error); process.exit(1); });
