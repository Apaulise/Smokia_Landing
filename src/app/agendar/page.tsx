import type { Metadata } from "next";
import { links } from "@/config";
import CalEmbed from "@/components/CalEmbed";
import ParticleField from "@/components/ParticleField";

export const metadata: Metadata = {
  title: "Agendar llamada — SmokIA",
  description: "Elegí día y horario para una llamada de diagnóstico sin compromiso con SmokIA.",
};

export default function AgendarPage() {
  const calLink = links.calSlug.replace(/^https?:\/\/(app\.)?cal\.com\//, "").replace(/^\/+|\/+$/g, "");

  return (
    <>
      <ParticleField intensity={0.4} />
      <main className="page" style={{ minHeight: "100vh", padding: "clamp(22px,3vw,34px) var(--page-pad) 72px" }}>
        <div className="wrap" style={{ maxWidth: 1080 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: "clamp(40px,6vw,72px)" }}>
            <a href="/" className="brand" aria-label="SmokIA, inicio">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/smokia-mark.png" alt="" width={21} height={21} style={{ objectFit: "contain" }} />
              <span>
                Smok<span className="dim">IA</span>
              </span>
            </a>
            <a className="foot-link" href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver al sitio
            </a>
          </header>

          <div style={{ textAlign: "center", marginBottom: "clamp(32px,5vw,56px)" }}>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 22 }}>
              Agendar llamada
            </div>
            <h1 className="h2">Elegí el día y horario que te quede cómodo.</h1>
            <p className="lead" style={{ margin: "20px auto 0", maxWidth: 520 }}>
              Al confirmar, la reunión queda agendada en nuestro calendario y te llega la invitación por mail.
            </p>
          </div>

          {calLink ? (
            <div style={{ minHeight: 640, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--line-strong)", background: "var(--surface)" }}>
              <CalEmbed calLink={calLink} />
            </div>
          ) : (
            <div style={{ padding: "56px 24px", textAlign: "center", borderRadius: "var(--radius-lg)", border: "1px dashed var(--line-strong)", background: "#1b1b1ecc" }}>
              <p className="small">
                El calendario todavía no está configurado. Definí{" "}
                <span className="mono" style={{ color: "var(--signal-text)" }}>NEXT_PUBLIC_CAL_LINK</span>{" "}
                (por ejemplo <span className="mono" style={{ color: "var(--signal-text)" }}>usuario/llamada-diagnostico</span>) y reiniciá el servidor.
              </p>
            </div>
          )}

          <p className="small" style={{ margin: "30px 0 0", textAlign: "center", color: "var(--ink-3)" }}>
            ¿Preferís escribirnos?{" "}
            <a href="/#contacto" style={{ color: "var(--signal-text)" }}>Dejanos un mensaje</a> y te respondemos por mail.
          </p>
        </div>
      </main>
    </>
  );
}
