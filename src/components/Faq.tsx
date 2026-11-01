"use client";

import { useRef, useState } from "react";
import Lines from "./Lines";

const ITEMS = [
  { q: "¿Qué tipo de empresas pueden trabajar con SmokIA?", a: "Pequeñas y medianas empresas, negocios locales, profesionales y empresas de servicios. Si tenés procesos, probablemente haya algo que mejorar." },
  { q: "¿Necesito saber de Inteligencia Artificial?", a: "No. Nuestro trabajo es entender tu negocio y traducir la tecnología a resultados concretos. Vos ponés el conocimiento del negocio." },
  { q: "¿Qué procesos se pueden automatizar?", a: "Atención de consultas, seguimiento de clientes, tareas administrativas, reportes, recordatorios y conexión entre herramientas que hoy no se comunican." },
  { q: "¿Todas las soluciones utilizan IA?", a: "No. A veces la mejor solución es una automatización simple o un sistema interno. La IA es una herramienta más, no un objetivo." },
  { q: "¿Cuánto tarda una implementación?", a: "Depende del alcance. Solemos empezar con un prototipo rápido para validar el impacto antes de una implementación completa." },
  { q: "¿Pueden integrarse con herramientas que ya usamos?", a: "Sí. Trabajamos con WhatsApp, planillas, CRMs y las herramientas que ya forman parte de tu operación." },
  { q: "¿Cuánto cuesta desarrollar una solución?", a: "Depende del problema y del impacto esperado. La primera conversación y el análisis inicial no tienen costo ni compromiso." },
  { q: "¿Cómo sé si mi empresa tiene algo que automatizar?", a: "No necesitás saberlo. Nuestro trabajo comienza justamente analizando cómo funciona hoy tu empresa y detectando oportunidades donde la tecnología pueda generar impacto." },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <section id="faq" className="section">
      <div className="wrap-narrow">
        <div style={{ marginBottom: "clamp(44px,6vw,72px)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Preguntas frecuentes
          </div>
          <Lines as="h2" className="h2" lines={["Lo que suelen preguntarnos."]} />
        </div>

        <div data-reveal>
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className="faq-item" key={item.q}>
                <button
                  id={`faq-b-${i}`}
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-p-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {item.q}
                  <span className="faq-ico" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-p-${i}`}
                  className="faq-a"
                  role="region"
                  aria-labelledby={`faq-b-${i}`}
                  ref={(el) => {
                    panels.current[i] = el;
                  }}
                  style={{ maxHeight: isOpen ? (panels.current[i]?.scrollHeight ?? 400) : 0 }}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
