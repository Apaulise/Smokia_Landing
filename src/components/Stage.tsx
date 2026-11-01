/**
 * La capa de inteligencia, como figura.
 * Entradas reales → una capa que decide → salidas, y los números al pie.
 * Sin card contenedora: las zonas se separan con hairlines (el sistema pide
 * líneas antes que cajas). El único relleno de señal es el núcleo.
 */

const INPUTS = [
  { name: "WhatsApp", meta: "142 consultas" },
  { name: "CRM", meta: "clientes" },
  { name: "Instagram", meta: "mensajes" },
];

const OUTPUTS = ["Datos", "Acción", "Automatización"];

const STATS: { k: string; v: string }[] = [
  { k: "Automatizados", v: "12" },
  { k: "Horas rec.", v: "34h" },
  { k: "Consultas", v: "142" },
  { k: "Eficiencia", v: "+27%" },
];

export default function Stage() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div
          data-reveal="media"
          style={{ paddingTop: "clamp(28px,4vw,40px)", borderTop: "1px solid var(--line)" }}
        >
          {/* Encabezado de la figura */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: "clamp(26px,3.5vw,38px)" }}>
            <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 11.5, letterSpacing: ".06em", color: "var(--ink-2)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "var(--radius-full)", background: "var(--smoke-4)" }} />
              SmokIA · Intelligence Layer
            </span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", padding: "4px 9px", borderRadius: "var(--radius-xs)", border: "1px solid var(--line-strong)", color: "var(--ink-3)" }}>
              EJEMPLO ILUSTRATIVO
            </span>
          </div>

          <div className="flow">
            <div className="flow-row">
              {INPUTS.map((i) => (
                <div className="flow-node" key={i.name}>
                  <b>{i.name}</b>
                  <span className="mono">{i.meta}</span>
                </div>
              ))}
            </div>

            <div className="flow-pipe" aria-hidden="true"><i /></div>

            <div className="flow-core">
              <span style={{ width: 36, height: 36, flex: "none", borderRadius: "var(--radius-sm)", background: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--on-signal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </span>
              <span>
                <b style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Capa de inteligencia</b>
                <span className="mono" style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--signal-text)" }}>analiza · decide · ejecuta</span>
              </span>
            </div>

            <div className="flow-pipe" aria-hidden="true"><i style={{ animationDelay: ".8s" }} /></div>

            <div className="flow-row">
              {OUTPUTS.map((o) => (
                <div className="flow-node" key={o}>
                  <b style={{ color: "var(--ink-2)" }}>{o}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Los números, en mono con cifras tabulares (regla del sistema). */}
          <div
            style={{
              marginTop: "clamp(28px,3.5vw,40px)",
              paddingTop: "clamp(22px,3vw,28px)",
              borderTop: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
              gap: "22px 18px",
            }}
          >
            {STATS.map((s) => (
              <div key={s.k}>
                <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)" }}>{s.k}</div>
                <div className="mono" style={{ marginTop: 6, fontSize: 26, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
