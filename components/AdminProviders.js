"use client";

import { useEffect, useState } from "react";

const defaultColors = ["#168bb4", "#21b780", "#f28a2e", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1"];

export default function AdminProviders({ initial }) {
  const [providers, setProviders] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", department: "", year: "", whatsapp: "", color: "#168bb4", image: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    const res = await fetch("/api/admin/providers", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setProviders(data.providers || []);
  }

  function openAddForm() {
    setForm({ name: "", department: "", year: "", whatsapp: "", color: defaultColors[providers.length % defaultColors.length], image: "" });
    setEditingId(null);
    setShowForm(true);
    setMsg("");
  }

  function openEditForm(provider) {
    setForm({ name: provider.name, department: provider.department, year: provider.year, whatsapp: provider.whatsapp, color: provider.color, image: provider.image || "" });
    setEditingId(provider.id);
    setShowForm(true);
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const url = editingId ? `/api/admin/providers/${editingId}` : "/api/admin/providers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save provider.");
        return;
      }
      await loadProviders();
      setShowForm(false);
      setMsg(editingId ? "Provider updated successfully." : "Provider added successfully.");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this provider?")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.error || "Could not delete provider.");
        return;
      }
      await loadProviders();
      setMsg("Provider deleted successfully.");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <div className="admin-bar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <img src="/acm-logo.png" alt="ACM logo" width="44" height="44" style={{ objectFit: "contain", background: "#fff", borderRadius: 10 }} />
            <p className="eyebrow">ACM Club · Admin</p>
          </div>
          <h1>Service Providers</h1>
        </div>
        <div className="admin-actions">
          <button className="btn ghost" type="button" onClick={() => window.location.href = "/admin"}>&larr; Back to requests</button>
          <button className="btn" type="button" onClick={openAddForm}>+ Add provider</button>
        </div>
      </div>

      {msg && <p className="banner" role="alert">{msg}</p>}

      <div className="sheet-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>WhatsApp</th>
              <th>Color</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr><td colSpan={7} className="none">No providers yet. Click "Add provider" to create one.</td></tr>
            )}
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td>
                  {provider.image ? (
                    <img src={provider.image} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f3f8fb", display: "grid", placeItems: "center", color: "var(--muted)" }}>No img</div>
                  )}
                </td>
                <td>{provider.name}</td>
                <td>{provider.department}</td>
                <td>{provider.year}</td>
                <td className="mono">{provider.whatsapp}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: provider.color, border: "1px solid var(--line)" }}></div>
                    <span className="mono">{provider.color}</span>
                  </div>
                </td>
                <td className="nowrap">
                  <button className="mini" type="button" onClick={() => openEditForm(provider)}>Edit</button>
                  <button className="mini" type="button" onClick={() => handleDelete(provider.id)} style={{ marginLeft: 6 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <section className="sheet">
            <header className="sheet-head">
              <div>
                <h2>{editingId ? "Edit provider" : "Add new provider"}</h2>
                <p>Fill in the provider details below.</p>
              </div>
              <button className="x" type="button" onClick={() => setShowForm(false)} aria-label="Close form">×</button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="fld full">
                <label>Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tashi Wangchuk"
                  required
                />
              </div>
              <div className="fld">
                <label>Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              <div className="fld">
                <label>Year</label>
                <input
                  type="text"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="e.g. 3rd Year"
                  required
                />
              </div>
              <div className="fld full">
                <label>WhatsApp link</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="e.g. https://wa.me/97517701234"
                  required
                />
              </div>
              <div className="fld full">
                <label>Card color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: color,
                        border: form.color === color ? "3px solid var(--ink)" : "2px solid var(--line)",
                        cursor: "pointer",
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#168bb4"
                  style={{ marginTop: 8 }}
                />
              </div>
              <div className="fld full">
                <label>Image URL (optional)</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>Enter a URL for the provider's image</small>
              </div>
              <div className="actions">
                <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn" type="button" onClick={handleSubmit} disabled={busy}>
                  {busy ? "Saving..." : editingId ? "Update provider" : "Add provider"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
