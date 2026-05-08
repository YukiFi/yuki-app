/**
 * Coinbase Developer Platform (CDP) JWT signer.
 *
 * Coinbase's onramp APIs require a per-request JWT signed with the project's
 * private key. Node-only — never import from client code.
 *
 * Required env vars:
 *   - COINBASE_CDP_KEY_NAME      Key identifier ("organizations/{org}/apiKeys/{id}")
 *   - COINBASE_CDP_PRIVATE_KEY   Either an EC P-256 PEM block (signs ES256) or
 *                                a base64-encoded Ed25519 private seed
 *                                (32-byte seed or 64-byte seed||pubkey form)
 *
 * Falls back to legacy COINBASE_ONRAMP_API_KEY for the private key only —
 * historical name that some deploys still use.
 *
 * Spec: https://docs.cdp.coinbase.com/api-reference/v2/authentication/jwt-authentication
 */

import "server-only";
import {
  createPrivateKey,
  randomBytes,
  sign as cryptoSign,
  type KeyObject,
} from "node:crypto";

const TOKEN_TTL_SECONDS = 120;

// Cache the parsed key once per process — parsing PEM/DER on every request is
// wasteful and the key is stable for the lifetime of the deploy.
let cachedKey: { material: KeyObject; alg: "ES256" | "EdDSA" } | null = null;

function readPrivateKeyMaterial(): string {
  const v =
    process.env.COINBASE_CDP_PRIVATE_KEY ||
    process.env.COINBASE_ONRAMP_API_KEY ||
    "";
  if (!v) {
    throw new Error(
      "Missing CDP private key (set COINBASE_CDP_PRIVATE_KEY or COINBASE_ONRAMP_API_KEY)",
    );
  }
  return v;
}

function loadKey(): { material: KeyObject; alg: "ES256" | "EdDSA" } {
  if (cachedKey) return cachedKey;
  const raw = readPrivateKeyMaterial().trim();

  // EC P-256 PEM path. Replace literal "\n" sequences (env-var escaping).
  if (raw.includes("BEGIN") && raw.includes("PRIVATE KEY")) {
    const pem = raw.replace(/\\n/g, "\n");
    const key = createPrivateKey({ key: pem, format: "pem" });
    cachedKey = { material: key, alg: "ES256" };
    return cachedKey;
  }

  // Otherwise treat as base64 — Ed25519 seed (32 bytes) or seed||pub (64 bytes).
  let buf: Buffer;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    throw new Error("CDP private key is not valid PEM or base64");
  }
  if (buf.length !== 32 && buf.length !== 64) {
    throw new Error(
      `CDP private key has unexpected length ${buf.length}; expected 32 or 64 bytes for Ed25519, or PEM for EC`,
    );
  }
  const seed = buf.subarray(0, 32);
  // PKCS#8 wrapper for an Ed25519 private key (RFC 8410):
  //   SEQ { INT 0, SEQ { OID 1.3.101.112 }, OCTET_STRING { OCTET_STRING(seed) } }
  const pkcs8Prefix = Buffer.from(
    "302e020100300506032b657004220420",
    "hex",
  );
  const der = Buffer.concat([pkcs8Prefix, seed]);
  const key = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  cachedKey = { material: key, alg: "EdDSA" };
  return cachedKey;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Mint a CDP JWT for a single API request.
 *
 * `host` is the bare host (e.g. "api.developer.coinbase.com").
 * `path` starts with "/" (e.g. "/onramp/v1/buy/quote").
 */
export function signCDPJWT(
  method: "GET" | "POST",
  host: string,
  path: string,
): string {
  const keyName = process.env.COINBASE_CDP_KEY_NAME;
  if (!keyName) {
    throw new Error(
      "Missing COINBASE_CDP_KEY_NAME — get it from https://portal.cdp.coinbase.com → API Keys",
    );
  }

  const { material, alg } = loadKey();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg,
    kid: keyName,
    typ: "JWT",
    nonce: randomBytes(16).toString("hex"),
  };
  const payload = {
    iss: "cdp",
    sub: keyName,
    nbf: now,
    exp: now + TOKEN_TTL_SECONDS,
    uri: `${method} ${host}${path}`,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  let signature: Buffer;
  if (alg === "EdDSA") {
    signature = cryptoSign(null, Buffer.from(signingInput), material);
  } else {
    signature = cryptoSign("SHA256", Buffer.from(signingInput), {
      key: material,
      dsaEncoding: "ieee-p1363",
    });
  }
  return `${signingInput}.${base64url(signature)}`;
}

/** Health check — returns null if config is good, an error message otherwise. */
export function cdpAuthCheck(): string | null {
  try {
    if (!process.env.COINBASE_CDP_KEY_NAME) {
      return "Missing COINBASE_CDP_KEY_NAME";
    }
    loadKey();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Unknown CDP auth error";
  }
}
