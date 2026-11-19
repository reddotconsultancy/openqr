"use client";
import { scanWarning } from "./QrPreview";

const DOTS = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
  { value: "extra-rounded", label: "Extra rounded" },
];

const CORNERS = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dot", label: "Circle" },
];

export default function StyleControls({ style, setStyle }) {
  const set = (k, v) => setStyle((s) => ({ ...s, [k]: v }));
  const warning = scanWarning(style);

  function onLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please use a logo under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <fieldset className="panel">
      <legend>Design</legend>
      <div className="grid-2">
        <label>
          Dot colour
          <span className="color-field">
            <input type="color" value={style.fg} onChange={(e) => set("fg", e.target.value)} />
            <input value={style.fg} onChange={(e) => set("fg", e.target.value)} maxLength={7} />
          </span>
        </label>
        <label>
          Background
          <span className="color-field">
            <input type="color" value={style.bg} onChange={(e) => set("bg", e.target.value)} />
            <input value={style.bg} onChange={(e) => set("bg", e.target.value)} maxLength={7} />
          </span>
        </label>
        <label>
          Dot style
          <select value={style.dots} onChange={(e) => set("dots", e.target.value)}>
            {DOTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Corner style
          <select value={style.corners} onChange={(e) => set("corners", e.target.value)}>
            {CORNERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {warning && <p className="warn">{warning}</p>}

      <label>
        Logo in the centre (optional)
        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={onLogo} />
      </label>
      {style.logo && (
        <div className="grid-2">
          <label>
            Logo size
            <input type="range" min="0.15" max="0.4" step="0.05" value={style.logoSize} onChange={(e) => set("logoSize", Number(e.target.value))} />
          </label>
          <button type="button" className="btn ghost" onClick={() => set("logo", null)}>
            Remove logo
          </button>
        </div>
      )}

      <div className="grid-2">
        <label>
          Download size
          <select value={style.size} onChange={(e) => set("size", Number(e.target.value))}>
            <option value={512}>512 px (web)</option>
            <option value={1024}>1024 px (standard)</option>
            <option value={2048}>2048 px (print)</option>
            <option value={4096}>4096 px (large print)</option>
          </select>
        </label>
        <label>
          Error correction
          <select value={style.logo ? "H" : style.ecl} disabled={Boolean(style.logo)} onChange={(e) => set("ecl", e.target.value)}>
            <option value="L">Low (7%)</option>
            <option value="M">Medium (15%)</option>
            <option value="Q">High (25%)</option>
            <option value="H">Highest (30%)</option>
          </select>
        </label>
      </div>
      {style.logo && <p className="note">Error correction is set to highest while a logo is used, so the code still scans.</p>}
    </fieldset>
  );
}
