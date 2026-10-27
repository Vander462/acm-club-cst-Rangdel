 "use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SERVICES, STATUS_LABEL, nu } from "@/lib/services";

const empty = { name: "", studentId: "", phone: "", software: "", preferredDate: "", service: "install-software", cost: 50 };
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Thimphu" });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

export default function Home() {
  const [form, setForm] = useState(empty);
  const [showRequest, setShowRequest] = useState(false);
  const [identity, setIdentity] = useState({ studentId: "", phone: "" });
  const [requests, setRequests] = useState([]);
  const selectedService = SERVICES.find((item) => item.id === form.service) || SERVICES[0];
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function loadRequests(id = identity.studentId, phone = identity.phone) {
    if (!id || !phone) { setRequests([]); return; }
    try {
      const r = await fetch(`/api/requests?studentId=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
      const d = await r.json(); setRequests(d.requests || []);
    } catch {}
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("zhabto-identity") || "null");
      if (saved?.studentId && saved?.phone) { setIdentity(saved); loadRequests(saved.studentId, saved.phone); }
    } catch {}
  }, []);
  useEffect(() => {
    if (!identity.studentId || !identity.phone) return;
    const timer = setInterval(() => loadRequests(), 7000);
    return () => clearInterval(timer);
  }, [identity.studentId, identity.phone]);
  useEffect(() => {
    if (!chatId) return;
    const req = requests.find(x => x.id === chatId);
    if (!req) return;
    const load = async () => {
      const r = await fetch(`/api/requests/${chatId}/messages?studentId=${encodeURIComponent(identity.studentId)}&phone=${encodeURIComponent(identity.phone)}`, { cache: "no-store" });
      const d = await r.json(); if (r.ok) setMessages(d.messages || []);
    };
    load(); const timer = setInterval(load, 4000); return () => clearInterval(timer);
  }, [chatId, identity.studentId, identity.phone, requests.length]);

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); }
  async function submit(e) {
    e.preventDefault(); setErrors({}); setNotice("");
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter your full name.";
    if (!form.studentId.trim()) errs.studentId = "Enter your student ID.";
    if (!/^\+?[\d\s-]{8,18}$/.test(form.phone.trim())) errs.phone = "Enter a valid contact number.";
    if (!form.software.trim()) errs.software = "Enter the software you need.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, service: form.service }) });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors || {}); setNotice(data.error || "Please check your details."); return; }
      const who = { studentId: form.studentId.trim(), phone: form.phone.trim() };
      setIdentity(who); localStorage.setItem("zhabto-identity", JSON.stringify(who));
      await loadRequests(who.studentId, who.phone);
      setForm({ ...empty, name: form.name, studentId: form.studentId, phone: form.phone, service: form.service, cost: form.cost });
      setNotice(`Request ${data.code} submitted successfully.`);
      setShowRequest(false);
    } catch { setNotice("Could not reach the server. Please try again."); }
    finally { setSending(false); }
  }
  async function sendMessage(e) {
    e.preventDefault(); if (!message.trim() || !chatId) return;
    const body = message.trim(); setMessage("");
    const r = await fetch(`/api/requests/${chatId}/messages?studentId=${encodeURIComponent(identity.studentId)}&phone=${encodeURIComponent(identity.phone)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: body }) });
    const d = await r.json(); if (!r.ok) setNotice(d.error || "Message could not be sent.");
    else {
      const rr = await fetch(`/api/requests/${chatId}/messages?studentId=${encodeURIComponent(identity.studentId)}&phone=${encodeURIComponent(identity.phone)}`);
      const dd = await rr.json(); setMessages(dd.messages || []);
    }
  }
  const activeChat = requests.find(r => r.id === chatId);
  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><Image src="/acm-logo.png" alt="ACM logo" width={54} height={54} priority /><div><span className="eyebrow">ACM Club · CST</span><h1>CST <span>Zhabto</span></h1></div></div>
      <a className="admin-link" href="/admin/login">Admin portal ↗</a>
    </header>
    <section className="hero-panel">
      <div className="hero-copy"><span className="tag">CAMPUS IT SUPPORT</span><h2>Tech help,<br/><em>without the hassle.</em></h2><p>Request software installation and IT support from the ACM Club. Track your request and chat with the in-charge in one place.</p>
        <div className="hero-points"><span>01 · Send request</span><span>02 · Confirm together</span><span>03 · Get it done</span></div>
      </div><div className="hero-art"><div className="orb">Z<span>ཞབས་ཏོག</span></div><div className="floating-card"><span className="live-dot"></span> Support requests <b>made simple</b></div></div>
    </section>
    <section className="section services-section" id="services">
      <div className="section-heading"><div><span className="eyebrow">01 / OUR SERVICES</span><h2>How can we help you?</h2></div><p>Explore the support available from the ACM Club. Choose a service to start your request.</p></div>
      <div className="services-grid">{SERVICES.map((item, index) => <article className="service-card" key={item.id}>
        <div className="service-card-top"><span className="service-number">0{index + 1}</span><span className="service-icon">{["↓", "⌘", "▣", "▤"][index]}</span></div>
        <h3>{item.name}</h3><p>{item.desc}</p>
        <div className="service-card-bottom"><div><strong>{`Nu. ${item.price}`}</strong><span>{item.unit}</span></div><button type="button" className="service-request-btn" onClick={() => { setForm(p => ({ ...p, service: item.id, cost: item.price, software: item.id === "install-software" ? p.software : item.name })); setErrors({}); setNotice(""); setShowRequest(true); }}>Request service <span>↗</span></button></div>
      </article>)}</div>
    </section>
    <section className="section requests-section">
      <div className="section-heading"><div><span className="eyebrow">03 / YOUR SPACE</span><h2>Your requests</h2></div><p>Only requests matching your student ID and contact number are shown here.</p></div>
      <form className="identity-bar" onSubmit={e=>{e.preventDefault();localStorage.setItem("zhabto-identity",JSON.stringify(identity));loadRequests();}}>
        <label>Student ID<input value={identity.studentId} onChange={e=>setIdentity(p=>({...p,studentId:e.target.value}))} placeholder="Your student ID"/></label>
        <label>Contact number<input value={identity.phone} onChange={e=>setIdentity(p=>({...p,phone:e.target.value}))} placeholder="Same number used in request"/></label>
        <button className="secondary-btn">View my requests</button>
      </form>
      {!identity.studentId || !identity.phone ? <div className="empty-state">Enter the student ID and contact number used in your request to view its status.</div> : requests.length === 0 ? <div className="empty-state">No requests found for these details yet.</div> :
        <div className="request-list">{requests.map(r=><article className="request-card" key={r.id}>
          <div className="request-card-top"><span className="ticket">{r.code}</span><span className={`status ${r.status}`}>{STATUS_LABEL[r.status]}</span></div>
          <h3>{r.serviceName}</h3><p className="request-detail">{r.details}</p>
          <div className="request-meta"><span>Cost <b>{nu(r.cost)}</b></span><span>Date <b>{r.preferredDate || "To be confirmed"}</b></span></div>
          <div className="incharge-line"><span>In-charge</span><b>{r.incharge || "Waiting for assignment"}</b></div>
          {r.status === "in_progress" && <div className="accepted-banner">✓ Your request has been accepted. Chat below to confirm the meeting date.</div>}
          <button className="chat-btn" onClick={()=>{setChatId(r.id);setMessages([]);}} type="button">Open conversation <span>↗</span></button>
        </article>)}</div>}
    </section>
    {showRequest && <div className="modal-backdrop request-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowRequest(false)}><section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
      <header className="request-modal-head"><div><span className="eyebrow">ACM CLUB · REQUEST FORM</span><h2 id="request-modal-title">What do you need help with?</h2><p>Fill in the essentials. The team will message you to confirm the details.</p><span className="selected-service-pill">Selected service: <b>{selectedService.name}</b></span></div><button className="close-btn" type="button" onClick={()=>setShowRequest(false)} aria-label="Close request form">×</button></header>
      <form className="request-form request-form-modal" onSubmit={submit}>
        <div className="form-grid">
          <label>Full name<input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Your full name"/>{errors.name&&<small className="field-error">{errors.name}</small>}</label>
          <label>Student ID<input value={form.studentId} onChange={e=>update("studentId",e.target.value)} placeholder="e.g. 02230155"/>{errors.studentId&&<small className="field-error">{errors.studentId}</small>}</label>
          <label>Contact number<input type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="17xxxxxx"/>{errors.phone&&<small className="field-error">{errors.phone}</small>}</label>
          <label>Preferred date <span className="optional">Optional</span><input type="date" min={today()} value={form.preferredDate} onChange={e=>update("preferredDate",e.target.value)}/></label>
          <label className="span-2">{form.service === "install-software" ? "Which software do you need?" : "Details / software or version needed"}<textarea rows="3" value={form.software} onChange={e=>update("software",e.target.value)} placeholder="e.g. VS Code, XAMPP, Python, Microsoft Office"/>{errors.software&&<small className="field-error">{errors.software}</small>}</label>
          <label>Estimated cost (Nu.)<input type="number" min="0" value={form.cost} onChange={e=>update("cost",e.target.value)}/></label>
        </div>
        {notice && <p className="notice" role="status">{notice}</p>}
        <div className="form-footer"><p><b>What happens next?</b><br/>An ACM in-charge will accept your request and chat with you to confirm the date.</p><button className="primary-btn" disabled={sending}>{sending ? "Sending request…" : "Submit request"} <span>↗</span></button></div>
      </form>
    </section></div>}
    <footer className="site-footer"><Image src="/acm-logo.png" alt="" width={32} height={32}/><span>ACM Club · College of Science and Technology · Royal University of Bhutan</span></footer>
    {activeChat && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setChatId(null)}><section className="chat-modal">
      <header className="chat-head"><div><span className="eyebrow">{activeChat.code}</span><h2>Request conversation</h2><p>Chat with the ACM in-charge about your request.</p></div><button className="close-btn" onClick={()=>setChatId(null)} aria-label="Close chat">×</button></header>
      <div className="chat-messages">{messages.length===0?<p className="chat-empty">No messages yet. Say hello to coordinate the meeting.</p>:messages.map(m=><div className={`message ${m.senderRole==="student"?"mine":"theirs"}`} key={m.id}><small>{m.senderName || (m.senderRole==="student"?"You":"ACM In-charge")}</small><p>{m.message}</p><time>{dateFmt.format(new Date(m.createdAt))}</time></div>)}</div>
      <form className="chat-compose" onSubmit={sendMessage}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message about your meeting…" maxLength={1000}/><button className="primary-btn" disabled={!message.trim()}>Send ↗</button></form>
    </section></div>}
  </main>;
}
