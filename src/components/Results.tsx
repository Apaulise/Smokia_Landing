import ImageStack, { type StackSlide } from "./ImageStack";
import CrmMockup from "./CrmMockup";
import Lines from "./Lines";
import { links } from "@/config";

// La foto real del local más la pantalla ilustrada del sistema.
const TH_SLIDES: StackSlide[] = [
  {
    label: "La fachada real",
    src: "/th-barber-fachada.jpg",
    alt: "Fachada de TH Barbershop Studio: cartel de madera con el logo, poste de barbero y el local visto a través de la vidriera",
  },
  {
    label: "El sistema (ilustrativo)",
    content: <CrmMockup />,
    designWidth: 400,
    alt: "Ilustración del sistema de TH Barbershop: lista de clientes clasificados como nuevos, activos, próximos a regresar o en riesgo, con facturación y cobertura",
  },
];

export default function Results() {
  if (!links.showResults) return null;

  return (
    <section className="section">
      <div className="wrap">
        <div style={{ maxWidth: 900, marginBottom: "clamp(52px,7vw,84px)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Impacto
          </div>
          <Lines as="h2" className="h1" lines={["La tecnología importa.", <span key="2" className="dim">El resultado importa más.</span>]} />
        </div>

        <div className="zig" style={{ alignItems: "center" }}>
          <div className="zig-text" data-reveal>
            <div className="tagrow">
              <span className="tag" style={{ borderColor: "var(--success)", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                CASO REAL
              </span>
            </div>

            <h3 className="h3" style={{ marginBottom: 20 }}>
              TH Barbershop — de local sin registro a sistema de retención de clientes
            </h3>

            <p className="small" style={{ marginBottom: 14 }}>
              TH Barbershop, una barbería con equipo de 3 barberos, no tenía forma de saber quién era cliente
              nuevo, quién volvía y quién se estaba yendo sin avisar. Cada visita se perdía en la memoria del
              dueño o del barbero de turno, y las promociones de reactivación se disparaban a ciegas.
            </p>
            <p className="small" style={{ marginBottom: 14 }}>
              Desarrollamos un CRM a medida que registra cada visita en segundos —servicio, monto, medio de pago
              y barbero— y clasifica automáticamente a cada cliente según su comportamiento real: nuevo, activo,
              próximo a regresar o en riesgo de perderse.
            </p>
            <p className="small" style={{ color: "var(--ink)" }}>
              El resultado: <span className="mono" style={{ color: "var(--signal-text)", fontWeight: 500 }}>92%</span>{" "}
              de las visitas quedan identificadas con ficha de cliente (vs. registro nulo antes), con seguimiento
              automático de tasa de recurrencia, facturación por medio de pago y horarios pico. Hoy TH Barbershop
              sabe, en tiempo real, cuánto factura, quién está por volver y a quién tiene que escribirle antes de
              perderlo.
            </p>
          </div>

          <div data-reveal="media">
            <ImageStack slides={TH_SLIDES} />
          </div>
        </div>
      </div>
    </section>
  );
}
