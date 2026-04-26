import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cacheAge } from "@/lib/cookie-store";

export async function GET() {
  const jar = await cookies();
  const edtSession = jar.get("edt-session")?.value;
  return NextResponse.json({
    authenticated: !!edtSession,
    cacheAgeSeconds: edtSession ? cacheAge(edtSession) : -1,
  });
}
