"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ── RSA-OAEP encryption helpers (Web Crypto API) ─────────────────────────────

/** Converts a PEM public key string to an ArrayBuffer for importKey. */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

/**
 * Fetches the server's ephemeral public key and uses it to RSA-OAEP-encrypt
 * the given plaintext. Returns a base64-encoded ciphertext.
 *
 * The plaintext password is only ever held in JS memory; the encrypted form
 * is what travels over the network.
 */
async function encryptPassword(plaintext: string): Promise<string> {
  const { publicKey: pem } = await fetch("/api/auth/public-key").then((r) =>
    r.json(),
  );

  const cryptoKey = await window.crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    cryptoKey,
    new TextEncoder().encode(plaintext),
  );

  // Encode as base64 for safe JSON transport
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Encrypt the password client-side before it leaves the browser.
      const encryptedPassword = await encryptPassword(password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, encryptedPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion.");
        return;
      }

      localStorage.setItem("edt-username", username);
      router.push("/");
      router.refresh();
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            EPSI — Emploi du temps
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Connecte-toi avec tes identifiants Wigor
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="prenom.nom"
                required
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Mot de passe
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Connexion en cours…
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/30">
          Ton mot de passe est chiffré dans ton navigateur avant envoi et ne
          transite jamais en clair.
        </p>
      </div>
    </div>
  );
}
