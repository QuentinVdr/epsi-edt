import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { invalidateCourseCache as clearEdtCookie } from "@/lib/cookie-store";

export async function POST() {
  const jar = await cookies();
  jar.delete("edt-session");
  clearEdtCookie();
  return NextResponse.json({ ok: true });
}
