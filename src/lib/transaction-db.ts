import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Neon's WebSocket driver is required for interactive SQL transactions.
// Keep it isolated from everyday storefront and account queries.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const transactionDb = drizzle(pool, { schema });
