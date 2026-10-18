import { NextRequest } from "next/server";
import { GET as runDueSources } from "../../admin/ingestion/run-due/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runDueSources(request);
}

export async function POST(request: NextRequest) {
  return runDueSources(request);
}
