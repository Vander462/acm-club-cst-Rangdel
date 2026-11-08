"use client";

import { useEffect, useState } from "react";

const defaultIcons = ["↓", "⌘", "▣", "▤", "★", "◆", "●", "■"];

export default function AdminServices({ initial }) {
  const [services, setServices] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", desc: "", price: "", unit: "", icon: "▢", image: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setServices(data.services || []);
  }

  function openAddForm() {
    setForm({ name: "", desc: "", price: "", unit: "per service", icon: defaultIcons[services.length % defaultIcons.length], image: "" });
    setEditingId(null);
    setShowForm(true);
    setMsg("");
  }

  function openEditForm(service) {
    setForm({ name: service.name, desc: service.desc, price: service.price, unit: service.unit, icon: service.icon, image: service.image || "" });
    setEditingId(service.id);
    setShowForm(true);
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : "/api/admin/services";
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
        setMsg(data.error || "Could not save service.");
        return;
      }
      await loadServices();
      setShowForm(false);
      setMsg(editingId ? "Service updated successfully." : "Service added successfully.");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.error || "Could not delete service.");
        return;
      }
      await loadServices();
      setMsg("Service deleted successfully.");
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
          <h1>Services</h1>
        </div>
        <div className="admin-actions">
          <button className="btn ghost" type="button" onClick={() => window.location.href = "/admin"}>&larr; Back to dashboard</button>
          <button className="btn" type="button" onClick={openAddForm}>+ Add service</button>
        </div>
      </div>

      {msg && <p className="banner" role="alert">{msg}</p>}

      <div className="sheet-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 && (
              <tr><td colSpan={6} className="none">No services yet. Click "Add service" to create one.</td></tr>
            )}
            {services.map((service) => (
              <tr key={service.id}>
                <td style={{ fontSize: "24px", textAlign: "center" }}>{service.icon}</td>
                <td>{service.name}</td>
                <td style={{ maxWidth: "300px" }}>{service.desc}</td>
                <td className="num">Nu. {service.price}</td>
                <td>{service.unit}</td>
                <td className="nowrap">
                  <button className="mini" type="button" onClick={() => openEditForm(service)}>Edit</button>
                  <button className="mini" type="button" onClick={() => handleDelete(service.id)} style={{ marginLeft: 6 }}>Delete</button>
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
                <h2>{editingId ? "Edit service" : "Add new service"}</h2>
                <p>Fill in the service details below.</p>
              </div>
              <button className="x" type="button" onClick={() => setShowForm(false)} aria-label="Close form">×</button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="fld full">
                <label>Service name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Install software"
                  required
                />
              </div>
              <div className="fld full">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="Describe what this service offers"
                  required
                />
              </div>
              <div className="fld full">
                <label>Card image URL <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/image.jpg" />
                <small>Use a publicly accessible image URL. The image will cover the card.</small>
              </div>
              <div className="fld">
                <label>Price (Nu.)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
              <div className="fld">
                <label>Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="per service"
                  required
                />
              </div>
              <div className="fld full">
                <label>Icon</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {defaultIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: form.icon === icon ? "var(--accent)" : "#f3f8fb",
                        color: form.icon === icon ? "#fff" : "var(--ink)",
                        border: form.icon === icon ? "2px solid var(--accent)" : "2px solid var(--line)",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                      aria-label={`Select icon ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="actions">
                <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn" type="button" onClick={handleSubmit} disabled={busy}>
                  {busy ? "Saving..." : editingId ? "Update service" : "Add service"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
