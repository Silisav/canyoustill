// The site's paper (AGENTS.md "Background"), loaded once the page is idle: a faint texture behind
// the site's pages that responds a little to the pointer and is still otherwise. Under reduced
// motion it's drawn but doesn't respond.

import { prefersReducedMotion } from "../game/reveal";

export function startPaper(): () => void {
  return folds();
}

// --- folds ------------------------------------------------------------------------------------

/**
 * How strongly the folds show: the `line` colour at this opacity, a little more under the
 * pointer. Lower in light mode, where thin dark lines catch the eye more at the same contrast
 * (about 1.08:1 light, 1.11:1 dark).
 */
const FAINT = { light: 0.2, dark: 0.26 };
const LIFT = 0.15;

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0., 1.); }`;

// Contour lines of warped noise, like a brain's folds, printed on the page (they scroll with it);
// under the pointer the page swells a little, like a lens.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 res;
uniform float dpr;
uniform vec2 scroll;
uniform vec2 ptr;
uniform float amp;
uniform vec4 ink;
uniform float lift;
out vec4 o;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int k = 0; k < 4; k++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
  return v;
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr;
  vec2 d = px - ptr;
  float r = length(d);
  float near = exp(-r * r / 45000.) * amp;
  vec2 p = (px + scroll - d * near * .18) / 380.;
  float k = 10. * fbm(p + .9 * vec2(fbm(p + 3.1), fbm(p + 7.7)));
  float f = fract(k);
  // 1.3 CSS pixels wide on every screen (fwidth is per device pixel, so scale by dpr): on a 2x
  // Retina screen the lines were half as thick and nearly vanished.
  float line = 1. - smoothstep(0., 1.3 * dpr * fwidth(k), min(f, 1. - f));
  float a = line * (ink.a + near * lift);
  o = vec4(ink.rgb * a, a);
}`;

function program(gl: WebGL2RenderingContext): WebGLProgram | null {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function folds(): () => void {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { antialias: false });
  const prog = gl && program(gl);
  if (!gl || !prog) return () => {}; // no WebGL: the plain page
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(["res", "dpr", "scroll", "ptr", "amp", "ink", "lift"].map((k) => [k, gl.getUniformLocation(prog, k)]));

  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none fixed inset-0 -z-10 size-full opacity-0 transition-opacity duration-700";
  document.body.prepend(canvas);

  const react = !prefersReducedMotion();
  const at = { x: 0, y: 0 };
  const to = { x: 0, y: 0 };
  let amp = 0;
  let ampTo = 0;
  let ink = [0, 0, 0];
  let faint = FAINT.light;
  let frame = 0;

  const readInk = () => {
    const style = getComputedStyle(document.documentElement);
    const hex = style.getPropertyValue("--c-line").trim().slice(1);
    ink = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    faint = style.colorScheme.includes("dark") ? FAINT.dark : FAINT.light;
  };
  const draw = () => {
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.dpr, canvas.width / innerWidth);
    gl.uniform2f(u.scroll, scrollX, scrollY);
    gl.uniform2f(u.ptr, at.x, at.y);
    gl.uniform1f(u.amp, amp);
    gl.uniform4f(u.ink, ink[0], ink[1], ink[2], faint);
    gl.uniform1f(u.lift, LIFT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const size = () => {
    // Full sharpness where there's a fine pointer; phones draw at CSS pixels (faint lines, less work).
    const dpr = matchMedia("(pointer: fine)").matches ? Math.min(devicePixelRatio, 2) : 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const tick = () => {
    frame = 0;
    // A slow follow: the texture drifts after the pointer rather than snapping to it.
    at.x += (to.x - at.x) * 0.07;
    at.y += (to.y - at.y) * 0.07;
    amp += (ampTo - amp) * 0.05;
    draw();
    if (Math.abs(to.x - at.x) + Math.abs(to.y - at.y) > 0.3 || Math.abs(ampTo - amp) > 0.002) frame = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    to.x = e.clientX;
    to.y = e.clientY;
    if (amp < 0.02) Object.assign(at, to); // arriving: start under the pointer, don't sweep in
    ampTo = 1;
    kick();
  };
  const onLeave = () => {
    ampTo = 0;
    kick();
  };
  const onResize = () => {
    size();
    draw();
  };
  const onTheme = () => {
    readInk();
    draw();
  };

  readInk();
  size();
  draw();
  requestAnimationFrame(() => canvas.classList.remove("opacity-0"));

  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", onResize);
  if (react) {
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }
  const themes = new MutationObserver(onTheme);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const system = matchMedia("(prefers-color-scheme: dark)");
  system.addEventListener("change", onTheme);

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", kick);
    removeEventListener("resize", onResize);
    removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    themes.disconnect();
    system.removeEventListener("change", onTheme);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
}
