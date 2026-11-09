"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not sign in.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 60 }}>
      <header className="hero">
        <div style={{ marginBottom: 16 }}>
          <a href="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← Back to home
          </a>
        </div>
        <img src="/acm-logo.png" alt="ACM logo" width="64" height="64" style={{ objectFit: "contain", background: "#fff", borderRadius: 14 }} />
        <p className="eyebrow">ACM Club · Admin</p>
        <h1 style={{ fontSize: "2.4rem" }}>
          CST <span>Zhabto</span>
        </h1>
        <p className="lede">Sign in to view and manage service requests.</p>
      </header>
      <form onSubmit={submit} className="login">
        <div className={"fld" + (error ? " bad" : "")}>
          <label htmlFor="pw">Admin Password</label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="err">{error}</span>
        </div>
        <button className="btn" type="submit" disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
