export const metadata = { title: "Link unavailable", robots: { index: false } };

export default function Unavailable() {
  return (
    <div className="panel narrow center">
      <h1>This QR link is not available</h1>
      <p>The owner deleted it, or it was disabled because it broke our rules.</p>
      <a className="btn primary" href="/">Make your own free QR code</a>
    </div>
  );
}
