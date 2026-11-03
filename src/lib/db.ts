import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

/** Neon's URLs say sslmode=require, which pg now reads as verify-full and warns about on every connection. Say it outright. */
function connectionString() {
  return (process.env.DATABASE_URL ?? "").replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/, "$1verify-full");
}

// A sleeping Neon database can time out while a connection signs in ("Authentication timed out"). The query never ran,
// so it is safe to try once more. A dropped connection is retried for reads only.
const CONNECT_FAIL = /Authentication timed out|08P01|DatabaseNotReachable|timeout exceeded when trying to connect/i;
const DROPPED = /Connection terminated unexpectedly|ConnectionClosed|ECONNRESET/i;
const READS = /^(find|count|aggregate|groupBy)/;

function retryable(e: unknown, operation: string) {
  // Prisma keeps the driver's own error under meta.driverAdapterError.
  const err = e as { message?: string; meta?: unknown };
  const text = `${err?.message ?? ""} ${JSON.stringify(err?.meta ?? null)}`;
  return CONNECT_FAIL.test(text) || (DROPPED.test(text) && READS.test(operation));
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: connectionString(), connectionTimeoutMillis: 15_000 });
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args);
        } catch (e) {
          if (!retryable(e, operation)) throw e;
          console.warn(`[db] ${operation} retried after connection error`);
          await new Promise((done) => setTimeout(done, 800));
          return query(args);
        }
      },
    },
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
