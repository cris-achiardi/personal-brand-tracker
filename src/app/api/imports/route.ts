import { db } from "@/lib/db/client";
import { imports } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await db.select().from(imports).orderBy(desc(imports.createdAt));
  return Response.json(data);
}
