// POST /api/links  ->  create a dynamic QR link
import { createLink } from "@/lib/store";
import { allow } from "@/lib/store";
import { checkDestination, clientKey, hashToken, json, newEditToken, newId, siteOrigin } from "@/lib/server";

export async function POST(req) {
  const who = clientKey(req);
  if (!(await allow(`create:${who}`, Number(process.env.CREATE_LIMIT_PER_HOUR || 20), 3600))) {
    return json({ error: "Too many new codes from your network. Please try again in an hour." }, 429);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const check = await checkDestination(body?.url, req);
  if (!check.ok) return json({ error: check.error }, 400);

  const editToken = newEditToken();
  const now = new Date().toISOString();
  const record = { url: check.url, tokenHash: hashToken(editToken), createdAt: now, updatedAt: now, disabled: false };

  let id = "";
  for (let i = 0; i < 5; i++) {
    const candidate = newId();
    if (await createLink(candidate, record)) {
      id = candidate;
      break;
    }
  }
  if (!id) return json({ error: "Could not create a link. Please try again." }, 500);

  const origin = siteOrigin(req);
  return json(
    {
      id,
      url: check.url,
      shortUrl: `${origin}/r/${id}`,
      editToken,
      editUrl: `${origin}/edit/${id}#${editToken}`,
    },
    201
  );
}
