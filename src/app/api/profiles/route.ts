import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await db.select().from(profiles);
  return Response.json(data);
}
