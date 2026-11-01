"use client";

import { useEffect, useRef } from "react";

/**
 * Campo de partículas — el gesto de marca de la landing.
 *
 * "Señal y humo": la nube es humo (grises `smoke-2…smoke-5`) y una minoría de
 * partículas son señal (`signal`). Nunca un arcoíris: el sistema lo prohíbe, y
 * además el contraste humo/señal es exactamente lo que cuenta la marca.
 *
 * El scroll recorre seis formas que narran el servicio:
 *   ondas (la marca) → dispersión (la operación desordenada) → grilla (sistema)
 *   → embudo (metodología) → barras (impacto) → convergencia (el llamado).
 *
 * Cada partícula es un resorte hacia su objetivo, así que el morfeo es fluido y
 * el puntero la aparta. Con `prefers-reduced-motion` se dibuja un cuadro fijo
 * por scroll: sin bucle, sin deriva, sin puntero.
 */

type Pt = { x: number; y: number };

/** PRNG determinista: las formas son idénticas en cada carga y cada resize. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type ShapeDef = {
  /** Punto objetivo de la partícula i, en coordenadas normalizadas (~[-1,1]). */
  at: (i: number, n: number, r: () => number) => Pt;
  /**
   * `free`  — la forma elige su lugar en el viewport (hero, cierre).
   * `glyph` — la forma se compacta en el margen libre al costado de la columna
   *           de contenido. Ahí no hay texto, así que puede ser densa y nítida:
   *           es la única manera de que una silueta se lea de verdad.
   */
  role: "free" | "glyph";
  /** Sólo para `free`: centro en fracción del viewport, escala y opacidad. */
  cx?: number;
  cy?: number;
  scale?: number;
  alpha?: number;
  /**
   * Sólo para `glyph`: ancho de la columna de contenido de la sección sobre la
   * que cae esta forma. Las secciones angostas (metodología, FAQ) dejan un
   * margen mucho mayor, así que ahí la figura entra incluso en pantallas donde
   * no entraría junto a una sección ancha.
   */
  content?: number;
};

const TAU = Math.PI * 2;

/** Anchos de columna del layout: .wrap (--page-max) y .wrap-narrow. */
const COL_WIDE = 1160;
const COL_NARROW = 860;

const SHAPES: ShapeDef[] = [
  // 0 · ONDAS — el logo de SmokIA. Tres cintas de humo que se propagan.
  {
    role: "free",
    at: (i, n, r) => {
      const ribbon = i % 3;
      const u = (i / n) * 2 - 1;
      const k = 1.05 + ribbon * 0.4;
      const ph = ribbon * 1.9;
      const amp = 0.34 - ribbon * 0.07;
      const core = amp * Math.sin(u * Math.PI * k + ph) + 0.09 * Math.sin(u * Math.PI * 2.7 + ph);
      // La cinta adelgaza hacia los extremos: se disipa como humo.
      const thick = 0.1 * (1 - 0.5 * Math.abs(u));
      const g = (r() + r() + r() - 1.5) / 1.5;
      return { x: u * 1.2, y: core + g * thick + (ribbon - 1) * 0.06 };
    },
    cx: 0.76, cy: 0.47, scale: 1, alpha: 1,
  },

  // 1 · DISPERSIÓN — la operación tal como está: todo suelto.
  // Pura atmósfera detrás del contenido; no pretende leerse como figura.
  {
    role: "free",
    at: (_i, _n, r) => {
      const a = r() * TAU;
      const d = Math.sqrt(r()) * 1.15;
      return { x: Math.cos(a) * d * 1.5, y: Math.sin(a) * d };
    },
    cx: 0.5, cy: 0.5, scale: 1.15, alpha: 0.18,
  },

  // 2 · GRILLA — lo mismo, ya ordenado en un sistema.
  // 81 nodos con un racimo de partículas cada uno: se lee como retícula, no
  // como un rectángulo relleno.
  {
    role: "glyph",
    content: COL_WIDE,
    at: (i, _n, r) => {
      const cols = 9, rows = 9;
      const k = i % (cols * rows);
      const gx = k % cols;
      const gy = (k / cols) | 0;
      const blob = 0.05;
      return {
        x: (gx / (cols - 1) - 0.5) * 1.8 + (r() - 0.5) * blob,
        y: (gy / (rows - 1) - 0.5) * 1.8 + (r() - 0.5) * blob,
      };
    },
  },

  // 3 · EMBUDO — del negocio al impacto: ancho arriba, una sola salida.
  // Casi la mitad de las partículas se apoyan contra las paredes para que el
  // cono tenga borde; el resto lo rellena.
  {
    role: "glyph",
    content: COL_NARROW,
    at: (i, n, r) => {
      const t = i / n;
      if (t > 0.74) {
        const k = (t - 0.74) / 0.26;
        return { x: (r() - 0.5) * 0.12, y: 0.35 + k * 0.72 };
      }
      const k = Math.sqrt(t / 0.74);
      const y = -1 + k * 1.35;
      const half = 1 * (1 - k) + 0.06;
      const u = r();
      const pos = u > 0.55
        ? (u > 0.775 ? 1 : -1) * (0.88 + r() * 0.12)
        : r() * 2 - 1;
      return { x: pos * half, y };
    },
  },

  // 4 · BARRAS — el impacto, medido. Columnas parejas sobre una línea de base.
  {
    role: "glyph",
    content: COL_NARROW,
    at: (i, _n, r) => {
      const bars = 7;
      if (i % 17 === 0) {
        return { x: (r() * 2 - 1) * 1.04, y: 0.84 + (r() - 0.5) * 0.022 };
      }
      const b = i % bars;
      const hgt = 0.26 + Math.pow(b / (bars - 1), 1.2) * 1.45;
      const cx = (b / (bars - 1) - 0.5) * 1.84;
      return { x: cx + (r() * 2 - 1) * 0.105, y: 0.82 - r() * hgt };
    },
  },

  // 5 · CONVERGENCIA — todo apunta a un punto: la conversación.
  {
    role: "free",
    at: (i, _n, r) => {
      const rays = 14;
      const a = ((i % rays) / rays) * TAU;
      const d = Math.pow(r(), 1.5) * 1.25;   // denso en el centro
      const spread = 0.16 * d * d;           // los rayos se abren hacia afuera
      return {
        x: Math.cos(a) * d * 1.5 + (r() - 0.5) * spread * 1.5,
        y: Math.sin(a) * d + (r() - 0.5) * spread,
      };
    },
    cx: 0.5, cy: 0.58, scale: 0.95, alpha: 0.5,
  },
];

/** Lee los tokens del sistema para que el canvas nunca tenga hex propios. */
function readTokens(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    smoke: [
      v("--smoke-2", "#45474c"),
      v("--smoke-3", "#62656b"),
      v("--smoke-4", "#8a8d92"),
      v("--smoke-5", "#b9bbbe"),
    ],
    signal: v("--signal", "#f2c14e"),
  };
}

export default function ParticleField({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const c2d = el.getContext("2d", { alpha: true });
    if (!c2d) return;
    // Consts no anulables: el narrowing no sobrevive a las funciones izadas de abajo.
    const cv: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = c2d;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tokens = readTokens(document.documentElement);

    let w = 0, h = 0, dpr = 1, narrow = false;
    let raf = 0;
    let scrollMax = 1;

    // --- Partículas --------------------------------------------------------
    // Densidad por área, acotada: fluidez antes que cantidad.
    const count = () => {
      const area = window.innerWidth * window.innerHeight;
      return Math.max(1800, Math.min(5200, Math.round(area / 270)));
    };

    let n = count();
    let targets: Pt[][] = [];
    let px = new Float32Array(0), py = new Float32Array(0);
    let vx = new Float32Array(0), vy = new Float32Array(0);
    let phase = new Float32Array(0), drift = new Float32Array(0), speed = new Float32Array(0);
    /** Índice de color: 0..3 humo, 4 señal. */
    let tint = new Uint8Array(0);
    let size = new Float32Array(0);

    function buildShapes() {
      targets = SHAPES.map((s, si) => {
        const r = rng(9173 + si * 7919);
        return Array.from({ length: n }, (_, i) => s.at(i, n, r));
      });
    }

    function buildParticles() {
      const r = rng(20261101);
      px = new Float32Array(n); py = new Float32Array(n);
      vx = new Float32Array(n); vy = new Float32Array(n);
      phase = new Float32Array(n); drift = new Float32Array(n); speed = new Float32Array(n);
      tint = new Uint8Array(n); size = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        phase[i] = r() * TAU;
        drift[i] = 2 + r() * 7;
        speed[i] = 0.25 + r() * 0.5;
        // ~12 % señal. El resto, humo con más peso en los grises medios.
        const q = r();
        tint[i] = q > 0.88 ? 4 : q > 0.66 ? 3 : q > 0.36 ? 2 : q > 0.14 ? 1 : 0;
        size[i] = tint[i] === 4 ? 1.5 + r() * 1.1 : 0.9 + r() * 1.05;
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      narrow = w < 900;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const next = count();
      if (next !== n || targets.length === 0) {
        n = next;
        buildShapes();
        buildParticles();
        seed();
      }
      scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    /** Coloca las partículas cerca de su objetivo para que entren convergiendo. */
    function seed() {
      const r = rng(7717);
      const g = geom(0);
      for (let i = 0; i < n; i++) {
        const t = targets[0][i];
        px[i] = g.cx + t.x * g.R + (r() - 0.5) * w * 0.18;
        py[i] = g.cy + t.y * g.R + (r() - 0.5) * h * 0.18;
      }
    }

    type Place = { cx: number; cy: number; R: number; alpha: number };

    /**
     * Ubicación de una forma concreta, en píxeles.
     *
     * Las `glyph` se compactan dentro del margen libre que queda a la derecha
     * de la columna de contenido. Al no tener texto encima pueden ir densas y
     * opacas, que es lo único que hace legible una silueta. Si ese margen es
     * chico (ventana angosta), no hay lugar para una figura: la forma vuelve al
     * centro, grande y muy tenue, como simple atmósfera.
     */
    function place(si: number): Place {
      const sh = SHAPES[si];
      const base = Math.min(w, h);

      if (sh.role === "glyph") {
        const content = Math.min(sh.content ?? COL_WIDE, w - 2 * 56);
        const gutter = (w - content) / 2;
        // Las siluetas llegan hasta ~1.08·R de ancho: el radio se calcula para
        // que la figura entre entera en el margen, sin tocar ni el contenido
        // ni el borde de la ventana.
        const REACH = 1.08;
        const EDGE = 14;
        const R = Math.min((gutter - 2 * EDGE) / 2 / REACH, base * 0.21);
        if (R >= 80 && !narrow) {
          return { cx: w - gutter / 2, cy: h * 0.5, R, alpha: 1 };
        }
        // Sin margen suficiente no hay figura posible: vuelve a ser atmósfera.
        return { cx: w * 0.5, cy: h * 0.5, R: base * 0.34, alpha: 0.16 };
      }

      // En pantallas angostas la forma libre se centra: el texto manda.
      return {
        cx: w * (narrow ? 0.5 : sh.cx ?? 0.5),
        cy: h * (sh.cy ?? 0.5),
        R: base * 0.42 * (sh.scale ?? 1) * (narrow ? 0.82 : 1),
        alpha: (sh.alpha ?? 1) * (narrow ? 0.5 : 1),
      };
    }

    /** Interpola la ubicación entre dos formas consecutivas. */
    function geom(si: number) {
      const lo = Math.floor(si);
      const hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      const m = si - lo;
      const a = place(lo), b = place(hi);
      const l = (p: number, q: number) => p + (q - p) * m;
      return {
        cx: l(a.cx, b.cx),
        cy: l(a.cy, b.cy),
        R: l(a.R, b.R),
        alpha: l(a.alpha, b.alpha) * intensity,
      };
    }

    // --- Puntero -----------------------------------------------------------
    let mx = -9999, my = -9999, hasPointer = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX; my = e.clientY; hasPointer = true;
    };
    const onLeave = () => { hasPointer = false; mx = my = -9999; };

    // --- Dibujo ------------------------------------------------------------
    const colorOf = (t: number) => (t === 4 ? tokens.signal : tokens.smoke[t]);

    function paint(alpha: number) {
      ctx.clearRect(0, 0, w, h);
      // Agrupado por color: un fillStyle por tinte, no uno por partícula.
      for (let t = 0; t < 5; t++) {
        ctx.fillStyle = colorOf(t);
        // La señal se mantiene nítida; el humo se atenúa hacia el fondo.
        ctx.globalAlpha = alpha * (t === 4 ? 0.95 : 0.3 + t * 0.15);
        for (let i = 0; i < n; i++) {
          if (tint[i] !== t) continue;
          const s = size[i];
          ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }

    /** Progreso de scroll → posición continua dentro de la secuencia de formas. */
    function shapePos() {
      const p = Math.min(1, Math.max(0, window.scrollY / scrollMax));
      return p * (SHAPES.length - 1);
    }

    // --- Cuadro estático (reduced motion) ---------------------------------
    function still() {
      const si = shapePos();
      const g = geom(si);
      const lo = Math.floor(si), hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      const m = si - lo;
      for (let i = 0; i < n; i++) {
        const a = targets[lo][i], b = targets[hi][i];
        px[i] = g.cx + (a.x + (b.x - a.x) * m) * g.R;
        py[i] = g.cy + (a.y + (b.y - a.y) * m) * g.R;
      }
      paint(g.alpha);
    }

    // --- Bucle animado -----------------------------------------------------
    const REPEL = 130;      // radio de influencia del puntero, px
    const FORCE = 2.6;      // empuje
    const K = 0.075;        // rigidez del resorte hacia el objetivo
    const DAMP = 0.88;      // amortiguación

    let t0 = performance.now();

    function frame(now: number) {
      const dt = Math.min(2.4, (now - t0) / 16.666);
      t0 = now;
      const time = now / 1000;

      const si = shapePos();
      const g = geom(si);
      const lo = Math.floor(si), hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      // Suavizado del morfeo: entra y sale sin tirones.
      const raw = si - lo;
      const m = raw * raw * (3 - 2 * raw);

      const A = targets[lo], B = targets[hi];

      for (let i = 0; i < n; i++) {
        const a = A[i], b = B[i];
        const nx = a.x + (b.x - a.x) * m;
        const ny = a.y + (b.y - a.y) * m;

        // Objetivo + respiración propia de cada partícula.
        const d = drift[i];
        const tx = g.cx + nx * g.R + Math.sin(time * speed[i] + phase[i]) * d;
        const ty = g.cy + ny * g.R + Math.cos(time * speed[i] * 0.85 + phase[i]) * d;

        let ax = (tx - px[i]) * K;
        let ay = (ty - py[i]) * K;

        if (hasPointer) {
          const dx = px[i] - mx, dy = py[i] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL * REPEL && d2 > 0.01) {
            const dist = Math.sqrt(d2);
            const f = (1 - dist / REPEL) ** 2 * FORCE;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }

        vx[i] = (vx[i] + ax * dt) * DAMP;
        vy[i] = (vy[i] + ay * dt) * DAMP;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
      }

      paint(g.alpha);
      raf = requestAnimationFrame(frame);
    }

    // --- Arranque / ciclo de vida -----------------------------------------
    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { still(); return; }
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const onScroll = () => { if (reduce.matches) still(); };
    const onResize = () => { resize(); if (reduce.matches) still(); };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    resize();
    start();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", start);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", start);
    };
  }, [intensity]);

  return <canvas ref={ref} className="stage-canvas" aria-hidden="true" />;
}
