"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Escenario cinematográfico — un shader a pantalla completa detrás de toda la
 * página. Cada tramo de la landing tiene su escena y el scroll pasa de una a
 * otra con una disolución de semitono (la nueva escena crece desde abajo en
 * una trama de puntos):
 *
 *   0  Hero ............... eclipse de señal (anillo de luz que sigue al hero)
 *   1  Stage + Soluciones . humo volumétrico iluminado desde abajo
 *   2  Proyectos + Método . metal líquido en 3D (raymarching)
 *   3  Resultados + FAQ ... humo con brasas que suben
 *   4  CTA final → footer . el eclipse vuelve, centrado detrás del CTA
 *
 * Paleta: sólo tokens del sistema (--bg, --signal, --smoke-*, --ink).
 * Legibilidad: en escritorio la energía vive a la derecha y la columna de
 * texto (izquierda) queda bajo un tope de luminancia que conserva ≥4.5:1 para
 * --ink-3. En móvil el tope se aplica a casi toda la pantalla.
 *
 * Sin dependencias: WebGL1 crudo. Si WebGL no está disponible o se pierde el
 * contexto, el componente desaparece y queda el fondo plano de siempre.
 */

const VERT = `
attribute vec2 aP;
varying vec2 vUv;
void main(){ vUv = aP * .5 + .5; gl_Position = vec4(aP, 0., 1.); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float uTime; uniform vec2 uRes; uniform float uScene; uniform vec2 uMouse;
uniform float uIntro; uniform float uPx; uniform float uVel; uniform float uSide;
uniform float uDrift; uniform float uHeroY; uniform float uHeroX; uniform float uFinY;
uniform vec4 uR[24]; uniform float uRk[24]; uniform float uRn; uniform float uPad;
uniform vec3 uBg; uniform vec3 uSig; uniform vec3 uS1; uniform vec3 uS2; uniform vec3 uS4; uniform vec3 uInk;
varying vec2 vUv;
#define TAU 6.28318530718
vec2 gM; float gAsp;

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), u.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float a = .5, s = 0.; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for(int i = 0; i < 5; i++){ s += a * vnoise(p); p = m * p; a *= .5; } return s; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* Bolsillos de lectura: cada bloque de texto que no está sobre un panel
   opaco llega como rectángulo (px del canvas). Alrededor de él la escena se
   escala hasta un tope de luminancia: --ink-3 conserva ≥4.5:1 sobre el cuerpo
   y ≥3:1 sobre los títulos grandes. El humo "se abre" alrededor del texto. */
vec3 readable(vec3 c, vec2 fc){
  float mx = max(max(c.r, max(c.g, c.b)), 1e-3);
  float f = 1.;
  for(int i = 0; i < 24; i++){
    if(float(i) >= uRn) break;
    vec4 r = uR[i];
    vec2 h = (r.zw - r.xy) * .5;
    vec2 d = abs(fc - (r.xy + r.zw) * .5) - h;
    float sd = length(max(d, 0.)) + min(max(d.x, d.y), 0.);
    float m = smoothstep(uPad, 0., sd);
    f = min(f, mix(1., min(1., uRk[i] / mx), m * m * (3. - 2. * m)));
  }
  return c * f;
}

/* Polvo: puntos finos grises y alguno en señal, con parallax de scroll. */
vec3 dust(vec2 p, float t){
  vec3 c = vec3(0.);
  for(int l = 0; l < 2; l++){
    float fl = float(l); float sc = 22. + fl * 26.;
    vec2 g = p * sc + fl * 17.3 + (uMouse - .5) * (2. + fl * 3.);
    g.y -= uDrift * sc * (.35 + fl * .3);
    vec2 id = floor(g); vec2 f = fract(g) - .5;
    float h = hash21(id); vec2 off = (hash22(id + 3.1) - .5) * .6;
    float d = length(f - off); float sz = .03 + .06 * hash21(id + 9.7);
    float tw = .55 + .45 * sin(t * (.8 + h * 2.) + h * 40.);
    float s = smoothstep(sz, 0., d) * step(.87, h) * tw;
    c += s * mix(uS4, uSig, step(.62, hash21(id + 1.3))) * (.9 - fl * .35);
  }
  return c;
}

/* ---------------- 0 / 4: eclipse de señal ---------------- */
vec3 eclipse(vec2 p, float v){
  float t = uTime;
  vec2 c = v < .5 ? vec2(mix(0., uHeroX, uSide), uHeroY + mix(-.62, 0., uSide))
                  : vec2(0., uFinY);
  float R0 = (v < .5 ? mix(.44, .60, uSide) : mix(.62, .82, uSide)) * mix(.5, 1., uIntro) + .004 * sin(t * .7);
  vec2 q = p - c - (uMouse - .5) * .07;
  float r = length(q); float a = atan(q.y, q.x);

  vec2 w = q * 1.2; w += .45 * vec2(fbm(w + vec2(t * .03, 0.)), fbm(w + vec2(7.3, -t * .04)));
  float n = fbm(w * 1.3 + vec2(0., t * .02));
  vec3 col = uBg;
  col += mix(uS1, uS2, n) * pow(n, 2.2) * .5;
  col += dust(p, t) * .65;

  float md = length(p - gM);
  float rip = sin(md * 34. - t * 2.4) * exp(-md * 3.2) * (.2 + min(uVel, 1.) * 1.3);
  float d = r - R0;
  float lines = pow(.5 + .5 * cos((d + rip * .012) * TAU * 8. - t * .12), 48.) * exp(-d * 2.4) * smoothstep(0., .02, d);
  col += mix(uS4, uSig, .3) * lines * .5 * uIntro;

  float ang = a + t * .12;
  float beam = .5 + .5 * cos(ang - 2.4);
  float fl = .65 + .35 * fbm(vec2(ang * 3. + t * .2, r * 10. - t * .3));
  float core = exp(-d * d / (2. * .0035 * .0035));
  float halo = exp(-abs(d) * 9.);
  float innerG = exp(-max(-d, 0.) * 22.) * step(d, 0.);
  vec3 hot = mix(uInk * 1.2, uSig * 1.25, smoothstep(-.04, .14, d));
  vec3 ring = hot * core * 2.4 * (.45 + .55 * beam) + uSig * (halo * .42 * fl * (.4 + .6 * beam) + innerG * .5 * fl);
  float band = smoothstep(0., .012, d) * exp(-d * 9.5);
  float turb = fbm(vec2(ang * 2.2 + t * .35, d * 20. - t * .2));
  ring += mix(uInk, uSig, smoothstep(0., .06, d)) * band * turb * turb * 2.4 * (.35 + .65 * beam);

  float inside = smoothstep(R0 + .004, R0 - .012, r);
  col = mix(col, uBg * .35, inside * .96);
  col += ring * uIntro;
  col += uSig * exp(-abs(q.y) * 70.) * exp(-abs(q.x) * 1.4) * .12 * uIntro;

  for(int i = 0; i < 3; i++){
    float fi = float(i); float a2 = t * (.22 + .09 * fi) + fi * 2.1;
    vec2 sp = vec2(cos(a2), sin(a2) * (.55 + .1 * fi)) * (R0 * (1.45 + .28 * fi));
    sp = rot(.5 + fi * .7) * sp;
    float dd = length(q - sp);
    col += mix(uInk, uSig, fi / 2.) * (exp(-dd * dd * 9000.) * 1.2 + .003 / (dd + .02)) * uIntro;
  }
  return col;
}

/* ---------------- 1 / 3: humo volumétrico (3 = con brasas) ---------------- */
vec3 smoke(vec2 uv, vec2 p, float v){
  float t = uTime;
  vec3 col = uBg * .9;
  vec2 lp = vec2(mix(0., gAsp * .55, uSide), -1.3);
  float ld = length((p - lp) * vec2(.55, 1.));
  col += uSig * exp(-ld * 1.5) * (.16 + v * .08) + uS4 * exp(-ld) * .05;
  for(int l = 0; l < 3; l++){
    float fl = float(l);
    vec2 q = p * vec2(.85, 1.15) * (1. + fl * .55);
    q.x += t * (.01 + fl * .01) + fl * 3.7 + v * 11.;
    q.y -= t * (.025 + fl * .015) + uDrift * (.45 + fl * .45);
    vec2 w = q + vec2(fbm(q * .8 + t * .02 + fl * 9.), fbm(q * .8 + 3.1 - t * .015)) * .6;
    float d = fbm(w * 1.1 + fl * 5.);
    float dens = smoothstep(.5 - .03 * fl, .8, d);
    float d2 = fbm((w + vec2(.05, -.08)) * 1.1 + fl * 5.);
    float lit = clamp(.5 + (d - d2) * 7., 0., 1.);
    vec3 shade = mix(uS1 * .8, mix(uS2, uS4, .6), lit);
    shade += uSig * lit * exp(-ld * .9) * .4;
    col = mix(col, shade, dens * (.5 + fl * .2));
  }
  if(v > .5){
    for(int l = 0; l < 2; l++){
      float fl = float(l); float sc = 9. + fl * 7.;
      vec2 g = p * sc; g.y -= t * (.9 + fl * .6) + uDrift * sc * .6;
      g.x += sin(g.y * .7 + fl * 4.) * .35;
      vec2 id = floor(g); vec2 f = fract(g) - .5;
      float h = hash21(id + fl * 13.);
      vec2 off = (hash22(id + 7.7) - .5) * .7;
      float dd = length(f - off);
      float life = .5 + .5 * sin(t * (1.5 + h * 3.) + h * 30.);
      float e = smoothstep(.07, 0., dd) * step(.9, h) * life;
      col += mix(uSig, uInk, .2 * fl) * e * (1.3 - fl * .4) * smoothstep(1.2, -.6, p.y);
    }
  }
  col += dust(p, t) * .35;
  return col;
}

/* ---------------- 2: metal líquido ---------------- */
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float mapBlob(vec3 p){
  float t = uTime * .4;
  float d = length(p) - .80;
  for(int i = 0; i < 5; i++){
    float fi = float(i);
    vec3 c = vec3(sin(t * 1.1 + fi * 2.4) * 1.15, cos(t * .93 + fi * 1.9) * .85, sin(t * .77 + fi * 3.3) * .8);
    d = smin(d, length(p - c) - (.46 + .12 * sin(t * 1.3 + fi)), .8);
  }
  vec3 q = p; q.yz = rot(.9 + uTime * .12) * q.yz; q.xz = rot(uTime * .1) * q.xz;
  float ring = length(vec2(length(q.xz) - 2.05, q.y)) - .055;
  return min(d, ring);
}
vec3 calcN(vec3 p){ vec2 e = vec2(1., -1.) * .0012; return normalize(e.xyy * mapBlob(p + e.xyy) + e.yyx * mapBlob(p + e.yyx) + e.yxy * mapBlob(p + e.yxy) + e.xxx * mapBlob(p + e.xxx)); }
vec3 env(vec3 rd){
  vec3 c = mix(uBg * .5, uS2 * .9, smoothstep(-.2, 1., rd.y * .5 + .5));
  c += uSig * 1.25 * pow(max(dot(rd, normalize(vec3(-.6, .5, .6))), 0.), 20.) * 1.6;
  c += uInk * pow(max(dot(rd, normalize(vec3(.7, .2, .5))), 0.), 18.) * 1.3;
  c += vec3(1.) * pow(max(dot(rd, normalize(vec3(0., .9, -.4))), 0.), 60.) * 1.3;
  c += uS4 * exp(-pow((rd.y + .05) * 5., 2.)) * .5;
  return c;
}
vec3 chrome(vec2 uv, vec2 p){
  vec2 pc = p - vec2(mix(0., gAsp * .5, uSide), mix(-.45, 0., uSide));
  pc *= mix(1.3, 1., uSide);
  float rr = length(pc);
  vec3 bg = uBg + uS1 * .35 * smoothstep(1.6, 0., length(pc * vec2(.8, 1.)));
  bg += dust(p * .8, uTime) * .35;
  bg += uS2 * pow(.5 + .5 * cos(rr * TAU * 5. - uTime * .1), 60.) * exp(-rr * 1.1) * .6;
  float ang = (uMouse.x - .5) * .9 + uTime * .05;
  vec3 ro = vec3(sin(ang) * 5.4, (uMouse.y - .5) * 1.4, cos(ang) * 5.4);
  vec3 ww = normalize(-ro), uu = normalize(cross(ww, vec3(0., 1., 0.))), vv = cross(uu, ww);
  vec3 rd = normalize(pc.x * uu + pc.y * vv + 2.3 * ww);
  float bb = dot(ro, rd); float cc = dot(ro, ro) - 3.3 * 3.3; float h = bb * bb - cc;
  if(h < 0.) return bg;
  float sq = sqrt(h); float t = max(-bb - sq, 0.); float tmax = -bb + sq;
  float md = 1e3; bool hit = false;
  for(int i = 0; i < 64; i++){
    float d = mapBlob(ro + rd * t); md = min(md, d);
    if(d < .0012){ hit = true; break; }
    t += d * .9; if(t > tmax) break;
  }
  if(!hit) return bg + uSig * exp(-md * 4.) * .12;
  vec3 pos = ro + rd * t; vec3 n = calcN(pos); vec3 refl = reflect(rd, n);
  float ndv = clamp(dot(-rd, n), 0., 1.);
  float fres = pow(1. - ndv, 3.);
  vec3 col = env(refl) * mix(vec3(.82), vec3(1.05), fres);
  col += fres * mix(uS4, uSig, .5 + .5 * n.x) * .6;
  col += vec3(1.) * pow(max(dot(refl, normalize(vec3(.4, .8, .5))), 0.), 90.) * 1.4;
  return col;
}

vec3 sceneColor(int idx, vec2 uv, vec2 p){
  if(idx == 0) return eclipse(p, 0.);
  if(idx == 1) return smoke(uv, p, 0.);
  if(idx == 2) return chrome(uv, p);
  if(idx == 3) return smoke(uv, p, 1.);
  return eclipse(p, 1.);
}

/* Disolución de semitono: la escena nueva crece desde abajo en una trama a 45°. */
float halftone(vec2 fc, float f){
  float cell = 10. * uPx;
  mat2 R = mat2(.7071, -.7071, .7071, .7071);
  vec2 q = R * fc / cell; vec2 id = floor(q) + .5;
  vec2 cuv = ((id * cell) * R) / uRes;
  float field = clamp(cuv.y * .65 + fbm(cuv * vec2(6., 4.) + 4.) * .4 - .05, 0., 1.);
  float r = clamp((f * 1.55 - field) * 2.6, 0., .78);
  float d = length(fract(q) - .5);
  return clamp((r - d) * 14., 0., 1.);
}

vec3 knee(vec3 c){ vec3 k = max(c - .62, 0.); return min(c, vec3(.62)) + .38 * (1. - exp(-k / .38)); }

void main(){
  vec2 uv = vUv; gAsp = uRes.x / uRes.y;
  float sc = max(1., .8 / gAsp);
  vec2 p = (uv - .5) * vec2(gAsp, 1.) * 2. * sc;
  gM = (uMouse - .5) * vec2(gAsp, 1.) * 2. * sc;
  float s = clamp(uScene, 0., 4.);
  float fi = min(floor(s), 3.); int i = int(fi); float f = s - fi;
  vec3 col;
  if(f > .999) col = sceneColor(i + 1, uv, p);
  else {
    col = sceneColor(i, uv, p);
    if(f > .001){
      vec3 b = sceneColor(i + 1, uv, p);
      float m = halftone(gl_FragCoord.xy, f);
      col = mix(col, b, m);
      col += uSig * m * (1. - m) * .9;
    }
  }
  col = readable(col, gl_FragCoord.xy);
  vec2 vq = uv - .5;
  col *= 1. - .35 * dot(vq, vq);
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 91.7) - .5) * .03;
  gl_FragColor = vec4(knee(col), 1.);
}
`;

/** Máximo de bloques de texto que el shader protege a la vez. */
const MAX_RECTS = 24;
/** Tope de luminancia del fondo detrás de texto de cuerpo / títulos grandes. */
const CAP_BODY = 0.135;
const CAP_HEAD = 0.26;

type Rect = { x0: number; y0: number; x1: number; y1: number; k: number };

function alphaOf(bg: string) {
  if (!bg || bg === "transparent") return 0;
  const m = bg.match(/rgba?\(([^)]+)\)/);
  if (!m) return 0;
  const parts = m[1].split(/[ ,/]+/).filter(Boolean);
  return parts.length >= 4 ? parseFloat(parts[3]) : 1;
}

/**
 * Bloques de texto "sueltos" sobre el escenario, en coordenadas de documento.
 * Se saltean los que viven sobre un fondo opaco (paneles, tarjetas, inputs) y
 * se recortan por los contenedores con overflow (FAQ cerradas, etc.). Los
 * bloques cercanos del mismo tipo se fusionan para que entren en MAX_RECTS.
 */
function collectText(): Rect[] {
  const sy = window.scrollY;
  const sx = window.scrollX;
  const opaque = new Map<Element, boolean>();
  const isOpaque = (e: Element): boolean => {
    const hit = opaque.get(e);
    if (hit !== undefined) return hit;
    const cs = getComputedStyle(e);
    const v = alphaOf(cs.backgroundColor) >= 0.6 || /^(INPUT|TEXTAREA|SELECT|IFRAME|VIDEO|IMG)$/.test(e.tagName);
    opaque.set(e, v);
    return v;
  };
  const raw: Rect[] = [];
  const range = document.createRange();
  const els = document.querySelectorAll<HTMLElement>("main *, body > div footer *, footer *");
  els.forEach((el) => {
    let has = false;
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3 && n.textContent && n.textContent.trim()) { has = true; break; }
    }
    if (!has || el.closest("svg")) return;
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    // Subir hasta <body>: ¿fondo opaco? ¿recorte por overflow?
    for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
      if (isOpaque(a)) return;
      const cs = getComputedStyle(a);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      if (a !== el && (cs.overflowX !== "visible" || cs.overflowY !== "visible")) {
        const b = a.getBoundingClientRect();
        x0 = Math.max(x0, b.left); y0 = Math.max(y0, b.top);
        x1 = Math.min(x1, b.right); y1 = Math.min(y1, b.bottom);
        if (x1 - x0 < 2 || y1 - y0 < 2) return;
      }
    }
    const head = !!el.closest("h1,h2,.display,.h1,.h2");
    raw.push({ x0: x0 + sx, y0: y0 + sy, x1: x1 + sx, y1: y1 + sy, k: head ? CAP_HEAD : CAP_BODY });
  });
  range.detach?.();
  // Fusionar bloques cercanos (mismo tope) hasta que no haya más cambios.
  const GAP = 28;
  let rects = raw;
  let changed = true;
  while (changed) {
    changed = false;
    const out: Rect[] = [];
    for (const r of rects) {
      const m = out.find((o) => o.k === r.k && r.x0 < o.x1 + GAP && r.x1 > o.x0 - GAP && r.y0 < o.y1 + GAP && r.y1 > o.y0 - GAP);
      if (m) {
        m.x0 = Math.min(m.x0, r.x0); m.y0 = Math.min(m.y0, r.y0);
        m.x1 = Math.max(m.x1, r.x1); m.y1 = Math.max(m.y1, r.y1);
        changed = true;
      } else out.push({ ...r });
    }
    rects = out;
  }
  return rects;
}

/** Escena de cada hijo de <main>, en orden (ver tabla arriba). */
const SCENE_OF = [0, 1, 1, 2, 2, 3, 3, 4, 4];

function hexToRgb(v: string, fb: [number, number, number]): [number, number, number] {
  const m = v.trim().match(/^#([0-9a-f]{6})/i);
  if (!m) return fb;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("[CinematicStage]", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function CinematicStage() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cv: HTMLCanvasElement = el;
    const ctx = cv.getContext("webgl", {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: "high-performance",
    });
    if (!ctx) { setOff(true); return; }
    const gl: WebGLRenderingContext = ctx;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) { setOff(true); return; }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setOff(true); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, "aP");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      time: U("uTime"), res: U("uRes"), scene: U("uScene"), mouse: U("uMouse"), intro: U("uIntro"),
      px: U("uPx"), vel: U("uVel"), side: U("uSide"), drift: U("uDrift"), heroY: U("uHeroY"), heroX: U("uHeroX"), finY: U("uFinY"),
      rects: U("uR"), caps: U("uRk"), rn: U("uRn"), pad: U("uPad"),
    };
    const rectBuf = new Float32Array(MAX_RECTS * 4);
    const capBuf = new Float32Array(MAX_RECTS);

    // Colores: los tokens del sistema, leídos en vivo.
    const cs = getComputedStyle(document.documentElement);
    const tok = (n: string, fb: [number, number, number]) => hexToRgb(cs.getPropertyValue(n), fb);
    gl.uniform3fv(U("uBg"), tok("--bg", [0.075, 0.075, 0.082]));
    gl.uniform3fv(U("uSig"), tok("--signal", [0.949, 0.757, 0.306]));
    gl.uniform3fv(U("uS1"), tok("--smoke-1", [0.18, 0.184, 0.2]));
    gl.uniform3fv(U("uS2"), tok("--smoke-2", [0.27, 0.278, 0.298]));
    gl.uniform3fv(U("uS4"), tok("--smoke-4", [0.541, 0.553, 0.573]));
    gl.uniform3fv(U("uInk"), tok("--ink", [0.925, 0.918, 0.898]));

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sideMq = window.matchMedia("(min-width: 900px)");

    /* ---------- Layout: dónde empieza cada escena en el documento ---------- */
    let vh = window.innerHeight;
    let bounds: number[] = [];
    let heroC = 0, finC = 0, heroCx = -1;
    let texts: Rect[] = [];
    const measure = () => {
      vh = window.innerHeight;
      const kids = Array.from(document.querySelectorAll<HTMLElement>("main > *"));
      const n = kids.length;
      if (!n) return;
      const scenes = n === SCENE_OF.length ? SCENE_OF : kids.map((_, i) => Math.round((i / Math.max(1, n - 1)) * 4));
      const sy = window.scrollY;
      const top = (e: HTMLElement) => e.getBoundingClientRect().top + sy;
      bounds = [];
      for (let i = 1; i < n; i++) if (scenes[i] !== scenes[i - 1]) bounds.push(top(kids[i]));
      const hero = kids[0];
      heroC = top(hero) + Math.min(hero.offsetHeight, vh) * 0.5;
      // En escritorio el anillo se centra exactamente sobre el showreel.
      heroCx = -1;
      const reel = hero.querySelector<HTMLElement>(".showreel");
      if (reel) {
        const b = reel.getBoundingClientRect();
        if (b.width > 0) { heroC = b.top + sy + b.height / 2; heroCx = b.left + b.width / 2; }
      }
      const fin = kids[scenes.indexOf(4)] ?? kids[n - 1];
      finC = top(fin) + fin.offsetHeight * 0.5;
      texts = collectText();
    };
    let measureT = 0;
    const measureSoon = () => {
      window.clearTimeout(measureT);
      window.clearTimeout(lateMeasure);
      window.removeEventListener("load", measureSoon);
      measureT = window.setTimeout(measure, 180);
    };
    const sceneAt = (y: number) => {
      const c = y + vh * 0.5;
      let s = 0;
      for (const b of bounds) {
        const t = Math.min(1, Math.max(0, (c - (b - vh * 0.45)) / (vh * 0.8)));
        s += t * t * (3 - 2 * t);
      }
      return s;
    };
    /** Posición vertical (en el espacio del shader) de un punto del documento. */
    const toP = (docY: number, sy: number) => {
      const asp = cv.width / Math.max(1, cv.height);
      const sc = Math.max(1, 0.8 / asp);
      return (0.5 - (docY - sy) / vh) * 2 * sc;
    };

    /* ---------- Resolución adaptativa ---------- */
    let quality = window.innerWidth < 700 ? 0.6 : 0.8;
    const basePR = Math.min(window.devicePixelRatio || 1, 1.5);
    let pr = 1;
    const resize = () => {
      pr = Math.max(0.4, basePR * quality);
      cv.width = Math.max(1, Math.round(window.innerWidth * pr));
      cv.height = Math.max(1, Math.round(window.innerHeight * pr));
      gl.viewport(0, 0, cv.width, cv.height);
      measure();
    };
    resize();

    /* ---------- Entrada ---------- */
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
    const onMove = (e: PointerEvent) => {
      tmx = e.clientX / window.innerWidth;
      tmy = 1 - e.clientY / window.innerHeight;
    };
    let lastY = window.scrollY, vel = 0;

    const reduce = () => reduceMq.matches;
    let time = 4, last = performance.now(), introT = 0, frames = 0, acc = 0, raf = 0, dirty = true;

    const draw = (dt: number) => {
      const sy = window.scrollY;
      const dy = Math.abs(sy - lastY) / Math.max(1, vh);
      lastY = sy;
      vel += (Math.min(1, dy * 18) - vel) * 0.12;
      const k = 1 - Math.exp(-dt * 4);
      mx += (tmx - mx) * k;
      my += (tmy - my) * k;
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.res, cv.width, cv.height);
      gl.uniform1f(u.scene, sceneAt(sy));
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.intro, 1 - Math.pow(1 - introT, 3));
      gl.uniform1f(u.px, pr);
      gl.uniform1f(u.vel, vel);
      gl.uniform1f(u.side, sideMq.matches ? 1 : 0);
      gl.uniform1f(u.drift, sy / Math.max(1, vh));
      gl.uniform1f(u.heroY, toP(heroC, sy));
      {
        const asp = cv.width / Math.max(1, cv.height);
        const sc = Math.max(1, 0.8 / asp);
        gl.uniform1f(u.heroX, heroCx >= 0 ? (heroCx / Math.max(1, window.innerWidth) - 0.5) * 2 * asp * sc : asp * 0.5);
      }
      gl.uniform1f(u.finY, toP(finC, sy));
      // Bloques de texto visibles → px del canvas (y hacia arriba).
      const pad = 96;
      let n = 0;
      const vis = texts.filter((t) => t.y1 > sy - pad && t.y0 < sy + vh + pad);
      if (vis.length > MAX_RECTS) vis.sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
      for (const t of vis) {
        if (n >= MAX_RECTS) break;
        rectBuf[n * 4] = t.x0 * pr;
        rectBuf[n * 4 + 1] = (vh - (t.y1 - sy)) * pr;
        rectBuf[n * 4 + 2] = t.x1 * pr;
        rectBuf[n * 4 + 3] = (vh - (t.y0 - sy)) * pr;
        capBuf[n] = t.k;
        n++;
      }
      gl.uniform4fv(u.rects, rectBuf);
      gl.uniform1fv(u.caps, capBuf);
      gl.uniform1f(u.rn, n);
      gl.uniform1f(u.pad, pad * pr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      introT = Math.min(1, introT + dt / 2.6);
      acc += dt; frames++;
      if (frames >= 45) {
        const avg = acc / frames; frames = 0; acc = 0;
        if (avg > 0.026 && quality > 0.45) { quality *= 0.82; resize(); }
      }
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    // Con reduced-motion: cuadro fijo, sólo se redibuja al scrollear o redimensionar.
    const still = () => {
      if (!dirty) return;
      dirty = false;
      introT = 1;
      raf = requestAnimationFrame(() => { draw(1); });
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce()) { dirty = true; still(); return; }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onScroll = () => { if (reduce()) { dirty = true; still(); } };
    const onResize = () => { resize(); dirty = true; if (reduce()) still(); };
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else start(); };
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); setOff(true); };

    // El alto de la página cambia al cargar imágenes/fuentes: re-medimos.
    const ro = new ResizeObserver(measureSoon);
    ro.observe(document.body);
    // Fuentes e imágenes mueven el texto después del primer layout.
    document.fonts?.ready.then(measureSoon).catch(() => {});
    window.addEventListener("load", measureSoon);
    const lateMeasure = window.setTimeout(measure, 1600);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMq.addEventListener("change", start);
    cv.addEventListener("webglcontextlost", onLost);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(measureT);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMq.removeEventListener("change", start);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  if (off) return null;
  return <canvas ref={ref} className="stage-gl" aria-hidden="true" />;
}
