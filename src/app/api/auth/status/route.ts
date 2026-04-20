import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cacheAge } from "@/lib/cookie-store";

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    authenticated: jar.has("edt-session"),
    cacheAgeSeconds: cacheAge(),
  });
}
