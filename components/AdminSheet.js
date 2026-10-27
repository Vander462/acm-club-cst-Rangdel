"use client";

import { useMemo, useState } from "react";
import { STATUS_LABEL, nu } from "@/lib/services";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Thimphu",
});
const when = (ms) => (ms ? fmt.format(new Date(ms)) : "");

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default function AdminSheet({ initial }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  async function send(id, body) {
    setBusyId(id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save.");
        return;
      }
      setRows((rs) => rs.map((r) => (r.id === id ? data.request : r)));
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  async function refresh() {
    setMsg("");
    const res = await fetch("/api/admin/requests", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setRows(data.requests);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, in_progress: 0, completed: 0, earned: 0 };
    rows.forEach((r) => {
      c[r.status]++;
      if (r.status === "completed") c.earned += r.cost;
    });
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!needle) return true;
      return [r.code, r.name, r.studentId, r.phone, r.serviceName, r.place, r.details]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, filter, q]);

  function exportCsv() {
    const head = ["Ticket", "Sent", "Name", "Student ID", "Phone", "Service", "Details", "Laptop", "Meeting place",
      "Preferred date", "Notes", "Cost (Nu.)", "Status", "Admin note", "Confirmed"];
    const lines = [head.map(csvCell).join(",")];
    shown.forEach((r) =>
      lines.push(
        [r.code, when(r.createdAt), r.name, r.studentId, r.phone, r.serviceName, r.details, r.laptopModel, r.place,
          r.preferredDate, r.notes, r.cost, STATUS_LABEL[r.status], r.adminNote, when(r.confirmedAt)]
          .map(csvCell)
          .join(",")
      )
    );
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zhabto-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin">
      <div className="admin-bar">
        <div>
          <p className="eyebrow">ACM Club · Admin</p>
          <h1>Request sheet</h1>
        </div>
        <div className="admin-actions">
          <button className="btn ghost" type="button" onClick={refresh}>Refresh</button>
          <button className="btn ghost" type="button" onClick={exportCsv}>Export CSV</button>
          <button className="btn ghost" type="button" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="stats">
        <div><b>{counts.all}</b><span>Total requests</span></div>
        <div><b>{counts.pending}</b><span>Pending</span></div>
        <div><b>{counts.in_progress}</b><span>In progress</span></div>
        <div><b>{counts.completed}</b><span>Completed</span></div>
        <div><b>{nu(counts.earned)}</b><span>Confirmed earnings</span></div>
      </div>

      <div className="admin-tools">
        <div className="chips" role="group" aria-label="Filter by status">
          {[["all", "All"], ["pending", "Pending"], ["in_progress", "In progress"], ["completed", "Completed"]].map(([k, label]) => (
            <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}<span>{counts[k]}</span>
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search name, ID, phone, ticket…"
          aria-label="Search requests"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {msg && <p className="banner" role="alert">{msg}</p>}

      <div className="sheet-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>Ticket</th><th>Sent</th><th>Name</th><th>Student ID</th><th>Phone</th><th>Service</th>
              <th>Details</th><th>Laptop</th><th>Meeting place</th><th>Preferred date</th>
              <th className="num">Cost (Nu.)</th><th>Status</th><th>Admin note</th><th>Confirmation</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={14} className="none">No requests match.</td></tr>
            )}
            {shown.map((r) => {
              const locked = r.status === "completed";
              const key = (f) => `${r.id}-${r.updatedAt}-${f}`;
              const busy = busyId === r.id;
              return (
                <tr key={r.id} className={locked ? "locked" : ""}>
                  <td className="mono">{r.code}</td>
                  <td className="nowrap">{when(r.createdAt)}</td>
                  <td>{r.name}</td>
                  <td className="mono">{r.studentId}</td>
                  <td className="mono">{r.phone}</td>
                  <td>{r.serviceName}</td>
                  <td className="wide">{r.details}{r.notes ? <em> · Note: {r.notes}</em> : null}</td>
                  <td>{r.laptopModel}</td>
                  <td>
                    <input
                      key={key("place")}
                      defaultValue={r.place}
                      disabled={locked || busy}
                      aria-label={`Meeting place for ${r.code}`}
                      onBlur={(e) => e.target.value.trim() !== r.place && send(r.id, { place: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      key={key("date")}
                      type="date"
                      defaultValue={r.preferredDate}
                      disabled={locked || busy}
                      aria-label={`Preferred date for ${r.code}`}
                      onBlur={(e) => e.target.value !== r.preferredDate && send(r.id, { preferredDate: e.target.value })}
                    />
                  </td>
                  <td className="num">
                    <input
                      key={key("cost")}
                      type="number"
                      min="0"
                      defaultValue={r.cost}
                      disabled={locked || busy}
                      aria-label={`Cost for ${r.code}`}
                      onBlur={(e) => Number(e.target.value) !== r.cost && send(r.id, { cost: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    {locked ? (
                      <span className="pill completed">Completed</span>
                    ) : (
                      <select
                        key={key("status")}
                        defaultValue={r.status}
                        disabled={busy}
                        aria-label={`Status for ${r.code}`}
                        onChange={(e) => send(r.id, { status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In progress</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <input
                      key={key("note")}
                      defaultValue={r.adminNote}
                      placeholder="Add a note"
                      disabled={locked || busy}
                      aria-label={`Admin note for ${r.code}`}
                      onBlur={(e) => e.target.value.trim() !== r.adminNote && send(r.id, { adminNote: e.target.value })}
                    />
                  </td>
                  <td className="nowrap">
                    {locked ? (
                      <div className="conf">
                        <span>Confirmed {when(r.confirmedAt)}</span>
                        <button className="mini" type="button" disabled={busy} onClick={() => send(r.id, { action: "reopen" })}>
                          Reopen to edit
                        </button>
                      </div>
                    ) : confirmId === r.id ? (
                      <div className="conf">
                        <span>Mark as completed and lock?</span>
                        <span className="row">
                          <button className="mini solid" type="button" disabled={busy} onClick={() => send(r.id, { action: "confirm" })}>
                            Yes, confirm
                          </button>
                          <button className="mini" type="button" onClick={() => setConfirmId(null)}>Cancel</button>
                        </span>
                      </div>
                    ) : (
                      <button className="mini solid" type="button" disabled={busy} onClick={() => setConfirmId(r.id)}>
                        Confirm completed
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note" style={{ marginTop: 12 }}>
        Edits save when you leave a field. Completed requests are locked and hidden from the public queue until you reopen them.
      </p>
    </div>
  );
}
