"use client";
import { useEffect, useRef, useState } from "react";
import QrPreview, { DEFAULT_STYLE } from "./QrPreview";
import StyleControls from "./StyleControls";
import { CopyButton } from "./QrStudio";
import { normaliseUrl } from "@/lib/payloads";

export default function EditLink({ id }) {
  const [token, setToken] = useState("");
  const [link, setLink] = useState(null);
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const preview = useRef(null);

  async function call(method, body) {
    const res = await fetch(`/api/links/${id}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  useEffect(() => {
    const t = decodeURIComponent(window.location.hash.slice(1));
    if (!t) {
      setStatus("no-token");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    call("GET")
      .then((d) => {
        setLink(d);
        setDestination(d.url);
        setStatus("ready");
      })
      .catch((e) => {
        setMessage(e.message);
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const d = await call("PATCH", { url: normaliseUrl(destination) });
      setLink(d);
      setDestination(d.url);
      setMessage("Saved. The QR code now opens the new address.");
      try {
        const list = JSON.parse(localStorage.getItem("openqr:dynamic-links") || "[]");
        localStorage.setItem("openqr:dynamic-links", JSON.stringify(list.map((s) => (s.id === id ? { ...s, url: d.url } : s))));
      } catch {}
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this dynamic QR code? Anyone who scans it after this will see a 'link unavailable' page. This cannot be undone.")) return;
    setBusy(true);
    try {
      await call("DELETE");
      try {
        const list = JSON.parse(localStorage.getItem("openqr:dynamic-links") || "[]");
        localStorage.setItem("openqr:dynamic-links", JSON.stringify(list.filter((s) => s.id !== id)));
      } catch {}
      setStatus("deleted");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <p className="center muted">Loading...</p>;
  if (status === "no-token" || status === "error")
    return (
      <div className="panel narrow">
        <h1>Manage a dynamic QR code</h1>
        <p>{status === "error" ? message : "This page needs your private edit link. Paste the full edit link you saved when you created the code."}</p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("edit") || "";
            const hash = String(v).split("#")[1];
            if (hash) {
              window.location.hash = hash;
              setStatus("loading");
              setToken(decodeURIComponent(hash));
            }
          }}
        >
          <input name="edit" placeholder={`https://.../edit/${id}#...`} aria-label="Edit link" />
          <button className="btn primary">Open</button>
        </form>
      </div>
    );
  if (status === "deleted")
    return (
      <div className="panel narrow">
        <h1>Deleted</h1>
        <p>This dynamic QR code no longer redirects anywhere.</p>
        <a className="btn primary" href="/">Make a new QR code</a>
      </div>
    );

  return (
    <div className="studio">
      <div className="studio-form">
        <div className="panel">
          <h1>Manage your dynamic QR</h1>
          {link.disabled && <p className="error">This link was disabled after an abuse report. It no longer redirects.</p>}
          <dl className="stats">
            <div>
              <dt>Scans</dt>
              <dd>{link.scans.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(link.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Last changed</dt>
              <dd>{new Date(link.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
          <p>
            <strong>Short link:</strong> <span className="mono">{link.shortUrl}</span> <CopyButton text={link.shortUrl} />
          </p>
          <form onSubmit={save}>
            <label>
              Destination
              <input value={destination} onChange={(e) => setDestination(e.target.value)} disabled={link.disabled} />
            </label>
            <div className="row">
              <button className="btn primary" disabled={busy || link.disabled}>Save destination</button>
              <button type="button" className="btn danger" disabled={busy} onClick={remove}>Delete code</button>
            </div>
          </form>
          {message && <p className="note">{message}</p>}
          <p className="note">Keep this page's address private. Anyone with it can change or delete this code.</p>
        </div>
        <StyleControls style={style} setStyle={setStyle} />
      </div>
      <aside className="studio-preview">
        <QrPreview ref={preview} data={link.shortUrl} style={style} />
        <div className="downloads">
          <button className="btn primary" onClick={() => preview.current?.download("png", `qr-dynamic-${id}`)}>Download PNG</button>
          <button className="btn" onClick={() => preview.current?.download("svg", `qr-dynamic-${id}`)}>Download SVG</button>
        </div>
        <p className="note center">Changing the destination does not change the code. Printed copies keep working.</p>
      </aside>
    </div>
  );
}
