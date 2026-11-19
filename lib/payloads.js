// Turns form values into the text that goes inside a QR code.
// Every type here is a "static" QR: the data lives inside the code itself.

export const QR_TYPES = [
  { id: "url", label: "Website" },
  { id: "text", label: "Text" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "phone", label: "Phone call" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "upi", label: "UPI payment" },
  { id: "vcard", label: "Contact card" },
];

export const FIELDS = {
  url: [{ name: "url", label: "Website address", placeholder: "https://example.com" }],
  text: [{ name: "text", label: "Text", type: "textarea", placeholder: "Any text up to about 1,000 characters" }],
  whatsapp: [
    { name: "phone", label: "WhatsApp number with country code", placeholder: "919876543210" },
    { name: "message", label: "Pre-filled message (optional)", type: "textarea", placeholder: "Hi, I saw your poster..." },
  ],
  phone: [{ name: "phone", label: "Phone number with country code", placeholder: "+919876543210" }],
  sms: [
    { name: "phone", label: "Phone number with country code", placeholder: "+919876543210" },
    { name: "message", label: "Message (optional)", type: "textarea" },
  ],
  email: [
    { name: "email", label: "Email address", placeholder: "hello@example.com" },
    { name: "subject", label: "Subject (optional)" },
    { name: "body", label: "Message (optional)", type: "textarea" },
  ],
  wifi: [
    { name: "ssid", label: "Network name (SSID)" },
    { name: "password", label: "Password" },
    {
      name: "encryption",
      label: "Security",
      type: "select",
      options: [
        { value: "WPA", label: "WPA / WPA2 / WPA3" },
        { value: "WEP", label: "WEP" },
        { value: "nopass", label: "No password" },
      ],
    },
    { name: "hidden", label: "Hidden network", type: "checkbox" },
  ],
  upi: [
    { name: "vpa", label: "UPI ID", placeholder: "name@bank" },
    { name: "name", label: "Payee name" },
    { name: "amount", label: "Amount in ₹ (optional)", placeholder: "Leave empty to let the payer enter it" },
    { name: "note", label: "Note (optional)" },
  ],
  vcard: [
    { name: "firstName", label: "First name" },
    { name: "lastName", label: "Last name" },
    { name: "org", label: "Company (optional)" },
    { name: "title", label: "Job title (optional)" },
    { name: "phone", label: "Phone (optional)" },
    { name: "email", label: "Email (optional)" },
    { name: "website", label: "Website (optional)" },
    { name: "address", label: "Address (optional)" },
  ],
};

const digits = (v = "") => v.replace(/[^\d]/g, "");
const phoneClean = (v = "") => v.trim().replace(/[^\d+]/g, "");

// Wi-Fi and contact card formats need these characters escaped.
const escapeWifi = (v = "") => v.replace(/([\\;,:"])/g, "\\$1");
const escapeVcard = (v = "") => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export function normaliseUrl(value = "") {
  const v = value.trim();
  if (!v) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
}

export function buildPayload(type, f = {}) {
  switch (type) {
    case "url":
      return normaliseUrl(f.url);
    case "text":
      return f.text || "";
    case "whatsapp": {
      const n = digits(f.phone);
      if (!n) return "";
      return `https://wa.me/${n}${f.message ? `?text=${encodeURIComponent(f.message)}` : ""}`;
    }
    case "phone":
      return f.phone ? `tel:${phoneClean(f.phone)}` : "";
    case "sms":
      return f.phone ? `SMSTO:${phoneClean(f.phone)}:${f.message || ""}` : "";
    case "email": {
      if (!f.email) return "";
      const q = [];
      if (f.subject) q.push(`subject=${encodeURIComponent(f.subject)}`);
      if (f.body) q.push(`body=${encodeURIComponent(f.body)}`);
      return `mailto:${f.email.trim()}${q.length ? `?${q.join("&")}` : ""}`;
    }
    case "wifi": {
      if (!f.ssid) return "";
      const enc = f.encryption || "WPA";
      const pass = enc === "nopass" ? "" : `P:${escapeWifi(f.password)};`;
      return `WIFI:T:${enc};S:${escapeWifi(f.ssid)};${pass}${f.hidden ? "H:true;" : ""};`;
    }
    case "upi": {
      if (!f.vpa) return "";
      const p = new URLSearchParams();
      p.set("pa", f.vpa.trim());
      if (f.name) p.set("pn", f.name.trim());
      if (f.amount && Number(f.amount) > 0) p.set("am", Number(f.amount).toFixed(2));
      p.set("cu", "INR");
      if (f.note) p.set("tn", f.note.trim());
      // UPI apps expect the "@" in the UPI ID unencoded.
      return `upi://pay?${p.toString().replace(/\+/g, "%20").replace(/%40/g, "@")}`;
    }
    case "vcard": {
      if (!f.firstName && !f.lastName && !f.org) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeVcard(f.lastName)};${escapeVcard(f.firstName)};;;`,
        `FN:${escapeVcard([f.firstName, f.lastName].filter(Boolean).join(" ") || f.org)}`,
      ];
      if (f.org) lines.push(`ORG:${escapeVcard(f.org)}`);
      if (f.title) lines.push(`TITLE:${escapeVcard(f.title)}`);
      if (f.phone) lines.push(`TEL;TYPE=CELL:${phoneClean(f.phone)}`);
      if (f.email) lines.push(`EMAIL:${f.email.trim()}`);
      if (f.website) lines.push(`URL:${normaliseUrl(f.website)}`);
      if (f.address) lines.push(`ADR:;;${escapeVcard(f.address)};;;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    default:
      return "";
  }
}
