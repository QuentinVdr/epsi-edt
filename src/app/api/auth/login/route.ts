import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateWithCAS } from "@/lib/cas-auth";
import { invalidateCourseCache } from "@/lib/cookie-store";

export async function POST(request: Request) {
  let username: string;
  let password: string;

  try {
    const body = await request.json();
    username = body.username?.trim();
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "Nom d'utilisateur et mot de passe requis." },
      { status: 400 },
    );
  }

  try {
    const edtCookie = await authenticateWithCAS(username, password);
    const jar = await cookies();
    jar.set("edt-session", edtCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });
    invalidateCourseCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur d'authentification inconnue.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
