import { createHmac } from "node:crypto";
import { connectDb } from "@/lib/db";
import { requireAuthSecret } from "@/lib/env";
import { RateLimit } from "@/models";

export function requestAddress(request: Request) {
  // On Vercel, x-real-ip is set by the edge proxy. Avoid trusting arbitrary forwarded chains.
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function digest(value: string) {
  return createHmac("sha256", requireAuthSecret()).update(value).digest("hex");
}

export async function takeRateLimit(scope: string, identity: string, maximum: number, windowMs: number) {
  await connectDb();
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);
  const keyHash = digest(identity);
  const windowEnd = new Date(now.getTime() + windowMs);
  await RateLimit.updateOne(
    { scope, keyHash },
    [
      {
        $set: {
          count: { $cond: [{ $lt: ["$windowStart", cutoff] }, 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }] },
          windowStart: { $cond: [{ $lt: ["$windowStart", cutoff] }, now, { $ifNull: ["$windowStart", now] }] },
          expiresAt: { $cond: [{ $lt: ["$windowStart", cutoff] }, windowEnd, { $ifNull: ["$expiresAt", windowEnd] }] },
          scope,
          keyHash,
        },
      },
    ],
    { upsert: true, updatePipeline: true },
  );
  const record = await RateLimit.findOne({ scope, keyHash }).lean();
  return {
    allowed: (record?.count ?? 0) <= maximum,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(((record?.windowStart?.getTime() ?? now.getTime()) + windowMs - now.getTime()) / 1000),
    ),
  };
}
