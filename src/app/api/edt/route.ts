import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getCachedCourses, getCachedAt, setCachedCourses } from "@/lib/cookie-store";
import type { EdtResponse } from "@/types/edt";

const EDT_API =
  "https://ws-edt-cd.wigorservices.net/Home/Get?sort=&group=&filter=&dateDebut=2025-12-31T23%3A00%3A00.000Z&dateFin=2026-12-31T23%3A00%3A00.000Z";

async function loadAllCourses(cookie: string) {
  if (!cookie) throw new Error("NOT_AUTHENTICATED");

  const res = await fetch(EDT_API, {
    headers: {
      Cookie: cookie,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  // Wigor redirects to the login page (HTML) when the cookie is expired
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error("COOKIE_EXPIRED");
  }

  const data: EdtResponse = await res.json();
  return data.Data ?? [];
}

export async function GET(request: NextRequest) {
  const jar = await cookies();
  const edtSession = jar.get("edt-session")?.value;
  if (!edtSession) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const dateDebut = searchParams.get("dateDebut");
  const dateFin = searchParams.get("dateFin");

  try {
    // Serve from in-memory cache when available — keyed by cookie to prevent
    // cross-student data leaks on a shared server process.
    let all = getCachedCourses(edtSession);
    if (!all) {
      all = await loadAllCourses(edtSession);
      setCachedCourses(all, edtSession);
    }

    const courses =
      dateDebut && dateFin
        ? all.filter((c) => {
            const t = new Date(c.Start).getTime();
            return (
              t >= new Date(dateDebut).getTime() &&
              t <= new Date(dateFin).getTime()
            );
          })
        : all;

    return NextResponse.json({
      Data: courses,
      Total: courses.length,
      _totalCached: all.length,
      _fetchedAt: new Date(getCachedAt()).toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "NOT_AUTHENTICATED" || msg === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
