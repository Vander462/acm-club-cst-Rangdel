"use client";

import { useCallback, useEffect, useState } from "react";
import { SERVICES, VERSIONS, STATUS_LABEL, calcCost, nu } from "@/lib/services";
import { ICONS } from "./icons";

const EMPTY = {
  name: "",
  studentId: "",
  phone: "",
  preferredDate: "",
  place: "",
  laptopModel: "",
  notes: "",
  quantity: 1,
  software: "",
  version: "",
  backedUp: false,
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Thimphu",
});

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function validate(service, f) {
  const e = {};
  if (!f.name.trim()) e.name = "Enter your full name.";
  if (!/^[A-Za-z0-9]{5,12}$/.test(f.studentId.trim())) e.studentId = "Enter your student ID.";
  if (!/^\+?[\d\s-]{8,14}$/.test(f.phone.trim())) e.phone = "Enter a phone number we can reach, such as 17123456.";
  if (!f.place.trim()) e.place = "Tell us where to meet you.";
  if (service.id === "install-software") {
    const n = Number(f.quantity);
    if (!(n >= 1 && n <= 20)) e.quantity = "Enter a number from 1 to 20.";
    if (!f.software.trim()) e.software = "List the software you need.";
  }
  if (service.id === "install-windows" && !f.backedUp) e.backedUp = "Confirm that you backed up your files.";
  return e;
}

function Field({ label, hint, error, full, htmlFor, children }) {
  return (
    <div className={"fld" + (full ? " full" : "") + (error ? " bad" : "")}>
      <label htmlFor={htmlFor}>
        {label} {hint && <small>({hint})</small>}
      </label>
      {children}
      <span className="err">{error}</span>
    </div>
  );
}

export default function Home() {
  const [service, setService] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState("");
  const [sending, setSending] = useState(false);
  const [queue, setQueue] = useState(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      const r = await fetch("/api/requests", { cache: "no-store" });
      const d = await r.json();
      setQueue(d.requests);
    } catch {
      /* keep the last list */
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const t = setInterval(loadQueue, 20000);
    return () => clearInterval(t);
  }, [loadQueue]);

  useEffect(() => {
    if (!service) return;
    const onKey = (e) => e.key === "Escape" && setService(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [service]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  function openForm(s) {
    setF({ ...EMPTY, version: (VERSIONS[s.id] || [""])[0] });
    setErrs({});
    setFormErr("");
    setService(s);
  }

  const upd = (k) => (e) =>
    setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = validate(service, f);
    setErrs(found);
    setFormErr("");
    if (Object.keys(found).length) return;
    setSending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, service: service.id, quantity: Number(f.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrs(data.errors || {});
        setFormErr(data.error || "Please fix the highlighted fields.");
        return;
      }
      setService(null);
      setFilter("all");
      setToast(`Request ${data.code} sent. Keep this code to follow it in the queue.`);
      loadQueue();
      document.getElementById("queue-h")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setFormErr("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const list = queue || [];
  const counts = {
    all: list.length,
    pending: list.filter((r) => r.status === "pending").length,
    in_progress: list.filter((r) => r.status === "in_progress").length,
  };
  const shown = list.filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <div className="wrap">
        <header className="hero">
          <p className="eyebrow">ACM Club · College of Science and Technology</p>
          <div className="title-row">
            <h1>
              CST <span>Zhabto</span>
            </h1>
            <span className="bo" lang="bo">
              ཞབས་ཏོག
            </span>
          </div>
          <p className="lede">
            Laptop help from the ACM Club. Choose a service, send a short request, and follow it in the queue below
            until a club member finishes it.
          </p>
          <ol className="steps">
            <li>Pick a service</li>
            <li>Fill in the form</li>
            <li>Track it in the queue</li>
          </ol>
        </header>

        <section aria-labelledby="svc-h">
          <div className="sec-head">
            <h2 id="svc-h">Services</h2>
            <p className="note">Prices in Ngultrum (Nu.)</p>
          </div>
          <ul className="menu">
            {SERVICES.map((s) => (
              <li className="svc" key={s.id}>
                <div className="ico">{ICONS[s.icon]}</div>
                <div>
                  <h3>{s.name}</h3>
                  <p className="desc">{s.desc}</p>
                </div>
                <div className="price">
                  <i>Nu.</i>
                  <b>{s.price}</b>
                  <small>{s.unit}</small>
                </div>
                <button className="btn" type="button" onClick={() => openForm(s)}>
                  Request
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="queue-h">
          <div className="sec-head">
            <h2 id="queue-h">Request queue</h2>
            <p className="note">{counts.pending ? `${counts.pending} waiting for a club member` : ""}</p>
          </div>
          <div className="chips" role="group" aria-label="Filter requests">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["in_progress", "In progress"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                className="chip"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
              >
                {label}
                <span>{counts[k]}</span>
              </button>
            ))}
          </div>
          {queue === null ? (
            <div className="empty">Loading the queue…</div>
          ) : shown.length === 0 ? (
            <div className="empty">
              <b>{list.length ? "Nothing in this filter" : "No active requests"}</b>
              {list.length ? "Try another filter." : "Choose a service above to send one."}
            </div>
          ) : (
            <div className="queue">
              {shown.map((r) => (
                <article className="req" key={r.code}>
                  <div className="req-top">
                    <span className="code">{r.code}</span>
                    <span className={"pill " + r.status}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <h3>{r.serviceName}</h3>
                  <p className="meta">
                    {r.firstName} · sent {fmt.format(new Date(r.createdAt))}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer>
          ACM Club, College of Science and Technology, Royal University of Bhutan. Finished requests are removed from
          this list. Contact details are visible to club members only.
        </footer>
      </div>

      {service && (
        <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && setService(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
            <div className="sheet-head">
              <div>
                <h2 id="sheetTitle">{service.name}</h2>
                <p>
                  {nu(service.price)} {service.unit}
                </p>
              </div>
              <button className="x" type="button" aria-label="Close form" onClick={() => setService(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={submit} noValidate>
              <Field label="Full name" error={errs.name} htmlFor="f-name">
                <input id="f-name" type="text" autoComplete="name" autoFocus value={f.name} onChange={upd("name")} />
              </Field>
              <Field label="Student ID" error={errs.studentId} htmlFor="f-sid">
                <input id="f-sid" type="text" inputMode="numeric" placeholder="e.g. 02230155" value={f.studentId} onChange={upd("studentId")} />
              </Field>
              <Field label="Phone number" error={errs.phone} htmlFor="f-phone">
                <input id="f-phone" type="tel" autoComplete="tel" placeholder="17xxxxxx" value={f.phone} onChange={upd("phone")} />
              </Field>
              <Field label="Preferred date" hint="optional" error={errs.preferredDate} htmlFor="f-date">
                <input id="f-date" type="date" min={today()} value={f.preferredDate} onChange={upd("preferredDate")} />
              </Field>
              <Field label="Where should we meet you?" full error={errs.place} htmlFor="f-place">
                <input id="f-place" type="text" placeholder="Hostel and room, or a spot on campus" value={f.place} onChange={upd("place")} />
              </Field>
              <Field label="Laptop make and model" hint="optional" full htmlFor="f-model">
                <input id="f-model" type="text" placeholder="e.g. Dell Inspiron 15" value={f.laptopModel} onChange={upd("laptopModel")} />
              </Field>

              {service.id === "install-software" && (
                <>
                  <Field label="How many programs?" error={errs.quantity} htmlFor="x-count">
                    <input id="x-count" type="number" min="1" max="20" value={f.quantity} onChange={upd("quantity")} />
                  </Field>
                  <Field label="Which software?" full error={errs.software} htmlFor="x-list">
                    <textarea id="x-list" placeholder="One per line, e.g. VS Code, XAMPP, Python" value={f.software} onChange={upd("software")} />
                  </Field>
                </>
              )}
              {VERSIONS[service.id] && (
                <Field label={service.id === "activate-office" ? "Office version" : "Windows version"} full htmlFor="x-ver">
                  <select id="x-ver" value={f.version} onChange={upd("version")}>
                    {VERSIONS[service.id].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              )}
              {service.id === "install-windows" && (
                <div className={"fld full" + (errs.backedUp ? " bad" : "")}>
                  <label className="check" htmlFor="x-backup">
                    <input id="x-backup" type="checkbox" checked={f.backedUp} onChange={upd("backedUp")} />
                    <span>I have backed up my files. Installing Windows can erase the drive.</span>
                  </label>
                  <span className="err">{errs.backedUp}</span>
                </div>
              )}

              <Field label="Anything else we should know?" hint="optional" full htmlFor="f-notes">
                <textarea id="f-notes" value={f.notes} onChange={upd("notes")} />
              </Field>

              <div className="cost">
                <span>Estimated cost</span>
                <b>{nu(calcCost(service.id, Number(f.quantity)))}</b>
              </div>
              {formErr && <p className="err" style={{ gridColumn: "1 / -1" }}>{formErr}</p>}
              <div className="actions">
                <button className="btn ghost" type="button" onClick={() => setService(null)}>
                  Cancel
                </button>
                <button className="btn" type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
