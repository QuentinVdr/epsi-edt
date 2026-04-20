/**
 * Server-side CAS authentication flow:
 *
 * 1. GET https://ws-edt-cd.wigorservices.net/
 *    → 302 to https://cas-p.wigorservices.net/cas/login?service=...&state=STATE
 *    (captures Wigor correlation cookie)
 *
 * 2. GET the CAS login page → extract hidden "execution" token
 *
 * 3. POST username + password + execution to CAS
 *    → 302 to https://ws-edt-cd.wigorservices.net/signin-cas?state=STATE&ticket=ST-xxx
 *
 * 4. GET Wigor's signin-cas endpoint (with correlation cookie)
 *    → Wigor validates ticket with CAS, sets .WS-EDT.CAS cookie
 *    → We capture that Set-Cookie header
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BASE_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

// Minimal cookie jar — parses Set-Cookie, builds Cookie header
class CookieJar {
  private store = new Map<string, string>();

  ingest(setCookieStr: string): void {
    const nameValue = setCookieStr.split(";")[0].trim();
    const eq = nameValue.indexOf("=");
    if (eq === -1) return;
    this.store.set(
      nameValue.slice(0, eq).trim(),
      nameValue.slice(eq + 1).trim(),
    );
  }

  ingestAll(headers: Headers): void {
    const cookies =
      typeof (headers as any).getSetCookie === "function"
        ? (headers as any).getSetCookie()
        : (headers.get("set-cookie") ?? "").split(/,(?=[^ ])/).filter(Boolean);
    for (const c of cookies) this.ingest(c);
  }

  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get(name: string): string | undefined {
    return this.store.get(name);
  }
}

function abs(location: string, base: string): string {
  return location.startsWith("http") ? location : new URL(location, base).href;
}

export async function authenticateWithCAS(
  username: string,
  password: string,
): Promise<string> {
  const jar = new CookieJar();

  // ── Step 1: hit Wigor login, follow redirects until we reach CAS ──────────
  let casUrl: string | null = null;
  let cur = "https://ws-edt-cd.wigorservices.net/";

  for (let i = 0; i < 6; i++) {
    const res = await fetch(cur, {
      redirect: "manual",
      headers: { ...BASE_HEADERS, Cookie: jar.header() },
    });
    jar.ingestAll(res.headers);

    if (res.status >= 300 && res.status < 400) {
      const loc = abs(res.headers.get("location") ?? "", cur);
      if (loc.includes("cas-p.wigorservices.net")) {
        casUrl = loc;
        break;
      }
      cur = loc;
    } else {
      break;
    }
  }

  if (!casUrl) throw new Error("Impossible de joindre le serveur CAS Wigor.");

  // ── Step 2: GET CAS login page, extract execution token ───────────────────
  const casPage = await fetch(casUrl, {
    headers: { ...BASE_HEADERS, Cookie: jar.header() },
  });
  jar.ingestAll(casPage.headers);

  const html = await casPage.text();

  const execMatch = RegExp(/name="execution"\s+value="([^"]+)"/).exec(html);
  if (!execMatch) {
    throw new Error(
      "Formulaire CAS introuvable — la structure du serveur a peut-être changé.",
    );
  }
  const execution = execMatch[1];

  // ── Step 3: POST credentials ───────────────────────────────────────────────
  const body = new URLSearchParams({
    username,
    password,
    execution,
    _eventId: "submit",
    geolocation: "",
    deviceFingerprint: "",
  });

  const casPost = await fetch(casUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jar.header(),
      Referer: casUrl,
    },
    body: body.toString(),
  });
  jar.ingestAll(casPost.headers);

  // CAS returns 200 + error message on bad credentials, 302 on success
  if (casPost.status === 200) {
    const errHtml = await casPost.text();
    if (
      errHtml.includes("Invalid credentials") ||
      errHtml.includes("invalid.credentials") ||
      errHtml.includes("mot de passe") ||
      errHtml.includes("Identifiant")
    ) {
      throw new Error(
        "Identifiants incorrects — vérifie ton nom d'utilisateur et mot de passe.",
      );
    }
    throw new Error("Échec de l'authentification CAS (réponse inattendue).");
  }

  if (casPost.status !== 302) {
    throw new Error(`Réponse CAS inattendue : HTTP ${casPost.status}`);
  }

  const callbackLocation = casPost.headers.get("location");
  if (!callbackLocation)
    throw new Error("Pas de redirection CAS après connexion.");

  const callbackUrl = abs(callbackLocation, casUrl);

  // ── Step 4: follow Wigor signin-cas → captures .WS-EDT.CAS cookie ─────────
  const wigorCb = await fetch(callbackUrl, {
    redirect: "manual",
    headers: { ...BASE_HEADERS, Cookie: jar.header() },
  });
  jar.ingestAll(wigorCb.headers);

  const wsEdtCas = jar.get(".WS-EDT.CAS");
  if (!wsEdtCas) {
    // Sometimes there's one more redirect (Wigor → /)
    const loc2 = wigorCb.headers.get("location");
    if (loc2) {
      const wigorCb2 = await fetch(abs(loc2, callbackUrl), {
        redirect: "manual",
        headers: { ...BASE_HEADERS, Cookie: jar.header() },
      });
      jar.ingestAll(wigorCb2.headers);
    }
    const final = jar.get(".WS-EDT.CAS");
    if (!final)
      throw new Error(
        "Cookie de session .WS-EDT.CAS introuvable après authentification.",
      );
    return `.WS-EDT.CAS=${final}`;
  }

  return `.WS-EDT.CAS=${wsEdtCas}`;
}
