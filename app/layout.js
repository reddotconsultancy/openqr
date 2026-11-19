import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const repo = process.env.NEXT_PUBLIC_REPO_URL || "";

export const metadata = {
  metadataBase: new URL(site),
  title: "OpenQR: free QR code generator, static and dynamic, no sign-in",
  description:
    "Make static and dynamic QR codes for free. Website, WhatsApp, Wi-Fi, UPI, contact card and more. Add colours and a logo, download PNG or SVG. No account, open source.",
  openGraph: {
    title: "OpenQR: free QR code generator",
    description: "Static and dynamic QR codes. Free, open source, no sign-in.",
    type: "website",
  },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            <span className="logo-mark" aria-hidden="true" />
            OpenQR
          </a>
          <nav>
            <a href="/privacy">Privacy and rules</a>
            <a href="/report">Report a link</a>
            {repo && (
              <a href={repo} target="_blank" rel="noreferrer">
                Source code
              </a>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Free and open source under the MIT License. No sign-in, no ads, no tracking.
            {repo && (
              <>
                {" "}
                <a href={repo} target="_blank" rel="noreferrer">
                  View the code on GitHub
                </a>
                .
              </>
            )}
          </p>
          <p className="muted">QR Code is a registered trademark of DENSO WAVE INCORPORATED.</p>
        </footer>
      </body>
    </html>
  );
}
