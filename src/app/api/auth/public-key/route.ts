import { NextResponse } from "next/server";
import { getPublicKeyPem } from "@/lib/rsa-key";

/**
 * GET /api/auth/public-key
 *
 * Returns the server's ephemeral RSA public key in PEM format.
 * The browser uses it to encrypt the password before sending it to
 * /api/auth/login, so the plaintext password never travels over the wire.
 *
 * The key is regenerated on every server restart — there is nothing sensitive
 * about the public key itself.
 */
export async function GET() {
  return NextResponse.json({ publicKey: getPublicKeyPem() });
}
