"use client";
import { useState } from "react";

export default function ReportForm() {
  const [state, setState] = useState({ busy: false, done: false, error: "" });

  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ busy: true, done: false, error: "" });
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState({ busy: false, done: true, error: "" });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message });
    }
  }

  if (state.done) return <p>Thank you. We will review this link and disable it if it breaks the rules.</p>;

  return (
    <form onSubmit={submit}>
      <label>
        The QR link you want to report
        <input name="link" placeholder="https://.../r/abc1234" required />
      </label>
      <label>
        What is wrong with it?
        <textarea name="reason" rows={4} required placeholder="For example: it opens a fake bank login page" />
      </label>
      <label>
        Your email (optional, only if you want a reply)
        <input name="contact" type="email" />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn primary" disabled={state.busy}>{state.busy ? "Sending..." : "Send report"}</button>
    </form>
  );
}
