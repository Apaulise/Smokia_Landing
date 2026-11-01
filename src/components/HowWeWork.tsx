import Lines from "./Lines";

const STEPS = [
  {
    n: "01",
    t: "Entender",
    d: "Entendemos cómo funciona hoy tu negocio: sus procesos, herramientas y cuellos de botella.",
  },
  {
    n: "02",
    t: "Detectar",
    d: "Encontramos procesos lentos, repetitivos o información que hoy se está desaprovechando.",
  },
  {
    n: "03",
    t: "Construir",
    d: "Diseñamos e implementamos soluciones a medida, adaptadas a cómo trabajás realmente.",
  },
];

const CHAIN = ["Negocio", "Oportunidad", "Tecnología", "Impacto"];

export default function HowWeWork() {
  return (
    <section id="soluciones" className="section">
      <div className="wrap">
        <div style={{ maxWidth: 900, marginBottom: "clamp(56px,7vw,92px)" }}>
          <div data-reveal="fade" className="eyebrow" style={{ marginBottom: 26 }}>
            Cómo lo hacemos
          </div>
          <Lines
            as="h2"
            className="h1"
            lines={["Encontramos oportunidades.", <span key="2" className="dim">Construimos soluciones.</span>]}
          />
          <p data-reveal className="lead" style={{ marginTop: 28, maxWidth: 560, ["--rd" as string]: "260ms" }}>
            Del negocio a la oportunidad, de la oportunidad a la tecnología, de la tecnología al impacto.
            Un camino claro, sin humo.
          </p>
        </div>

        {/* Tres pasos separados por hairlines, sin cajas. */}
        <div className="steps" data-stagger="90">
          {STEPS.map((s) => (
            <div className="step" data-reveal key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3 className="h3" style={{ marginBottom: 12 }}>{s.t}</h3>
              <p className="small">{s.d}</p>
            </div>
          ))}
        </div>

        <div data-reveal style={{ marginTop: "clamp(44px,6vw,72px)" }}>
          <div className="chain">
            {CHAIN.map((c, i) => (
              <span key={c} style={{ display: "contents" }}>
                <span className={`chain-i${i === CHAIN.length - 1 ? " on" : ""}`}>{c}</span>
                {i < CHAIN.length - 1 && <span className="chain-sep" aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
