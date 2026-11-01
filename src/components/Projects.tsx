import { links } from "@/config";
import Lines from "./Lines";

const Arrow = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/** Encabezado de proyecto: etiqueta, número, título, problema y solución. */
function Copy({ tag, idx, title, problem, solution }: { tag: string; idx: string; title: string; problem: string; solution: string }) {
  return (
    <div className="zig-text">
      <div className="tagrow">
        <span className="tag">{tag}</span>
        <span className="tag-n">{idx}</span>
      </div>
      <h3 className="h3" style={{ marginBottom: 16 }}>{title}</h3>
      <p className="pl"><b>Problema:</b> {problem}</p>
      <p className="sol"><b>Solución:</b> {solution}</p>
      <a className="arrow-link" href={links.cta}>
        Ver solución
        <Arrow />
      </a>
    </div>
  );
}

/* ----------------------------- Maquetas ---------------------------------- */

function AuditPanel() {
  const rows = [
    { t: "Consultas repetidas por WhatsApp", lvl: "alto", color: "var(--danger)" },
    { t: "Datos de clientes sin usar", lvl: "medio", color: "var(--signal-text)" },
    { t: "Reportes manuales en Excel", lvl: "rápido", color: "var(--success)" },
  ];
  return (
    <div className="panel">
      <div className="panel-bar">
        <span className="dot" /><span className="dot" /><span className="dot" />
        <span className="mono" style={{ marginLeft: 8, fontSize: 10, color: "var(--ink-3)" }}>audit.smokia.app</span>
      </div>
      <div style={{ padding: 18 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "var(--ink-3)", marginBottom: 13 }}>OPORTUNIDADES DETECTADAS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r) => (
            <div className="row" key={r.t}>
              <span style={{ width: 7, height: 7, borderRadius: "var(--radius-full)", background: r.color, flex: "none" }} />
              <span style={{ fontSize: 13, color: "var(--ink)", flex: 1 }}>{r.t}</span>
              <span className="mono" style={{ fontSize: 11, color: r.color }}>{r.lvl}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>Impacto estimado</span>
          <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: "var(--signal-text)" }}>~30h / mes</span>
        </div>
      </div>
    </div>
  );
}

function WhatsAppDemo() {
  const msgs = [
    { me: false, t: "Hola, ¿tienen turnos disponibles esta semana?" },
    { me: true, t: "¡Hola! Sí 🙌 Tengo jueves 15:00 y viernes 10:30. ¿Cuál te queda mejor?" },
    { me: false, t: "Jueves 15hs" },
    { me: true, t: "Listo ✅ Reservé jueves 15:00. Te envío recordatorio 1h antes." },
  ];
  return (
    <div className="panel" style={{ maxWidth: 360, margin: "0 auto" }}>
      <div style={{ padding: "14px 16px", background: "#075E54", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z" />
          </svg>
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Asistente SmokIA</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.75)" }}>en línea</div>
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 9, background: "#0B141A" }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.me ? "flex-end" : "flex-start",
              maxWidth: "82%",
              padding: "9px 12px",
              borderRadius: m.me ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
              background: m.me ? "#056162" : "#1F2C33",
              color: m.me ? "#F8FAFC" : "#E2E8F0",
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            {m.t}
          </div>
        ))}
        <div className="mono" style={{ alignSelf: "center", fontSize: 9, color: "#64748B", marginTop: 2 }}>clasificado · agendado · seguimiento automático</div>
      </div>
    </div>
  );
}

function ClientsPanel() {
  const rows = [
    { n: "M. Fernández", v: "hace 5 días", s: "activo", bg: "var(--success-soft)", c: "var(--success)" },
    { n: "J. Gómez", v: "hace 68 días", s: "en riesgo", bg: "var(--signal-soft)", c: "var(--signal-text)" },
    { n: "C. Ruiz", v: "hace 112 días", s: "inactivo", bg: "var(--danger-soft)", c: "var(--danger)" },
  ];
  const cols = "1.4fr 1fr .8fr";
  return (
    <div className="panel">
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Clientes</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>últimos 90 días</span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "8px 10px" }}>
          {["CLIENTE", "ÚLTIMA VISITA", "ESTADO"].map((h, i) => (
            <span className="mono" key={h} style={{ fontSize: 9, letterSpacing: ".08em", color: "var(--ink-3)", textAlign: i === 2 ? "right" : "left" }}>{h}</span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.n} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "11px 10px", borderRadius: "var(--radius-sm)", background: "var(--raised)", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{r.n}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{r.v}</span>
            <span style={{ textAlign: "right" }}>
              <span className="pill-state" style={{ background: r.bg, color: r.c }}>{r.s}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--signal-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>3 clientes listos para recontactar automáticamente</span>
      </div>
    </div>
  );
}

function SiteAuditPanel() {
  return (
    <div className="panel">
      <div className="panel-bar">
        <span className="dot" /><span className="dot" />
        <span className="mono" style={{ marginLeft: 6, fontSize: 9, color: "var(--ink-3)" }}>site-audit</span>
      </div>
      <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", width: 64, height: 64, flex: "none", borderRadius: "var(--radius-full)", background: "conic-gradient(var(--smoke-4) 0 78%,var(--overlay) 78% 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="mono" style={{ width: 48, height: 48, borderRadius: "var(--radius-full)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>78</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ l: "UX", w: "82%" }, { l: "Conversión", w: "64%" }].map((b) => (
            <div key={b.l}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".08em", color: "var(--ink-3)", marginBottom: 4 }}>{b.l}</div>
              <div style={{ height: 4, borderRadius: "var(--radius-xs)", background: "var(--overlay)" }}>
                <div style={{ height: "100%", width: b.w, borderRadius: "var(--radius-xs)", background: "var(--smoke-5)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelPanel() {
  const bars = [
    { h: "38%", c: "var(--smoke-2)" },
    { h: "56%", c: "var(--smoke-3)" },
    { h: "44%", c: "var(--smoke-2)" },
    { h: "72%", c: "var(--smoke-4)" },
    { h: "88%", c: "var(--signal)" },
  ];
  return (
    <div className="panel">
      <div className="panel-bar">
        <span className="dot" /><span className="dot" />
        <span className="mono" style={{ marginLeft: 6, fontSize: 9, color: "var(--ink-3)" }}>rendimiento</span>
      </div>
      <div style={{ padding: 18 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: ".08em", color: "var(--ink-3)", marginBottom: 16 }}>RENDIMIENTO DEL CANAL</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 78 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: b.h,
                borderRadius: "var(--radius-xs) var(--radius-xs) 0 0",
                background: b.c,
                transformOrigin: "bottom",
                animation: `barrise .8s var(--ease-out) ${0.1 + i * 0.1}s both`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Sección ---------------------------------- */

export default function Projects() {
  return (
    <section id="proyectos" className="section">
      <div className="wrap">
        <div style={{ maxWidth: 900, marginBottom: "clamp(60px,8vw,104px)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Proyectos
          </div>
          <Lines as="h2" className="h1" lines={["De problemas reales", <span key="2" className="dim">a herramientas reales.</span>]} />
          <p data-reveal className="lead" style={{ marginTop: 28, maxWidth: 560, ["--rd" as string]: "260ms" }}>
            Prototipos y sistemas que estamos construyendo. Cada uno nace de un problema concreto de negocio.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(72px,10vw,140px)" }}>
          <article className="zig" data-reveal>
            <Copy
              tag="CONCEPT"
              idx="01 / Auditoría"
              title="AI Business Audit"
              problem="las oportunidades de mejora están escondidas dentro de la operación diaria."
              solution="un sistema que analiza digitalmente un negocio y prioriza dónde la tecnología genera más impacto."
            />
            <div data-reveal="media"><AuditPanel /></div>
          </article>

          <article className="zig zig-rev" data-reveal>
            <div data-reveal="media"><WhatsAppDemo /></div>
            <Copy
              tag="DEMO"
              idx="02 / Atención"
              title="WhatsApp AI Assistant"
              problem="se responden las mismas consultas todos los días y se pierden oportunidades."
              solution="un asistente que responde, clasifica consultas y ejecuta acciones directamente por WhatsApp."
            />
          </article>

          <article className="zig" data-reveal>
            <Copy
              tag="PROTOTYPE"
              idx="03 / Clientes"
              title="Customer Intelligence"
              problem="no se sabe qué clientes dejaron de venir ni a quién hacer seguimiento."
              solution="registra clientes, analiza recurrencia, detecta inactivos y facilita seguimientos personalizados."
            />
            <div data-reveal="media"><ClientsPanel /></div>
          </article>

          {/* Los dos conceptos restantes, en pareja. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "clamp(40px,6vw,72px)" }} data-stagger="110">
            <article data-reveal>
              <SiteAuditPanel />
              <div style={{ marginTop: 26 }}>
                <div className="tagrow">
                  <span className="tag">CONCEPT</span>
                  <span className="tag-n">04 / Web</span>
                </div>
                <h3 className="h4" style={{ marginBottom: 12, fontSize: 21 }}>Website Intelligence Audit</h3>
                <p className="small" style={{ marginBottom: 20 }}>
                  Analiza páginas web y detecta oportunidades de comunicación, UX, conversión y posicionamiento.
                </p>
                <a className="arrow-link" href={links.cta}>
                  Ver solución
                  <Arrow />
                </a>
              </div>
            </article>

            <article data-reveal>
              <ChannelPanel />
              <div style={{ marginTop: 26 }}>
                <div className="tagrow">
                  <span className="tag">CONCEPT</span>
                  <span className="tag-n">05 / Contenido</span>
                </div>
                <h3 className="h4" style={{ marginBottom: 12, fontSize: 21 }}>YouTube &amp; Personal Brand Intelligence</h3>
                <p className="small" style={{ marginBottom: 20 }}>
                  Análisis de canales, contenido, posicionamiento y estrategia para marca personal.
                </p>
                <a className="arrow-link" href={links.cta}>
                  Ver solución
                  <Arrow />
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
