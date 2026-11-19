// Helpers used only by the API routes.
import { createHash, randomBytes } from "node:crypto";

const ID_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/l/I

export function newId(length = 7) {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) id += ID_CHARS[bytes[i] % ID_CHARS.length];
  return id;
}

export const newEditToken = () => randomBytes(24).toString("base64url");

export const hashToken = (t = "") => createHash("sha256").update(t).digest("hex");

export function isValidId(id) {
  return typeof id === "string" && /^[A-Za-z0-9]{5,12}$/.test(id);
}

// We never store IP addresses. The hash is only used as a rate-limit key
// and expires within the hour.
export function clientKey(req) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const salt = process.env.RATE_LIMIT_SALT || "openqr";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 20);
}

export function bearer(req) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function siteOrigin(req) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
}

// Checks a destination before we store it.
export async function checkDestination(raw, req) {
  let u;
  try {
    u = new URL(String(raw || "").trim());
  } catch {
    return { ok: false, error: "Enter a full web address starting with https:// or http://" };
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    return { ok: false, error: "Dynamic QR codes can only point to http:// or https:// addresses." };
  }
  if (u.href.length > 2048) return { ok: false, error: "That address is too long (2,048 characters max)." };
  if (u.username || u.password) return { ok: false, error: "Addresses with a username or password are not allowed." };

  const host = u.hostname.toLowerCase();
  const own = new URL(siteOrigin(req)).hostname.toLowerCase();
  if (host === own) return { ok: false, error: "A dynamic QR cannot point to another dynamic QR on this site." };
  if (host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return { ok: false, error: "Private network addresses are not allowed." };
  }

  const blocked = (process.env.BLOCKED_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (blocked.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { ok: false, error: "This domain is blocked on this service." };
  }

  const unsafe = await safeBrowsingMatch(u.href);
  if (unsafe) return { ok: false, error: "Google Safe Browsing lists this address as unsafe, so we can't link to it." };

  return { ok: true, url: u.href };
}

// Optional: Google Safe Browsing Lookup API (free for non-commercial use).
// Set GOOGLE_SAFE_BROWSING_KEY in Vercel to switch it on.
async function safeBrowsingMatch(url) {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "openqr", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    return false;
  }
}
