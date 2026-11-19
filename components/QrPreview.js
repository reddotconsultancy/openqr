"use client";
// Draws the QR code in the browser and handles downloads.
// Nothing is sent to a server here.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const DEFAULT_STYLE = {
  fg: "#111111",
  bg: "#ffffff",
  dots: "square",
  corners: "square",
  logo: null,
  logoSize: 0.3,
  size: 1024,
  ecl: "M",
};

function toOptions(data, s, size) {
  return {
    width: size,
    height: size,
    type: "svg",
    data: data || " ",
    margin: Math.round(size * 0.04),
    image: s.logo || undefined,
    qrOptions: { errorCorrectionLevel: s.logo ? "H" : s.ecl },
    dotsOptions: { color: s.fg, type: s.dots },
    cornersSquareOptions: { color: s.fg, type: s.corners === "square" ? "square" : s.corners === "dot" ? "dot" : "extra-rounded" },
    cornersDotOptions: { color: s.fg, type: s.corners === "dot" ? "dot" : "square" },
    backgroundOptions: { color: s.bg },
    imageOptions: { crossOrigin: "anonymous", margin: Math.round(size * 0.01), imageSize: s.logoSize, hideBackgroundDots: true },
  };
}

const QrPreview = forwardRef(function QrPreview({ data, style, empty }, ref) {
  const box = useRef(null);
  const qr = useRef(null);
  const Lib = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Lib.current) Lib.current = (await import("qr-code-styling")).default;
      if (cancelled) return;
      const opts = toOptions(data, style, 600);
      if (!qr.current) {
        qr.current = new Lib.current(opts);
        box.current.innerHTML = "";
        qr.current.append(box.current);
      } else {
        qr.current.update(opts);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, style]);

  useImperativeHandle(ref, () => ({
    async download(extension, name = "qr-code") {
      if (!Lib.current || !data) return;
      const opts = toOptions(data, style, Number(style.size) || 1024);
      opts.type = extension === "svg" ? "svg" : "canvas";
      const exporter = new Lib.current(opts);
      await exporter.download({ name, extension });
    },
  }));

  return (
    <div className={`qr-frame${empty ? " is-empty" : ""}`} aria-label="QR code preview">
      <div ref={box} className="qr-box" />
      {empty && <p className="qr-hint">Fill in the form to see your QR code</p>}
    </div>
  );
});

export default QrPreview;

// Rough contrast check so people don't download codes phones can't read.
function lum(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function scanWarning(s) {
  try {
    const f = lum(s.fg);
    const b = lum(s.bg);
    if (f > b) return "The dots are lighter than the background. Many phone cameras can't read inverted codes.";
    if ((b + 0.05) / (f + 0.05) < 4) return "The colours are too close. Use darker dots or a lighter background so phones can scan it.";
  } catch {}
  return "";
}
