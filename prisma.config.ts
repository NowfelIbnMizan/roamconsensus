import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection on Neon; the app itself uses the pooled DATABASE_URL.
    // Vercel previews get their own Neon branch from the Neon integration (DATABASE_URL and DATABASE_URL_UNPOOLED
    // per git branch), so a preview migrates that branch, not the live database the app there no longer reads.
    url:
      (process.env.VERCEL_ENV === "preview" ? process.env.DATABASE_URL_UNPOOLED : undefined) ??
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "",
  },
});
