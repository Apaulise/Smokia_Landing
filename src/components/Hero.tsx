import { links } from "@/config";
import Lines from "./Lines";
import HeroShowreel from "./HeroShowreel";

const Arrow = ({ s = 17 }: { s?: number }) => (
  <svg className="arr" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Hero() {
  return (
    <header
      id="top"
      className="section"
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        paddingTop: "clamp(128px,18vh,190px)",
        paddingBottom: "clamp(72px,10vh,120px)",
      }}
    >
      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero-grid">
        <div style={{ maxWidth: "min(800px, 94%)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: "clamp(24px,3vw,34px)" }}>
            AI · Automatización · Software
          </div>

          <Lines
            as="h1"
            className="display"
            delay={60}
            lines={[
              "Tu negocio puede",
              "funcionar mejor.",
              <span key="3" className="dim">Encontramos cómo.</span>,
            ]}
          />

          <p data-reveal className="lead" style={{ margin: "clamp(26px,3vw,36px) 0 0", maxWidth: 520, ["--rd" as string]: "320ms" }}>
            Analizamos cómo funciona tu empresa, detectamos procesos que pueden mejorar y construimos
            soluciones usando Inteligencia Artificial, automatización y software.
          </p>

          <div
            data-reveal
            style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: "clamp(30px,3.5vw,42px)", ["--rd" as string]: "400ms" }}
          >
            <a className="btn btn-primary btn-lg" href={links.cta} data-cta="hero_cta">
              Analicemos tu negocio
              <Arrow s={18} />
            </a>
            <a className="btn btn-ghost btn-lg" href="#soluciones" data-cta="solutions_cta">
              Ver soluciones
            </a>
          </div>

          <p
            data-reveal
            className="mono"
            style={{ margin: "clamp(24px,3vw,32px) 0 0", fontSize: 12, letterSpacing: ".04em", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 9, ["--rd" as string]: "480ms" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Primera conversación sin compromiso.
          </p>
        </div>

        <div data-reveal="fade" style={{ ["--rd" as string]: "300ms" }}>
          <HeroShowreel />
        </div>
        </div>
      </div>

      {/* Indicio de scroll: una línea que respira. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "var(--page-pad)", bottom: "clamp(28px,5vh,52px)", display: "flex", alignItems: "center", gap: 12 }}
      >
        <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          Scroll
        </span>
        <span style={{ display: "block", width: 46, height: 1, background: "var(--line-strong)", overflow: "hidden", position: "relative" }}>
          <span style={{ position: "absolute", inset: 0, background: "var(--signal)", transformOrigin: "left", animation: "scrollcue 2.6s var(--ease-smoke) infinite" }} />
        </span>
      </div>
    </header>
  );
}
