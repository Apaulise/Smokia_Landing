import { links } from "@/config";
import { FaLinkedin, FaInstagram, FaWhatsapp } from "react-icons/fa";

const SOCIALS = [
  { href: links.linkedin, label: "LinkedIn", Icon: FaLinkedin },
  { href: links.instagram, label: "Instagram", Icon: FaInstagram },
  { href: links.whatsapp, label: "WhatsApp", Icon: FaWhatsapp },
];

export default function Footer() {
  return (
    <footer style={{ position: "relative", padding: "clamp(56px,7vw,88px) var(--page-pad) 44px", borderTop: "1px solid var(--line)" }}>
      <div className="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ maxWidth: 300 }}>
          <div className="brand" style={{ marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/smokia-mark.png" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
            Smok<span className="dim">IA</span>
          </div>
          <p className="small" style={{ color: "var(--ink-3)", marginBottom: 22 }}>
            Soluciones de IA construidas alrededor de negocios reales.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {SOCIALS.map(({ href, label, Icon }) => (
              <a key={label} className="icon-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "clamp(40px,7vw,88px)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 2 }}>Explorar</span>
            <a className="foot-link" href="#soluciones">Soluciones</a>
            <a className="foot-link" href="#proyectos">Proyectos</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 2 }}>Contacto</span>
            <a className="foot-link" href={links.cta}>Agendar llamada</a>
            <a className="foot-link" href="#contacto">Escribinos</a>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ marginTop: 44, paddingTop: 26, borderTop: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>© 2026 SmokIA · Argentina</span>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Primero el problema. Después la tecnología.</span>
      </div>
    </footer>
  );
}
