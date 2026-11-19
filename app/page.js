import QrStudio from "@/components/QrStudio";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Free QR code generator</h1>
        <p>
          Make static and dynamic QR codes in your browser. Add your colours and logo, then download a PNG or SVG. There is no account to create and
          no watermark on your code.
        </p>
      </section>
      <QrStudio />
      <section className="faq">
        <h2>Static or dynamic?</h2>
        <div className="grid-2 faq-grid">
          <div>
            <h3>Static QR</h3>
            <p>
              The information is written into the code itself. It works offline, never expires and does not depend on this website. You can't
              change it after printing. Use it for Wi-Fi, contact cards, UPI and anything that won't change.
            </p>
          </div>
          <div>
            <h3>Dynamic QR</h3>
            <p>
              The code holds a short link from this site, which forwards people to your page. You can change the destination at any time and
              see the scan count. It needs this website to stay online. You manage it with a private edit link, so keep that link safe.
            </p>
          </div>
        </div>
        <h2>Is my data stored?</h2>
        <p>
          Static codes are made entirely in your browser and nothing is sent to us. For dynamic codes we store only the destination address, the
          dates and the scan count. We do not store who scanned the code. See <a href="/privacy">privacy and rules</a>.
        </p>
      </section>
    </>
  );
}
