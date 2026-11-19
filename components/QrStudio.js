"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QrPreview, { DEFAULT_STYLE } from "./QrPreview";
import StyleControls from "./StyleControls";
import { FIELDS, QR_TYPES, buildPayload, normaliseUrl } from "@/lib/payloads";

const SAVED_KEY = "openqr:dynamic-links";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}
function storeSaved(list) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
}

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          prompt("Copy this:", text);
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

function Field({ field, value, onChange }) {
  const common = { id: field.name, value: value ?? "", onChange: (e) => onChange(e.target.value), placeholder: field.placeholder };
  if (field.type === "textarea") return <textarea rows={3} {...common} />;
  if (field.type === "select")
    return (
      <select {...common} value={value ?? field.options[0].value}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  if (field.type === "checkbox")
    return <input type="checkbox" id={field.name} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
  return <input type="text" autoComplete="off" {...common} />;
}

export default function QrStudio() {
  const [mode, setMode] = useState("static");
  const [type, setType] = useState("url");
  const [values, setValues] = useState({});
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const preview = useRef(null);

  // dynamic mode
  const [destination, setDestination] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => setSaved(loadSaved()), []);

  const typeValues = values[type] || {};
  const setField = (name, v) => setValues((all) => ({ ...all, [type]: { ...(all[type] || {}), [name]: v } }));

  const staticPayload = useMemo(() => buildPayload(type, typeValues), [type, typeValues]);
  const payload = mode === "static" ? staticPayload : created?.shortUrl || "";
  const debouncedPayload = useDebounced(payload);
  const debouncedStyle = useDebounced(style, 120);

  const tooLong = staticPayload.length > 1200;

  async function createDynamic(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normaliseUrl(destination) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setCreated(data);
      const entry = { id: data.id, url: data.url, shortUrl: data.shortUrl, editUrl: data.editUrl, createdAt: new Date().toISOString() };
      const next = [entry, ...loadSaved().filter((s) => s.id !== data.id)];
      storeSaved(next);
      setSaved(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function forget(id) {
    if (!confirm("Remove this code from the list on this device? The QR code keeps working, but you lose the edit link unless you saved it somewhere else.")) return;
    const next = saved.filter((s) => s.id !== id);
    storeSaved(next);
    setSaved(next);
  }

  const fileName = mode === "static" ? `qr-${type}` : `qr-dynamic-${created?.id || "code"}`;

  return (
    <div className="studio">
      <div className="studio-form">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === "static"} className={mode === "static" ? "tab active" : "tab"} onClick={() => setMode("static")}>
            Static QR
          </button>
          <button role="tab" aria-selected={mode === "dynamic"} className={mode === "dynamic" ? "tab active" : "tab"} onClick={() => setMode("dynamic")}>
            Dynamic QR
          </button>
        </div>

        {mode === "static" ? (
          <fieldset className="panel">
            <legend>Content</legend>
            <p className="note">The information is stored inside the code. It never expires and does not depend on this website.</p>
            <div className="type-grid">
              {QR_TYPES.map((t) => (
                <button key={t.id} type="button" className={t.id === type ? "chip active" : "chip"} onClick={() => setType(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            {FIELDS[type].map((f) => (
              <label key={f.name} className={f.type === "checkbox" ? "check" : undefined}>
                {f.type !== "checkbox" && f.label}
                <Field field={f} value={typeValues[f.name]} onChange={(v) => setField(f.name, v)} />
                {f.type === "checkbox" && f.label}
              </label>
            ))}
            {tooLong && <p className="warn">This is a lot of data for one QR code. It will be dense and harder to scan. Try shortening it.</p>}
          </fieldset>
        ) : (
          <fieldset className="panel">
            <legend>Destination</legend>
            <p className="note">
              A dynamic QR contains a short link from this site. You can change where it points later, and see how many times it was scanned. No account needed: you get a private edit link instead.
            </p>
            <form onSubmit={createDynamic} className="row">
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="https://your-website.com/menu" aria-label="Destination address" required />
              <button className="btn primary" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}

            {created && (
              <div className="result">
                <p>
                  <strong>Short link:</strong> <a href={created.shortUrl} target="_blank" rel="noreferrer">{created.shortUrl}</a> <CopyButton text={created.shortUrl} />
                </p>
                <div className="secret">
                  <p>
                    <strong>Save your edit link.</strong> It is the only way to change or delete this code. Anyone with it can edit the code, so keep it private. We have also saved it in this browser.
                  </p>
                  <code>{created.editUrl}</code>
                  <CopyButton text={created.editUrl} label="Copy edit link" />
                </div>
                <button type="button" className="btn ghost" onClick={() => { setCreated(null); setDestination(""); }}>
                  Make another
                </button>
              </div>
            )}

            {saved.length > 0 && (
              <div className="saved">
                <h3>Your dynamic codes on this device</h3>
                <ul>
                  {saved.map((s) => (
                    <li key={s.id}>
                      <div>
                        <span className="mono">/r/{s.id}</span>
                        <span className="muted"> → {s.url}</span>
                      </div>
                      <div className="actions">
                        <a className="btn small" href={s.editUrl}>Manage</a>
                        <button type="button" className="btn small ghost" onClick={() => forget(s.id)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>
        )}

        <StyleControls style={style} setStyle={setStyle} />
      </div>

      <aside className="studio-preview">
        <QrPreview ref={preview} data={debouncedPayload} style={debouncedStyle} empty={!payload} />
        <div className="downloads">
          <button className="btn primary" disabled={!payload} onClick={() => preview.current?.download("png", fileName)}>
            Download PNG
          </button>
          <button className="btn" disabled={!payload} onClick={() => preview.current?.download("svg", fileName)}>
            Download SVG
          </button>
        </div>
        <p className="note center">PNG works for sharing and screens. SVG stays sharp at any print size.</p>
        <p className="note center">Always test-scan your code with a phone before printing.</p>
      </aside>
    </div>
  );
}
