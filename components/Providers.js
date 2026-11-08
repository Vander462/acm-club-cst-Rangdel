"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch("/api/providers", { cache: "no-store" });
        const data = await res.json();
        setProviders(Array.isArray(data.providers) ? data.providers : []);
      } catch (error) {
        console.error("Failed to load providers:", error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    }
    loadProviders();
  }, []);

  return (
    <main className="app-shell">
      <Navigation />

      <section className="section providers-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OUR TEAM</span>
            <h2>Meet our service providers</h2>
          </div>
          <p>Connect with our dedicated team members who are ready to help you with your IT needs.</p>
        </div>

        <div className="providers-grid">
          {loading ? (
            <div className="empty-state">Loading service providers...</div>
          ) : providers.length === 0 ? (
            <div className="empty-state">No service providers available yet.</div>
          ) : (
            providers.map((provider) => (
              <article
                className={`provider-card${provider.image ? " has-image" : ""}`}
                key={provider.id}
                style={{ 
                  "--provider-color": provider.color,
                  "--provider-image": provider.image ? `url("${provider.image.replaceAll('"', '%22')}")` : "none"
                }}
              >
                {provider.image && <div className="provider-card-image" aria-hidden="true"></div>}
                <div className="provider-card-content">
                  <div className="provider-card-top">
                    <div className="provider-avatar">
                      {provider.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="provider-department">{provider.department}</span>
                  </div>
                  <h3>{provider.name}</h3>
                  <p className="provider-year">{provider.year}</p>
                  <a
                    className="whatsapp-btn"
                    href={provider.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Chat on WhatsApp</span>
                    <span>↗</span>
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="site-footer">
        <span>ACM Club · College of Science and Technology · Royal University of Bhutan</span>
      </footer>
    </main>
  );
}
