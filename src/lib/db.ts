import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Normal storefront and account queries use HTTP, which works locally and in
// serverless routes. Interactive transactions live in transaction-db.ts.
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });
