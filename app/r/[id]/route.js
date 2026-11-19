// GET /r/:id  ->  this is the address inside every dynamic QR code.
// It counts the scan and sends the person to the current destination.
import { countScan, getLink } from "@/lib/store";
import { isValidId, siteOrigin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = await params;
  const origin = siteOrigin(req);
  const link = isValidId(id) ? await getLink(id) : null;

  if (!link || link.disabled) {
    return Response.redirect(`${origin}/unavailable`, 302);
  }

  // A failed count must never stop the redirect.
  try {
    await countScan(id);
  } catch {}

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
