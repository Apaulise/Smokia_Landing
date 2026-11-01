import { links } from "@/config";
import Lines from "./Lines";

export default function FinalCta() {
  return (
    <section className="section" style={{ paddingTop: "clamp(110px,15vw,210px)", paddingBottom: "clamp(110px,15vw,210px)" }}>
      <div className="wrap" style={{ maxWidth: 840, textAlign: "center" }}>
        <div
          data-reveal="fade"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: "clamp(28px,4vw,40px)" }}
        >
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-full)", background: "var(--signal)", animation: "ping 2.4s var(--ease-out) infinite" }} />
            <span style={{ position: "relative", width: 7, height: 7, borderRadius: "var(--radius-full)", background: "var(--signal)" }} />
          </span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-2)" }}>
            Disponibles para nuevos proyectos
          </span>
        </div>

        <a href={links.cal} data-cta="final_cta" className="cta-link" style={{ width: "100%" }}>
          <Lines
            as="h2"
            className="h1"
            lines={["Trabajemos juntos", <span key="2" className="dim">en tu próximo gran cambio.</span>]}
          />
          <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72 }}>
            <span className="cta-ring" />
            <svg className="cta-arr" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="8 7 17 7 17 16" />
            </svg>
          </span>
        </a>

        <p data-reveal className="small" style={{ margin: "clamp(28px,4vw,40px) auto 0", maxWidth: 470, ["--rd" as string]: "200ms" }}>
          Agendá una charla de 15 minutos, sin compromiso. Contanos cómo trabajás hoy y buscamos dónde la
          tecnología puede generar impacto.
        </p>
      </div>
    </section>
  );
}
