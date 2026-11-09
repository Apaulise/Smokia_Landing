"use client";

import { useEffect, useRef, useState } from "react";
import ParticleField, { COL_WIDE, SHAPES, TAU, readTokens, rng } from "./ParticleField";

/**
 * Campo de partículas en 3D real (WebGL).
 *
 * Es el mismo escenario de `ParticleField` —las mismas seis formas, el mismo
 * recorrido por scroll, la misma lógica de márgenes y el mismo reparto humo /
 * señal— pero cada partícula tiene profundidad y se proyecta con perspectiva:
 *
 *   · las formas son volúmenes (cintas a distinta profundidad, retícula en
 *     capas, embudo cónico, barras que avanzan hacia el frente, ráfaga esférica);
 *   · el conjunto "mira" al puntero: se inclina hacia él y las capas se
 *     desplazan entre sí (paralaje);
 *   · al pasar de una forma a otra las partículas atraviesan el espacio en vez
 *     de deslizarse en plano;
 *   · lo lejano se atenúa y lo cercano se agranda.
 *
 * Detrás va una capa de humo (grises del sistema, sin brillo) que deriva con
 * el scroll. Cero hex propios: todo sale de los tokens `--smoke-*` y `--signal`.
 *
 * Si WebGL no está disponible (o se pierde el contexto) se monta el campo 2D
 * original sin ningún cambio de comportamiento. Con `prefers-reduced-motion`
 * se dibuja un cuadro fijo por posición de scroll: sin bucle, sin puntero.
 */

/* ---------------------------------------------------------------- Utilidades */

type RGB = [number, number, number];

function parseColor(raw: string, fallback: RGB): RGB {
  const t = raw.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16) / 255, parseInt(h[1] + h[1], 16) / 255, parseInt(h[2] + h[2], 16) / 255];
  }
  m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(t);
  if (m) return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  const f = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(t);
  if (f) return [Number(f[1]) / 255, Number(f[2]) / 255, Number(f[3]) / 255];
  return fallback;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

const CONTEXT_OPTS: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance",
};

/* ------------------------------------------------------------------ Shaders */

const POINTS_VERT = `
precision highp float;
attribute vec3 aPos;      // x,y en px de pantalla; z = profundidad en px (+ hacia el frente)
attribute vec4 aCol;      // rgb + alfa base
attribute vec2 aMisc;     // tamaño en px CSS
uniform vec2 uView;       // viewport en px CSS
uniform vec2 uC;          // centro de la figura en px
uniform vec2 uRot;        // giro (yaw, pitch) en radianes
uniform float uF;         // distancia focal en px
uniform float uDpr;
uniform float uAlpha;
uniform float uR;         // radio de la figura, para atenuar por profundidad
varying vec4 vCol;
void main() {
  vec3 p = vec3(aPos.xy - uC, aPos.z);
  float cy = cos(uRot.x), sy = sin(uRot.x);
  float cp = cos(uRot.y), sp = sin(uRot.y);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cp * p.y - sp * p.z, sp * p.y + cp * p.z);
  float s = uF / max(uF - p.z, uF * 0.25);
  vec2 q = uC + p.xy * s;
  gl_Position = vec4(q.x / uView.x * 2.0 - 1.0, 1.0 - q.y / uView.y * 2.0, 0.0, 1.0);
  float depth = clamp(p.z / max(uR, 1.0), -1.0, 1.0);
  float sz = aMisc.x * s * uDpr;
  float a = aCol.a * uAlpha * (0.66 + 0.34 * depth);
  if (sz < 1.0) { a *= sz; sz = 1.0; }
  gl_PointSize = min(sz, 14.0);
  vCol = vec4(aCol.rgb * a, a);
}
`;

const POINTS_FRAG = `
precision mediump float;
varying vec4 vCol;
void main() { gl_FragColor = vCol; }
`;

const SMOKE_VERT = `
attribute vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }
`;

const SMOKE_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform vec3 uTone;
uniform float uAmt;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 1.7;
  p.y -= uScroll;                         // el humo sube a medida que se baja
  float t = uTime * 0.03;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 m = (uMouse - 0.5) * vec2(1.0, -1.0) * 0.28;
  float d = fbm(p * 1.1 + 2.1 * q + m + vec2(t, -t * 0.6));
  float wisp = smoothstep(0.42, 0.88, d);
  float vig = smoothstep(1.35, 0.3, length(uv - 0.5) * 1.35);
  float a = wisp * vig * uAmt;
  a += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;   // sin bandas en el degradé
  a = max(a, 0.0);
  gl_FragColor = vec4(uTone * a, a);
}
`;

/* ------------------------------------------------------------------ Volumen */

/**
 * Profundidad (z normalizada) de cada partícula según la forma. Se calcula
 * DESPUÉS de leer (x, y) de la forma 2D original, así que la silueta frontal
 * es exactamente la de siempre: lo único que cambia es lo que hay detrás.
 */
function depthOf(si: number, i: number, x: number, y: number, r: () => number): number {
  switch (si) {
    // Ondas: tres cintas a distinta profundidad que ondulan hacia adelante y atrás.
    case 0: {
      const ribbon = i % 3;
      const u = x / 1.2;
      return (ribbon - 1) * 0.42 + 0.3 * Math.sin(u * Math.PI * 1.3 + ribbon * 1.7) + (r() - 0.5) * 0.16;
    }
    // Dispersión: una nube con volumen.
    case 1:
      return (r() * 2 - 1) * 1.1;
    // Grilla: retícula de tres capas.
    case 2:
      return (Math.floor(r() * 3) - 1) * 0.36 + (r() - 0.5) * 0.05;
    // Embudo: cono real. En el borde z≈0, así que la silueta no cambia.
    case 3: {
      const k = Math.min(1, Math.max(0, (y + 1) / 1.35));
      const half = y > 0.35 ? 0.06 : 1 - k + 0.06;
      return Math.sqrt(Math.max(0, half * half - x * x)) * (r() * 2 - 1);
    }
    // Barras: cada columna más al frente que la anterior.
    case 4: {
      if (i % 17 === 0) return (r() * 2 - 1) * 0.55;
      return ((i % 7) - 3) * 0.15 + (r() - 0.5) * 0.12;
    }
    // Convergencia: ráfaga esférica, densa en el centro.
    default: {
      const d = Math.hypot(x / 1.5, y);
      return (r() * 2 - 1) * d * 0.9;
    }
  }
}

/** Cuánto de la escala de la figura ocupa la profundidad. */
const DEPTH = 0.85;
/** Rigidez / amortiguación: las mismas del campo 2D, para que se sienta igual. */
const K = 0.075;
const DAMP = 0.88;
const REPEL = 130;
const FORCE = 2.6;

type Place = { cx: number; cy: number; R: number; alpha: number };

export default function ParticleField3D({
  intensity = 1,
  atmosphere = true,
}: {
  intensity?: number;
  /** false cuando otra capa (CinematicStage) ya dibuja el fondo. */
  atmosphere?: boolean;
}) {
  const smokeRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  /* ------------------------------------------------------------ Humo (fondo) */
  useEffect(() => {
    if (!atmosphere) return;
    const el = smokeRef.current;
    if (!el) return;
    const cv: HTMLCanvasElement = el; // const no anulable: el narrowing no sobrevive a las funciones izadas
    const ctx = cv.getContext("webgl", CONTEXT_OPTS);
    if (!ctx) return; // sin humo, el campo de partículas sigue funcionando solo
    const gl: WebGLRenderingContext = ctx;

    const prog = program(gl, SMOKE_VERT, SMOKE_FRAG);
    if (!prog) return;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, "aP");
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uScroll = U("uScroll"), uMouse = U("uMouse"), uTone = U("uTone"), uAmt = U("uAmt");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tokens = readTokens(document.documentElement);
    const tone = parseColor(tokens.smoke[1], [0.38, 0.4, 0.42]);
    // Pico de opacidad bajo a propósito: el texto (ink-3 incluido) conserva ≥4.5:1.
    const amt = 0.15 * Math.min(1, 0.35 + intensity);

    let raf = 0;
    let w = 1, h = 1;
    let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    let t0 = performance.now();
    let time = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      // Humo a baja resolución: el CSS lo escala y queda suave sin costo.
      const scale = w < 900 ? 0.28 : 0.36;
      cv.width = Math.max(2, Math.round(w * scale));
      cv.height = Math.max(2, Math.round(h * scale));
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      gl.viewport(0, 0, cv.width, cv.height);
    }

    function draw() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uScroll, (window.scrollY / Math.max(1, h)) * 0.55);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform3f(uTone, tone[0], tone[1], tone[2]);
      gl.uniform1f(uAmt, amt);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      time += dt;
      const k = 1 - Math.exp(-dt * 2.2);
      mx += (tx - mx) * k;
      my += (ty - my) * k;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { draw(); return; }
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
    };
    const onScroll = () => { if (reduce.matches) draw(); };
    const onResize = () => { resize(); if (reduce.matches) draw(); };
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else start(); };
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); };

    resize();
    start();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", start);
    cv.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", start);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [intensity, atmosphere]);

  /* ------------------------------------------------------ Partículas en 3D */
  useEffect(() => {
    const el = glRef.current;
    if (!el) return;
    const cv: HTMLCanvasElement = el;
    const ctx = cv.getContext("webgl", CONTEXT_OPTS);
    if (!ctx) { setFallback(true); return; }
    const gl: WebGLRenderingContext = ctx;

    const prog = program(gl, POINTS_VERT, POINTS_FRAG);
    if (!prog) { setFallback(true); return; }

    const posBuf = gl.createBuffer();
    const attrBuf = gl.createBuffer();
    const aPos = gl.getAttribLocation(prog, "aPos");
    const aCol = gl.getAttribLocation(prog, "aCol");
    const aMisc = gl.getAttribLocation(prog, "aMisc");
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uView = U("uView"), uC = U("uC"), uRot = U("uRot"), uF = U("uF"), uDpr = U("uDpr"), uAlpha = U("uAlpha"), uR = U("uR");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tokens = readTokens(document.documentElement);
    const palette: RGB[] = [
      parseColor(tokens.smoke[0], [0.27, 0.28, 0.3]),
      parseColor(tokens.smoke[1], [0.38, 0.4, 0.42]),
      parseColor(tokens.smoke[2], [0.54, 0.55, 0.57]),
      parseColor(tokens.smoke[3], [0.73, 0.73, 0.75]),
      parseColor(tokens.signal, [0.95, 0.76, 0.31]),
    ];

    let w = 0, h = 0, dpr = 1, narrow = false;
    let raf = 0;
    let scrollMax = 1;
    let lastMeasure = 0;

    // --- Partículas ---------------------------------------------------------
    const count = () => {
      const area = window.innerWidth * window.innerHeight;
      const cap = window.innerWidth < 900 ? 4200 : 6800;
      return Math.max(2000, Math.min(cap, Math.round(area / 250)));
    };
    let n = 0;
    let targets: Float32Array[] = [];
    let pos = new Float32Array(0);   // x, y, z por partícula: es lo que se sube a la GPU
    let vel = new Float32Array(0);
    let phase = new Float32Array(0), drift = new Float32Array(0), speed = new Float32Array(0), jz = new Float32Array(0);

    function buildShapes() {
      targets = SHAPES.map((s, si) => {
        const r = rng(9173 + si * 7919);        // misma semilla que el campo 2D: misma silueta
        const rz = rng(5531 + si * 104729);
        const out = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const p = s.at(i, n, r);
          out[i * 3] = p.x;
          out[i * 3 + 1] = p.y;
          out[i * 3 + 2] = depthOf(si, i, p.x, p.y, rz);
        }
        return out;
      });
    }

    function buildParticles() {
      const r = rng(20261101);
      pos = new Float32Array(n * 3);
      vel = new Float32Array(n * 3);
      phase = new Float32Array(n);
      drift = new Float32Array(n);
      speed = new Float32Array(n);
      jz = new Float32Array(n);
      const attrs = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        phase[i] = r() * TAU;
        drift[i] = 2 + r() * 7;
        speed[i] = 0.25 + r() * 0.5;
        jz[i] = r() * 2 - 1;
        // ~12 % señal; el resto, humo con más peso en los grises medios.
        const q = r();
        const tint = q > 0.88 ? 4 : q > 0.66 ? 3 : q > 0.36 ? 2 : q > 0.14 ? 1 : 0;
        const size = tint === 4 ? 1.5 + r() * 1.1 : 0.9 + r() * 1.05;
        const c = palette[tint];
        const a = tint === 4 ? 0.95 : 0.3 + tint * 0.15;
        attrs.set([c[0], c[1], c[2], a, size, 0], i * 6);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, attrBuf);
      gl.bufferData(gl.ARRAY_BUFFER, attrs, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pos.byteLength, gl.DYNAMIC_DRAW);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      narrow = w < 900;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      gl.viewport(0, 0, cv.width, cv.height);

      const next = count();
      if (next !== n || targets.length === 0) {
        n = next;
        buildShapes();
        buildParticles();
        seed();
      }
      measure();
    }

    function measure() {
      scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    /** Las partículas entran convergiendo hacia la primera forma. */
    function seed() {
      const r = rng(7717);
      const g = geom(0);
      const T = targets[0];
      for (let i = 0; i < n; i++) {
        pos[i * 3] = g.cx + T[i * 3] * g.R + (r() - 0.5) * w * 0.18;
        pos[i * 3 + 1] = g.cy + T[i * 3 + 1] * g.R + (r() - 0.5) * h * 0.18;
        pos[i * 3 + 2] = T[i * 3 + 2] * g.R * DEPTH + (r() - 0.5) * g.R * 0.8;
      }
    }

    /**
     * Ubicación de una forma, en px. Misma lógica que el campo 2D: las `glyph`
     * ocupan el margen libre junto a la columna de contenido; si no hay margen
     * suficiente vuelven al centro como atmósfera tenue.
     */
    function place(si: number): Place {
      const sh = SHAPES[si];
      const base = Math.min(w, h);
      if (sh.role === "glyph") {
        const content = Math.min(sh.content ?? COL_WIDE, w - 2 * 56);
        const gutter = (w - content) / 2;
        const REACH = 1.08;
        const EDGE = 14;
        const R = Math.min((gutter - 2 * EDGE) / 2 / REACH, base * 0.21);
        if (R >= 80 && !narrow) return { cx: w - gutter / 2, cy: h * 0.5, R, alpha: 1 };
        return { cx: w * 0.5, cy: h * 0.5, R: base * 0.34, alpha: 0.16 };
      }
      return {
        cx: w * (narrow ? 0.5 : sh.cx ?? 0.5),
        cy: h * (sh.cy ?? 0.5),
        R: base * 0.42 * (sh.scale ?? 1) * (narrow ? 0.82 : 1),
        alpha: (sh.alpha ?? 1) * (narrow ? 0.5 : 1),
      };
    }

    function geom(si: number): Place {
      const lo = Math.floor(si);
      const hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      const m = si - lo;
      const a = place(lo), b = place(hi);
      const l = (p: number, q: number) => p + (q - p) * m;
      return { cx: l(a.cx, b.cx), cy: l(a.cy, b.cy), R: l(a.R, b.R), alpha: l(a.alpha, b.alpha) * intensity };
    }

    function shapePos() {
      const p = Math.min(1, Math.max(0, window.scrollY / scrollMax));
      return p * (SHAPES.length - 1);
    }

    // --- Puntero ------------------------------------------------------------
    let mx = -9999, my = -9999, hasPointer = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX; my = e.clientY; hasPointer = true;
    };
    const onLeave = () => { hasPointer = false; mx = my = -9999; };

    // --- Dibujo -------------------------------------------------------------
    let yaw = 0, pitch = 0;

    function draw(g: Place) {
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      gl.uniform2f(uView, w, h);
      gl.uniform2f(uC, g.cx, g.cy);
      gl.uniform2f(uRot, yaw, pitch);
      gl.uniform1f(uF, Math.max(w, h) * 1.1);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uAlpha, g.alpha);
      gl.uniform1f(uR, g.R);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, attrBuf);
      gl.enableVertexAttribArray(aCol);
      gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(aMisc);
      gl.vertexAttribPointer(aMisc, 2, gl.FLOAT, false, 24, 16);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, n);
    }

    // --- Cuadro estático (reduced motion) ----------------------------------
    function still() {
      const si = shapePos();
      const g = geom(si);
      const lo = Math.floor(si), hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      const m = si - lo;
      const A = targets[lo], B = targets[hi];
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        pos[i3] = g.cx + (A[i3] + (B[i3] - A[i3]) * m) * g.R;
        pos[i3 + 1] = g.cy + (A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * m) * g.R;
        pos[i3 + 2] = (A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * m) * g.R * DEPTH;
      }
      yaw = 0; pitch = 0;
      draw(g);
    }

    // --- Bucle animado ------------------------------------------------------
    let t0 = performance.now();

    function frame(now: number) {
      const dt = Math.min(2.4, (now - t0) / 16.666);
      t0 = now;
      const time = now / 1000;
      if (now - lastMeasure > 1200) { measure(); lastMeasure = now; }

      const si = shapePos();
      const g = geom(si);
      const lo = Math.floor(si), hi = Math.min(SHAPES.length - 1, Math.ceil(si));
      const raw = si - lo;
      const m = raw * raw * (3 - 2 * raw);
      // 0 en cada forma, 1 a mitad de camino: es el "salto" por el espacio.
      const burst = Math.sin(Math.PI * raw);
      const A = targets[lo], B = targets[hi];
      const zAmp = g.R * DEPTH;
      const burstAmp = g.R * 0.55 * burst;

      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        const d = drift[i];
        const sp = speed[i], ph = phase[i];
        const tx = g.cx + (A[i3] + (B[i3] - A[i3]) * m) * g.R + Math.sin(time * sp + ph) * d;
        const ty = g.cy + (A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * m) * g.R + Math.cos(time * sp * 0.85 + ph) * d;
        const tz = (A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * m) * zAmp + burstAmp * jz[i] + Math.sin(time * sp * 0.7 + ph * 1.3) * d * 0.7;

        let ax = (tx - pos[i3]) * K;
        let ay = (ty - pos[i3 + 1]) * K;
        let az = (tz - pos[i3 + 2]) * K;

        if (hasPointer) {
          const dx = pos[i3] - mx, dy = pos[i3 + 1] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL * REPEL && d2 > 0.01) {
            const dist = Math.sqrt(d2);
            const f = (1 - dist / REPEL) ** 2 * FORCE;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
            az += f * jz[i] * 1.4;
          }
        }

        vel[i3] = (vel[i3] + ax * dt) * DAMP;
        vel[i3 + 1] = (vel[i3 + 1] + ay * dt) * DAMP;
        vel[i3 + 2] = (vel[i3 + 2] + az * dt) * DAMP;
        pos[i3] += vel[i3] * dt;
        pos[i3 + 1] += vel[i3 + 1] * dt;
        pos[i3 + 2] += vel[i3 + 2] * dt;
      }

      // El conjunto mira al puntero; en reposo respira. Al cambiar de forma gira.
      const swirl = burst * 0.5 * (lo % 2 === 0 ? 1 : -1);
      const yawT = (hasPointer ? (mx / w - 0.5) * 0.55 : 0) + Math.sin(time * 0.23) * 0.08 + swirl;
      const pitchT = (hasPointer ? -(my / h - 0.5) * 0.36 : 0) + Math.cos(time * 0.19) * 0.05;
      // dt está en cuadros de 16.7 ms: 3.5 /s de respuesta.
      const k = 1 - Math.exp((-dt * 3.5) / 60);
      yaw += (yawT - yaw) * k;
      pitch += (pitchT - pitch) * k;

      draw(g);
      raf = requestAnimationFrame(frame);
    }

    // --- Arranque / ciclo de vida -------------------------------------------
    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { still(); return; }
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const onScroll = () => { if (reduce.matches) still(); };
    const onResize = () => { resize(); if (reduce.matches) still(); };
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else start(); };
    // Si la GPU descarta el contexto, se pasa al campo 2D en vez de quedar en blanco.
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); setFallback(true); };

    resize();
    start();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", start);
    cv.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", start);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(attrBuf);
      gl.deleteProgram(prog);
    };
  }, [intensity]);

  if (fallback) return <ParticleField intensity={intensity} />;

  return (
    <>
      {atmosphere && <canvas ref={smokeRef} className="stage-smoke" aria-hidden="true" />}
      <canvas ref={glRef} className="stage-canvas" aria-hidden="true" />
    </>
  );
}
