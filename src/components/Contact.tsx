"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { links } from "@/config";
import Lines from "./Lines";

const TEAM_SIZES = ["Solo yo", "2–10 personas", "11–50 personas", "51–200 personas", "Más de 200"];

const BULLETS = [
  "Contanos cómo trabaja hoy tu empresa",
  "Detectamos dónde la tecnología puede generar impacto",
  "Te respondemos por mail, sin compromiso",
];

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "company", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errs: FieldErrors = {};
  if (!String(data.name ?? "").trim()) errs.name = "Escribí tu nombre.";
  const email = String(data.email ?? "").trim();
  if (!email) errs.email = "Escribí tu email.";
  else if (!EMAIL_RE.test(email)) errs.email = "Revisá el email: parece incompleto.";
  if (!String(data.company ?? "").trim()) errs.company = "Escribí el nombre de tu empresa.";
  return errs;
}

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const errs = validate(data);
    setFieldErrors(errs);
    const first = (["name", "email", "company"] as const).find((k) => errs[k]);
    if (first) {
      setStatus("idle");
      setError("");
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "No pudimos enviar tu mensaje.");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje.");
      setStatus("error");
    }
  }

  const clear = (k: keyof FieldErrors) => () =>
    fieldErrors[k] && setFieldErrors((f) => ({ ...f, [k]: undefined }));

  return (
    <section id="contacto" className="section">
      <div
        className="wrap"
        style={{ display: "grid", gridTemplateColumns: "minmax(0,.95fr) minmax(0,1.05fr)", gap: "clamp(44px,6vw,88px)", alignItems: "start" }}
        data-contact
      >
        <div>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Contacto
          </div>
          <Lines as="h2" className="h2" lines={["Hablemos de tu negocio."]} />

          <ul style={{ listStyle: "none", margin: "clamp(30px,4vw,42px) 0 36px", padding: 0, display: "flex", flexDirection: "column", gap: 0 }} data-stagger="80">
            {BULLETS.map((b) => (
              <li
                key={b}
                data-reveal
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--line)", fontSize: 15.5, color: "var(--ink-2)" }}
              >
                <svg width="15" height="15" style={{ flex: "none", color: "var(--smoke-4)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          <p data-reveal className="small" style={{ color: "var(--ink-3)", marginBottom: 16 }}>¿Preferís hablar directamente?</p>
          <div data-reveal style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn-ghost" href={links.cal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Agendar llamada
            </a>
            <a className="btn btn-ghost" href={links.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", borderColor: "#25d36659" }}>
              <FaWhatsapp size={17} />
              WhatsApp
            </a>
          </div>
        </div>

        {/* El formulario sí es un bloque independiente: card con el radio máximo. */}
        <div
          data-reveal="media"
          style={{ padding: "clamp(24px,3.4vw,40px)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-strong)", background: "#1b1b1ee0", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {status === "sent" ? (
            <div role="status" style={{ padding: "40px 8px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--success-soft)", color: "var(--success)", marginBottom: 20 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="h3" style={{ marginBottom: 10 }}>Mensaje enviado</h3>
              <p className="small" style={{ marginBottom: 26 }}>Gracias por escribirnos. Te respondemos por mail lo antes posible.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="form">
              {/* Trampa para bots: invisible para personas. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />

              <div className="f-row">
                <label className="field">
                  <span>Nombre completo</span>
                  <input className="input" name="name" type="text" required aria-required="true" aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "e-name" : undefined} onChange={clear("name")} maxLength={120} autoComplete="name" placeholder="Tu nombre" />
                  {fieldErrors.name && <small id="e-name" role="alert" className="err">{fieldErrors.name}</small>}
                </label>
                <label className="field">
                  <span>Email</span>
                  <input className="input" name="email" type="email" required aria-required="true" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "e-email" : undefined} onChange={clear("email")} maxLength={200} autoComplete="email" placeholder="tu@empresa.com" />
                  {fieldErrors.email && <small id="e-email" role="alert" className="err">{fieldErrors.email}</small>}
                </label>
              </div>

              <div className="f-row">
                <label className="field">
                  <span>Empresa</span>
                  <input className="input" name="company" type="text" required aria-required="true" aria-invalid={!!fieldErrors.company} aria-describedby={fieldErrors.company ? "e-company" : undefined} onChange={clear("company")} maxLength={160} autoComplete="organization" placeholder="Nombre de tu empresa" />
                  {fieldErrors.company && <small id="e-company" role="alert" className="err">{fieldErrors.company}</small>}
                </label>
                <label className="field">
                  <span>Tamaño del equipo <em>(opcional)</em></span>
                  <select className="input" name="teamSize" defaultValue="">
                    <option value="" disabled>Cantidad de personas</option>
                    {TEAM_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>¿Qué te gustaría mejorar? <em>(opcional)</em></span>
                <textarea className="input" name="details" rows={4} maxLength={4000} placeholder="Contanos sobre tu negocio y qué procesos te gustaría mejorar..." />
              </label>

              <label className="field">
                <span>¿Cómo nos conociste? <em>(opcional)</em></span>
                <input className="input" name="source" type="text" maxLength={500} placeholder="Instagram, recomendación, Google..." />
              </label>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
                <button type="submit" disabled={status === "sending"} className="btn btn-primary btn-lg">
                  {status === "sending" ? "Enviando…" : "Enviar mensaje"}
                </button>
                {status === "error" && (
                  <span role="alert" className="err">{error}</span>
                )}
              </div>

              <p className="small" style={{ fontSize: 13, color: "var(--ink-3)" }}>
                Usamos tus datos solamente para responderte. No los compartimos con terceros.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
