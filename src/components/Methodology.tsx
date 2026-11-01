"use client";

import { useEffect, useRef, useState } from "react";
import { links } from "@/config";
import Lines from "./Lines";

const STEPS = [
  { n: "01", t: "Descubrimiento", d: "Conversamos sobre cómo funciona actualmente tu negocio." },
  { n: "02", t: "Auditoría", d: "Analizamos procesos y encontramos oportunidades concretas." },
  { n: "03", t: "Propuesta", d: "Definimos una solución concreta y el impacto esperado." },
  { n: "04", t: "Prototipo", d: "Construimos rápidamente una primera versión funcional." },
  { n: "05", t: "Implementación", d: "Integramos la solución dentro del flujo real de trabajo." },
  { n: "06", t: "Medición", d: "Analizamos resultados y buscamos nuevas mejoras." },
];

export default function Methodology() {
  const tl = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(0);

  // La línea se dibuja a medida que el timeline cruza la mitad de la pantalla,
  // y cada paso se "enciende" al llegar. Es el gesto de humo del sistema,
  // llevado a la narrativa de la página.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReached(STEPS.length);
      return;
    }
    const el = tl.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mark = window.innerHeight * 0.58;
      const p = Math.min(1, Math.max(0, (mark - r.top) / Math.max(1, r.height)));
      el.style.setProperty("--tp", String(p));
      setReached(Math.round(p * STEPS.length));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="metodologia" className="section">
      <div className="wrap-narrow">
        <div style={{ marginBottom: "clamp(52px,7vw,88px)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Metodología
          </div>
          <Lines
            as="h2"
            className="h2"
            lines={[
              "No empezamos hablando",
              "de Inteligencia Artificial.",
              <span key="3" className="dim">Empezamos hablando de tu negocio.</span>,
            ]}
          />
        </div>

        <div className="tl" ref={tl}>
          {STEPS.map((s, i) => (
            <div className={`tl-step${i < reached ? " on" : ""}`} key={s.n}>
              <span className="tl-n mono">{s.n}</span>
              <div className="tl-body">
                <h3 className="h4" style={{ marginBottom: 6 }}>{s.t}</h3>
                <p className="small">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div data-reveal style={{ marginTop: "clamp(44px,6vw,64px)", paddingLeft: 68 }}>
          <a className="arrow-link" href={links.cta} data-cta="methodology_cta">
            Empecemos por el paso 01
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
