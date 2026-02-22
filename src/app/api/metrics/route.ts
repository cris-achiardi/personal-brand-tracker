import { db } from "@/lib/db/client";
import { dailyMetrics } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await db.select().from(dailyMetrics).orderBy(asc(dailyMetrics.date));
  return Response.json(data);
}
