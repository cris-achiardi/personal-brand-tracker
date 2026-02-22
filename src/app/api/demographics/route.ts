import { db } from "@/lib/db/client";
import { demographicsSnapshots } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await db.select().from(demographicsSnapshots);
  return Response.json(data);
}
