# OpenQR

A free, open-source QR code generator. People can make static and dynamic QR codes in the browser with no sign-in, no ads and no watermark.

## What it does

**Static QR codes** are made entirely in the visitor's browser. Nothing is sent to the server. Supported types:

- Website link
- Plain text
- WhatsApp chat (with an optional pre-filled message)
- Phone call and SMS
- Email (with subject and message)
- Wi-Fi login
- UPI payment (with optional amount and note)
- Contact card (vCard)

**Dynamic QR codes** hold a short link such as `yoursite.com/r/abc1234`. The site forwards each scan to the current destination and counts it. The creator gets a private edit link instead of an account. With the edit link they can change the destination, see the scan count, or delete the code. The browser also keeps a list of the codes made on that device.

**Design options:** dot colour, background colour, dot style, corner style, a logo in the centre, error correction, and download as PNG (512 to 4096 px) or SVG. The app warns when the colours are too close for a phone to scan.

## Safety features for dynamic links

- Only `http://` and `https://` destinations are allowed. Private network addresses and links back to this site are blocked.
- Each network can create 20 dynamic codes per hour (change with `CREATE_LIMIT_PER_HOUR`).
- Optional check against Google Safe Browsing, which blocks known phishing and malware links. Add a `GOOGLE_SAFE_BROWSING_KEY` to switch it on.
- Optional list of blocked domains (`BLOCKED_DOMAINS`).
- A public "Report a link" page. Reports are stored for the site owner to review.
- An admin endpoint to disable a reported link (see below).
- Edit links are never stored. The server keeps only a SHA-256 hash of each edit token.
- IP addresses are never stored. A salted hash is used as a rate-limit key and expires within the hour.

## Tech

- [Next.js](https://nextjs.org) (App Router), plain JavaScript
- [qr-code-styling](https://www.npmjs.com/package/qr-code-styling) (MIT) to draw the codes
- [Upstash Redis](https://upstash.com) to store dynamic links (free tier). Without Redis settings, the app keeps links in memory, which is only for local testing.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Dynamic links work, but they are lost when you stop the server, because there is no database locally.

## Put it online with Vercel (free)

1. **Put the code on GitHub.** Create a new public repository and upload this folder (without `node_modules` and `.next`).
2. **Import it into Vercel.** Go to vercel.com, sign in with GitHub, click **Add New > Project**, pick the repository and click **Deploy**. Vercel detects Next.js by itself.
3. **Add the database.** In the Vercel project, open the **Storage** tab, choose **Upstash** (Redis) from the Marketplace, pick the free plan and connect it to this project. Vercel adds the Redis keys for you.
4. **Add your settings.** In **Settings > Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`: your live address, for example `https://openqr.vercel.app`
   - `NEXT_PUBLIC_REPO_URL`: the GitHub repository address (shown in the footer)
   - `ADMIN_TOKEN`: a long random password, at least 16 characters
   - `RATE_LIMIT_SALT`: any random text
   - `GOOGLE_SAFE_BROWSING_KEY` (optional, recommended)
5. **Redeploy.** Open **Deployments**, click the three dots on the latest one and choose **Redeploy**, so the new settings take effect.
6. **Test it.** Make a dynamic code, scan it with your phone, change the destination on the edit page, and scan it again.

To use your own domain, add it under **Settings > Domains** and update `NEXT_PUBLIC_SITE_URL`.

### Getting a Google Safe Browsing key

In the Google Cloud Console, create a project, enable the **Safe Browsing API**, and create an API key under **APIs & Services > Credentials**. The Safe Browsing API is free for non-commercial use.

## Free tier limits to know

- **Vercel Hobby** is free for personal, non-commercial projects. It includes 1 million function calls a month. Every dynamic scan, create or edit uses one.
- **Upstash Redis free** includes 500,000 commands a month and 256 MB of storage. A scan uses about 2 commands, so the free plan covers roughly 200,000 scans a month.
- Static QR codes use none of these, because they are made in the browser.

## Handling abuse reports (site owner)

See the latest reports:

```bash
curl https://YOUR-SITE/api/admin -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

Disable a link (scans then go to the "link unavailable" page):

```bash
curl -X POST https://YOUR-SITE/api/admin \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"id":"abc1234","action":"disable"}'
```

Use `"action":"enable"` to turn it back on.

## Project layout

```
app/
  page.js               Home page with the generator
  edit/[id]/page.js     Manage a dynamic code (needs the edit link)
  r/[id]/route.js       The short link inside every dynamic code
  api/links/            Create, read, change and delete dynamic links
  api/report/           Abuse reports
  api/admin/            Owner tools
  privacy, report, unavailable   Simple pages
components/             The generator, preview, design controls and forms
lib/payloads.js         Turns form fields into QR content (Wi-Fi, UPI, vCard...)
lib/store.js            Redis storage, with a memory fallback
lib/server.js           Link checks, IDs, tokens, rate-limit keys
```

## Contributing

Issues and pull requests are welcome. Please keep the app free of sign-in, tracking and ads.

## License

MIT. See [LICENSE](LICENSE).

QR Code is a registered trademark of DENSO WAVE INCORPORATED.
