import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

function init(): NeonHttpDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon Postgres (Vercel Marketplace) and add it to .env.local / Vercel env.",
    );
  }
  return drizzle(neon(connectionString), { schema });
}

/** נוצר בעצלתיים — כדי ש-build לא ידרוש DATABASE_URL */
export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_t, prop) {
      if (!_db) _db = init();
      // @ts-expect-error dynamic passthrough
      const value = _db[prop];
      return typeof value === "function" ? value.bind(_db) : value;
    },
  },
);

export { schema };
