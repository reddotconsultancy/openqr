// POST /api/report  ->  anyone can report a dynamic link that points somewhere harmful.
import { addReport, allow, getLink } from "@/lib/store";
import { clientKey, isValidId, json } from "@/lib/server";

export async function POST(req) {
  if (!(await allow(`report:${clientKey(req)}`, 10, 3600))) {
    return json({ error: "Too many reports from your network. Please try again later." }, 429);
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Accept either the code (abc1234) or the full short link.
  const raw = String(body?.link || "").trim();
  const id = raw.split("/r/").pop().split(/[?#/]/)[0];
  if (!isValidId(id) || !(await getLink(id))) {
    return json({ error: "We couldn't find that link. Paste the full address from the QR code." }, 404);
  }

  const reason = String(body?.reason || "").slice(0, 1000).trim();
  if (!reason) return json({ error: "Please tell us what is wrong with this link." }, 400);

  await addReport({ id, reason, contact: String(body?.contact || "").slice(0, 200), at: new Date().toISOString() });
  return json({ received: true });
}
