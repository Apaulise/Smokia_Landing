"use client";

import { useEffect } from "react";

/**
 * Inclina en 3D las maquetas (`.panel`) hacia el puntero: como máximo ±3.5°,
 * con la transición de control del sistema (150 ms, ease-out) y sin brillos ni
 * sombras nuevas. Sólo con puntero fino y sin `prefers-reduced-motion`.
 *
 * Es un atributo (`data-tilt`) y dos variables CSS puestos por DOM sobre
 * elementos que React no gestiona esos campos, así que sobreviven a un
 * re-render. Un solo listener delegado: no toca ningún componente existente.
 */
export default function Tilt3D() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let active: HTMLElement | null = null;
    let raf = 0;
    let lx = 0, ly = 0;

    const release = () => {
      if (!active) return;
      active.removeAttribute("data-tilt");
      active.style.removeProperty("--rx");
      active.style.removeProperty("--ry");
      active = null;
    };

    const apply = () => {
      raf = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      const px = (lx - r.left) / r.width - 0.5;
      const py = (ly - r.top) / r.height - 0.5;
      active.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
      active.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".panel") ?? null;
      if (el !== active) {
        release();
        if (el) {
          active = el;
          el.setAttribute("data-tilt", "");
        }
      }
      if (!active) return;
      lx = e.clientX;
      ly = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", release);
    window.addEventListener("blur", release);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", release);
      window.removeEventListener("blur", release);
      release();
    };
  }, []);

  return null;
}
