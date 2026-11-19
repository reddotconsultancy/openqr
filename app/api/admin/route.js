// Admin tools for the person who hosts this project.
// Needs the ADMIN_TOKEN environment variable. Send it as "x-admin-token".
//
// GET  /api/admin                         -> latest abuse reports
// POST /api/admin  {"id":"abc1234","action":"disable"}  -> stop a link from redirecting
// POST /api/admin  {"id":"abc1234","action":"enable"}   -> turn it back on
import { timingSafeEqual } from "node:crypto";
import { getLink, listReports, saveLink } from "@/lib/store";
import { isValidId, json } from "@/lib/server";

function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN || "";
  const given = req.headers.get("x-admin-token") || "";
  if (expected.length < 16 || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: "Not allowed." }, 403);
  return json({ reports: await listReports() });
}

export async function POST(req) {
  if (!isAdmin(req)) return json({ error: "Not allowed." }, 403);
  const body = await req.json().catch(() => ({}));
  if (!isValidId(body.id)) return json({ error: "Missing link id." }, 400);
  const link = await getLink(body.id);
  if (!link) return json({ error: "Link not found." }, 404);
  const disabled = body.action !== "enable";
  await saveLink(body.id, { ...link, disabled, updatedAt: new Date().toISOString() });
  return json({ id: body.id, url: link.url, disabled });
}
