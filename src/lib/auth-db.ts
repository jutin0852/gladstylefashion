import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Better Auth performs single statements, so the HTTP driver is the most
// reliable choice in local Node/WSL development and Vercel functions.
const sql = neon(process.env.DATABASE_URL!);
export const authDb = drizzle({ client: sql, schema });
