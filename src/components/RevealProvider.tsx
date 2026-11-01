"use client";

import { useEffect } from "react";

/**
 * Orquesta el ingreso de contenido al entrar en viewport.
 *
 * - `[data-reveal]`     → fundido + desplazamiento (variantes en globals.css).
 * - `[data-lines]`      → titulares que suben línea por línea tras una máscara.
 * - `[data-stagger]`    → escalona a sus hijos `[data-reveal]` de a 70 ms.
 *
 * El estado oculto vive detrás de `html.reveal-ready`, que sólo se agrega acá.
 * Sin JS, o con `prefers-reduced-motion`, la clase nunca se agrega y todo el
 * contenido se ve de entrada: la animación es decoración, nunca un requisito.
 */
export default function RevealProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const html = document.documentElement;
    html.classList.add("reveal-ready");

    // Escalonado: cada hijo directo revelable hereda un retardo creciente.
    document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((parent) => {
      const step = Number(parent.dataset.stagger) || 70;
      parent.querySelectorAll<HTMLElement>("[data-reveal]").forEach((child, i) => {
        if (!child.style.getPropertyValue("--rd")) {
          child.style.setProperty("--rd", `${i * step}ms`);
        }
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          // Atributo, no clase: React reescribe `className` cuando re-renderiza
          // y borraría una clase agregada por DOM. Un atributo que React nunca
          // renderizó no entra en su diff, así que sobrevive.
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    const watched = document.querySelectorAll<HTMLElement>("[data-reveal],[data-lines]");
    watched.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      html.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
