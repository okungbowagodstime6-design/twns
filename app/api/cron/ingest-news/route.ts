import { NextRequest, NextResponse } from "next/server";
import { POST as runDueSources } from "@/app/api/admin/ingestion/run-due/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runDueSources(request);
}

export async function POST(request: NextRequest) {
  return runDueSources(request);
}
