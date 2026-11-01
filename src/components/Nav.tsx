"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { links } from "@/config";

const NAV_LINKS = [
  { href: "#soluciones", label: "Soluciones" },
  { href: "#metodologia", label: "Cómo trabajamos" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacto", label: "Contacto" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      // El sistema admite un solo CTA primario por vista.
      setPastHero(window.scrollY > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Marca en el nav la sección que se está leyendo.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // La sección visible más arriba gana.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive("#" + visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // El panel móvil se cierra solo al pasar al layout de escritorio.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Esc cierra el panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className={scrolled || open ? "nav nav-on" : "nav"}>
      <div className="nav-inner">
        <a href="#top" className="brand" aria-label="SmokIA, inicio">
          <Image src="/smokia-mark.png" alt="" width={21} height={21} priority style={{ objectFit: "contain" }} />
          <span>
            Smok<span className="dim">IA</span>
          </span>
        </a>

        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link" aria-current={active === l.href ? true : undefined}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="nav-right">
          <a
            href={links.cta}
            data-cta="nav_cta"
            className={`btn nav-cta ${pastHero ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "11px 18px" }}
          >
            Analicemos tu negocio
          </a>
          <button
            className="burger"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="menu-movil"
        ref={menu}
        className="nav-mobile"
        style={{ maxHeight: open ? (menu.current?.scrollHeight ?? 420) : 0 }}
      >
        <div className="nav-mobile-in">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-mobile-link"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              {l.label}
            </a>
          ))}
          <a
            href={links.cta}
            data-cta="nav_mobile_cta"
            className="btn btn-primary"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            style={{ marginTop: 20 }}
          >
            Analicemos tu negocio
          </a>
        </div>
      </div>
    </nav>
  );
}
