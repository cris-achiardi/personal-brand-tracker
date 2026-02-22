import { db } from "@/lib/db/client";
import { postEngagementHighlights } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await db.select().from(postEngagementHighlights);
  return Response.json(data);
}
