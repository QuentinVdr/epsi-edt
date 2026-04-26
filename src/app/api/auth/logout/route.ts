import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { invalidateCourseCache } from "@/lib/cookie-store";

export async function POST() {
  const jar = await cookies();
  const edtSession = jar.get("edt-session")?.value;
  jar.delete("edt-session");
  invalidateCourseCache(edtSession);
  return NextResponse.json({ ok: true });
}
