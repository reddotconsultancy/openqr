// GET / PATCH / DELETE /api/links/:id  ->  read, change or delete a dynamic link.
// Every request needs the secret edit token: "Authorization: Bearer <token>".
import { timingSafeEqual } from "crypto";
import { allow, deleteLink, getLink, getScans, saveLink } from "@/lib/store";
import { bearer, checkDestination, clientKey, hashToken, isValidId, json, siteOrigin } from "@/lib/server";

async function authorise(req, id) {
  if (!isValidId(id)) return { error: json({ error: "Link not found." }, 404) };
  if (!(await allow(`edit:${clientKey(req)}`, 120, 3600))) {
    return { error: json({ error: "Too many requests. Please wait a while and try again." }, 429) };
  }
  const link = await getLink(id);
  if (!link) return { error: json({ error: "Link not found." }, 404) };
  const given = Buffer.from(hashToken(bearer(req)));
  const stored = Buffer.from(link.tokenHash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
    return { error: json({ error: "This edit link is not valid." }, 403) };
  }
  return { link };
}

function view(req, id, link, scans) {
  return {
    id,
    url: link.url,
    shortUrl: `${siteOrigin(req)}/r/${id}`,
    scans,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    disabled: Boolean(link.disabled),
  };
}

export async function GET(req, { params }) {
  const { id } = await params;
  const { link, error } = await authorise(req, id);
  if (error) return error;
  return json(view(req, id, link, await getScans(id)));
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { link, error } = await authorise(req, id);
  if (error) return error;
  if (link.disabled) return json({ error: "This link was disabled after an abuse report and can't be edited." }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const check = await checkDestination(body?.url, req);
  if (!check.ok) return json({ error: check.error }, 400);

  const updated = { ...link, url: check.url, updatedAt: new Date().toISOString() };
  await saveLink(id, updated);
  return json(view(req, id, updated, await getScans(id)));
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { error } = await authorise(req, id);
  if (error) return error;
  await deleteLink(id);
  return json({ deleted: true });
}
