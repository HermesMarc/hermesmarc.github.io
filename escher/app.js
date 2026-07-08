"use strict";

// ---------------------------------------------------------------------------
// Print Gallery — Escher conformal mapping tool
//
// Four views, one shader (selected by uStage). Working in the complex plane:
//
//   sampleP(ζ)  = the source picture, placed by the user's pan/zoom/rotate
//                 (uv = ζ·m + b).
//
//   1 Source   : sampleP(ζ)
//   2 Log      : sampleP(exp(z))                      — the logarithm
//   3 Tiled+rot: sampleP(exp( wrap(a·z + t) ))        — tile the rectangle,
//                                                        then rotate/translate
//   4 Result   : sampleP(exp( wrap(a·log(w) + t) ))   — apply eᶻ
//
// where a = s·e^{iθ}, t is the translation, and wrap() folds a coordinate into
// the user's tile rectangle so it repeats across the plane.
// ---------------------------------------------------------------------------

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform sampler2D uTex;
uniform vec2  uResolution;
uniform vec2  uViewCenter;
uniform float uViewHalf;
uniform float uImgAspect;
uniform vec2  uM;          // source placement: scale·rotation (complex)
uniform vec2  uB;          // source placement: pan
uniform vec2  uA;          // log-space rotation/scale a = s·e^{iθ}
uniform vec2  uT;          // log-space translation
uniform vec2  uRectCenter;
uniform vec2  uRectSize;
uniform vec2  uOrigin;     // complex-plane origin, in picture space
uniform float uOverlap;    // tile transition width, as fraction of the tile
uniform int   uStage;      // 1 source, 2 log, 3 tiled+rot, 4 result
uniform int   uTexStage;   // texture is the source picture (1) or a log image (2)
uniform vec4  uTexMap;     // for an uploaded log-space texture: plane rect (cx,cy,hx,hy)
uniform int   uWrapFill;   // 1 = fill voids beyond the image with content one tile to the left

const vec4 BG = vec4(0.04, 0.04, 0.05, 1.0);
// Max tiles wrap-fill steps left looking for in-image content. Assumes the
// visible radial range spans at most this many tile widths.
const int WRAP_FILL_STEPS = 16;

vec2 cExp(vec2 z){ float e = exp(z.x); return vec2(e*cos(z.y), e*sin(z.y)); }
vec2 cLog(vec2 z){ return vec2(0.5 * log(max(dot(z, z), 1e-16)), atan(z.y, z.x)); }  // log|z| without sqrt
vec2 cMul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }

// Sample the picture at a point p in picture space (x in [-aspect,aspect],
// y in [-1,1]). The full uploaded image is always used.
vec4 sampleAtP(vec2 p) {
  vec2 uv = vec2(p.x / uImgAspect, p.y) * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return BG;
  return texture(uTex, uv);
}

// Sample a log-space texture (an image uploaded to View 2 or 3) at plane
// coordinate w, with BG outside it. dwx/dwy are screen-space derivatives of w,
// for a clean mip level.
vec4 texAt(vec2 w, vec2 dwx, vec2 dwy) {
  vec2 uv  = (w - uTexMap.xy) / (2.0 * uTexMap.zw) + 0.5;
  vec2 dux = dwx / (2.0 * uTexMap.zw);
  vec2 duy = dwy / (2.0 * uTexMap.zw);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return BG;
  return textureGrad(uTex, uv, dux, duy);
}
// Plain (auto-mip) sample of a log-space texture — for showing the View-2 image.
vec4 texPlain(vec2 w) {
  vec2 uv = (w - uTexMap.xy) / (2.0 * uTexMap.zw) + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return BG;
  return texture(uTex, uv);
}

// Sample the source from a log-space coordinate zz (point = origin + exp(zz)).
// dzx/dzy are the screen-space derivatives of zz, propagated analytically so the
// mip level stays continuous across the tile seam (here the Jacobian d(point)/dzz
// is exp(zz) = e). With wrap-fill on, if the point lands outside the image, step
// one tile-width left (a smaller radius) and retry — filling the void with the
// periodic content to the left.
vec4 sampleLog(vec2 zz, vec2 dzx, vec2 dzy) {
  for (int k = 0; k < WRAP_FILL_STEPS; k++) {
    vec2 e = cExp(zz);
    vec2 p = uOrigin + e;
    vec2 uv = vec2(p.x / uImgAspect, p.y) * 0.5 + 0.5;
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec2 dpx = cMul(e, dzx), dpy = cMul(e, dzy);
      vec2 dux = vec2(dpx.x / uImgAspect, dpx.y) * 0.5;
      vec2 duy = vec2(dpy.x / uImgAspect, dpy.y) * 0.5;
      return textureGrad(uTex, uv, dux, duy);
    }
    if (uWrapFill == 0) break;
    zz.x -= uRectSize.x;                         // one tile to the left
  }
  return BG;
}

// Sample one tile at fold coordinate gw (in [-0.5,0.5] units of the tile).
vec4 tap(vec2 gw, vec2 dzx, vec2 dzy) {
  vec2 zz = uRectCenter + gw * uRectSize;
  if (uTexStage == 2) return texAt(zz, dzx, dzy);   // tile the uploaded log image
  return sampleLog(zz, dzx, dzy);
}

// Tile the plane with the rectangle and cross-fade opposite edges over a band
// of width uOverlap, so neighbouring tiles transition smoothly (both axes).
vec4 sampleTiled(vec2 zpre, vec2 dzx, vec2 dzy) {
  vec2 g = (zpre - uRectCenter) / uRectSize;
  vec2 gw = g - round(g);                       // fold into the tile
  if (uOverlap <= 0.0) return tap(gw, dzx, dzy);   // no blend: a single tap
  vec2 dEdge = vec2(0.5) - abs(gw);             // distance to the nearest seam
  vec2 nb = -sign(gw);                          // neighbour across that seam
  vec2 wN = clamp(0.5 * (1.0 - dEdge / max(uOverlap, 1e-4)), 0.0, 0.5);
  // Away from the seams both neighbour weights are 0 — one tap suffices (all
  // taps use explicit gradients, so branching here is derivative-safe).
  if (wN.x <= 0.0 && wN.y <= 0.0) return tap(gw, dzx, dzy);
  vec4 c00 = tap(gw, dzx, dzy);
  vec4 c10 = tap(gw + vec2(nb.x, 0.0), dzx, dzy);
  vec4 c01 = tap(gw + vec2(0.0, nb.y), dzx, dzy);
  vec4 c11 = tap(gw + nb, dzx, dzy);
  return mix(mix(c00, c10, wN.x), mix(c01, c11, wN.x), wN.y);
}

void main() {
  vec2 f = gl_FragCoord.xy / uResolution;
  vec2 p = (f - 0.5) * 2.0;
  p.x *= uResolution.x / uResolution.y;
  vec2 zin = uViewCenter + p * uViewHalf;

  // View 1 (the source) is out of sync once a log image is uploaded.
  if (uStage == 1 && uTexStage == 2) { outColor = BG; return; }

  // View 1 just shows the placed picture (uv = ζ·m + b) — pan/zoom/rotate are
  // purely for viewing and do not affect the transform below.
  if (uStage == 1) { outColor = sampleAtP(cMul(zin, uM) + uB); return; }

  // View 2: the logarithm — from the source, or the uploaded log image / tile.
  // (No wrap-fill here: View 2 shows the raw log so the void is visible.)
  if (uStage == 2) {
    outColor = (uTexStage == 2) ? texPlain(zin)
                                : sampleAtP(uOrigin + cExp(zin));
    return;
  }

  // Views 3 & 4: tile the rectangle, then rotate/translate (and exp for 4).
  // dFdx/dFdy of zpre stay continuous across the seam (only the wrap is not).
  vec2 zpre = (uStage == 3) ? (cMul(uA, zin) + uT) : (cMul(uA, cLog(zin)) + uT);
  outColor = sampleTiled(zpre, dFdx(zpre), dFdy(zpre));
}`;

// --- WebGL bootstrap -------------------------------------------------------

const glCanvas = document.createElement("canvas");
const gl = glCanvas.getContext("webgl2", {
  preserveDrawingBuffer: true,
  antialias: false,
});
if (!gl) {
  document.body.innerHTML =
    '<p style="color:#fff;padding:20px;font-family:sans-serif">WebGL2 is not available in this browser.</p>';
  throw new Error("no webgl2");
}

function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error("Shader compile error: " + gl.getShaderInfoLog(sh));
  }
  return sh;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error("Link error: " + gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 3, -1, -1, 3]),
  gl.STATIC_DRAW,
);
const aPos = gl.getAttribLocation(program, "aPos");
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

const U = {};
for (const name of [
  "uResolution",
  "uViewCenter",
  "uViewHalf",
  "uImgAspect",
  "uM",
  "uB",
  "uA",
  "uT",
  "uRectCenter",
  "uRectSize",
  "uOrigin",
  "uOverlap",
  "uStage",
  "uTexStage",
  "uTexMap",
  "uWrapFill",
  "uTex",
]) {
  U[name] = gl.getUniformLocation(program, name);
}

// --- Texture ---------------------------------------------------------------

const texture = gl.createTexture();
let imgAspect = 1;
let haveImage = false;
// Whether the texture is the source picture (1) or a log-space image (2), and —
// for a log image — the plane rect it covers.
let texStage = 1;
const texMap = { cx: -0.5, cy: 0, hx: Math.PI, hy: Math.PI };
// Plane rect of the most recent download per view, so re-uploading the same
// view maps the image back to exactly where it came from (an exact round-trip).
const lastRegion = { 2: null, 3: null };

// view: 1 = source picture; 2 = log picture (select the tile); 3 = the tile
// itself (whole image). Views 2 and 3 both load a log-space image (texStage 2);
// View 3 just selects the whole image as the tile by default.
function uploadImage(img, view = 1) {
  imgAspect = img.naturalWidth / img.naturalHeight;
  texStage = view === 1 ? 1 : 2;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  haveImage = true;
  if (view === 1) {
    resetSource();
  } else {
    // Reuse the last download's plane rect only if the image plausibly is that
    // download (aspect matches); an unrelated image would be stretched into it.
    const r = lastRegion[view];
    if (r && Math.abs(r.hx / r.hy - imgAspect) < 1e-3 * imgAspect) {
      // Re-uploading what was just downloaded from this view: reuse its exact
      // plane rect, so the round-trip lines up pixel-for-pixel.
      texMap.cx = r.cx;
      texMap.cy = r.cy;
      texMap.hx = r.hx;
      texMap.hy = r.hy;
    } else {
      // No prior download: map the image onto the canonical log rectangle.
      texMap.cx = -0.5;
      texMap.cy = 0;
      texMap.hy = Math.PI;
      texMap.hx = Math.PI * imgAspect;
    }
    // Select the whole uploaded image as the tile: the rectangle covers it, so
    // its period matches the image and Views 3/4 tile + transform it. Centre the
    // reference point in the tile too.
    rect.cx = texMap.cx;
    rect.cy = texMap.cy;
    rect.w = 2 * texMap.hx;
    rect.h = 2 * texMap.hy;
    refPt.x = texMap.cx;
    refPt.y = texMap.cy;
  }
  render();
}

// --- State ------------------------------------------------------------------

// View-1 navigation transform (display only): uv = ζ·m + b. Pan/zoom/rotate
// change this; it does NOT affect the mapping (which is driven by the origin
// pin and the View 2 tile rectangle).
const src = { m: { x: 1, y: 0 }, b: { x: 0, y: 0 } };
// Tile rectangle in log space.
const rect = { cx: -0.5, cy: 0, w: 1.2, h: 2 * Math.PI };
// Complex-plane origin (ζ=0) about which the logarithm is taken (picture space,
// x in [-aspect,aspect], y in [-1,1]). The full image is always mapped.
const origin = { x: 0, y: 0 };
// Reference point (log space) and two line endpoints, stored as integer tile
// offsets from it. "Escher it!" can orient the recursion from this line.
const refPt = { x: -0.5, y: 0 };
const refEnds = [
  { m: 0, n: 0 },
  { m: 1, n: 1 },
];
let refDrag = null; // while dragging a line end in View 3: { i, free:{x,y} }

const cMul = (a, b) => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
const cInv = (m) => {
  const d = m.x * m.x + m.y * m.y;
  return { x: m.x / d, y: -m.y / d };
};
const cAdd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const cSub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

function resetSource() {
  const half = Math.max(imgAspect, 1) * 1.15;
  src.m = { x: imgAspect / half, y: 0 };
  src.b = { x: 0, y: 0 };
  views.v1.half = half;
  origin.x = 0;
  origin.y = 0;
}

// View configs: pixel → plane is  center + p·half.
const views = {
  v1: { key: "v1", canvas: null, stage: 1, center: { x: 0, y: 0 }, half: 2 },
  v4: { key: "v4", canvas: null, stage: 4, center: { x: 0, y: 0 }, half: 1.8 },
  v2: {
    key: "v2",
    canvas: null,
    stage: 2,
    center: { x: -0.5, y: 0 },
    half: Math.PI,
  },
  v3: {
    key: "v3",
    canvas: null,
    stage: 3,
    center: { x: -0.5, y: 0 },
    half: Math.PI,
  },
};
views.v1.canvas = document.getElementById("c1");
views.v4.canvas = document.getElementById("c4");
views.v2.canvas = document.getElementById("c2");
views.v3.canvas = document.getElementById("c3");

// --- Parameter fields -------------------------------------------------------

const ids = ["rw", "rh", "blend", "theta", "scale", "tx", "ty", "outSize"];
const el = {};
for (const id of ids) el[id] = document.getElementById(id);

// NOTE: deliberately not clamped to the field's min/max — "Escher it!" writes
// exact values that may sit below a min (tiny tiles give Scale < 0.05), and
// clamping them would break the lattice match. Singular values are guarded
// where they bite (currentA, the rw/rh listeners).
const num = (id) => parseFloat(el[id].value) || 0;

// Format a value for a field: keep real precision but trim trailing zeros
// (e.g. 1.2, not 1.2000; 6.283185, not 6.28).
const fmtNum = (v) => String(+v.toFixed(6));

// Reflect the tile size in the Width/Height fields — but never overwrite a
// field while the user is editing it (that would clobber their typing and
// round away precision); only the View-2 rectangle drag pushes values here.
function syncRectFields() {
  if (document.activeElement !== el.rw) el.rw.value = fmtNum(rect.w);
  if (document.activeElement !== el.rh) el.rh.value = fmtNum(rect.h);
}
// The tile affects View 2's overlay and the Views 3/4 tiling; the transform and
// blend affect only Views 3 & 4. Repaint just those.
const TILE_VIEWS = ["v2", "v3", "v4"],
  TWIST_VIEWS = ["v3", "v4"];
// Width grows to the left (right edge fixed); height grows up (bottom fixed).
el.rw.addEventListener("input", () => {
  const right = rect.cx + rect.w / 2;
  rect.w = Math.max(num("rw"), 0.05);
  rect.cx = right - rect.w / 2;
  render(TILE_VIEWS);
});
el.rh.addEventListener("input", () => {
  const bottom = rect.cy - rect.h / 2;
  rect.h = Math.max(num("rh"), 0.05);
  rect.cy = bottom + rect.h / 2;
  render(TILE_VIEWS);
});
// On leaving the field, show the actual stored value (reconciles any clamp).
el.rw.addEventListener("change", () => {
  el.rw.value = fmtNum(rect.w);
});
el.rh.addEventListener("change", () => {
  el.rh.value = fmtNum(rect.h);
});
for (const id of ["blend", "theta", "scale", "tx", "ty"])
  el[id].addEventListener("input", () => render(TWIST_VIEWS));

document.getElementById("resetTf").addEventListener("click", () => {
  el.theta.value = 0;
  el.scale.value = 1;
  el.tx.value = 0;
  el.ty.value = 0;
  render();
});

// The Print Gallery twist. One turn of the output (2πi in log w) must land on
// a lattice vector D, so a = −i·D/(2π) = (D.y − i·D.x)/(2π).
//   • Reference mode: D is the vector between the two chosen reference-point
//     copies, and the translation is set so their midpoint maps to the origin
//     (this lays the line on the imaginary axis at ±πi).
//   • Otherwise: D = one scale step + one angular period = (rw, rh), and the
//     translation (spiral phase) is left as set.
const refChk = document.getElementById("refMode");
refChk.addEventListener("change", render);
const wrapChk = document.getElementById("wrapFill");
wrapChk.addEventListener("change", render);

document.getElementById("escher").addEventListener("click", () => {
  let D,
    mid = null;
  if (refChk.checked) {
    const e0 = endLog(0),
      e1 = endLog(1);
    D = cSub(e1, e0);
    mid = { x: (e0.x + e1.x) / 2, y: (e0.y + e1.y) / 2 };
  } else {
    D = { x: rect.w, y: rect.h };
  }
  const a = { x: D.y / (2 * Math.PI), y: -D.x / (2 * Math.PI) };
  el.scale.value = Math.hypot(a.x, a.y).toFixed(4);
  el.theta.value = ((Math.atan2(a.y, a.x) * 180) / Math.PI).toFixed(2);
  if (mid) {
    el.tx.value = mid.x.toFixed(4);
    el.ty.value = mid.y.toFixed(4);
  }
  render();
});

function currentA() {
  // A typed Scale of 0 would make the transform singular (cInv divides by
  // |a|²); nudge it so overlay math stays finite. The min attribute doesn't
  // stop typed values, and num() must not clamp (see note there).
  const s = num("scale") || 1e-9,
    t = (num("theta") * Math.PI) / 180;
  return [s * Math.cos(t), s * Math.sin(t)];
}
const aComplex = () => {
  const [x, y] = currentA();
  return { x, y };
};
const tVec = () => ({ x: num("tx"), y: num("ty") });
// A reference-point copy in log space (refPt + integer tile offset).
const endLog = (i) => ({
  x: refPt.x + refEnds[i].m * rect.w,
  y: refPt.y + refEnds[i].n * rect.h,
});
// Log/source point <-> View 3 plane coord. View 3 maps zin -> a·zin + t, so a
// source point P shows up at zin = a⁻¹·(P − t).
const logToV3 = (P) => cMul(cInv(aComplex()), cSub(P, tVec()));
const v3ToLog = (zin) => cAdd(cMul(aComplex(), zin), tVec());

// --- Drag-to-scrub on number fields ----------------------------------------

function clampVal(input, v) {
  if (input.min !== "" && !isNaN(parseFloat(input.min)))
    v = Math.max(v, parseFloat(input.min));
  if (input.max !== "" && !isNaN(parseFloat(input.max)))
    v = Math.min(v, parseFloat(input.max));
  return v;
}
// Vertical distance (px) from the field at which scrub sensitivity is halved.
const SCRUB_FALLOFF = 80;
function attachScrub(handle, input) {
  const perPx = parseFloat(input.dataset.scrub || input.step || "1");
  let active = false,
    moved = false,
    startX = 0,
    lastX = 0,
    baseY = 0,
    val = 0,
    pid = null;
  handle.addEventListener("pointerdown", (e) => {
    active = true;
    moved = false;
    startX = lastX = e.clientX;
    const r = handle.getBoundingClientRect();
    baseY = r.top + r.height / 2; // the field's vertical centre
    val = parseFloat(input.value) || 0;
    pid = e.pointerId;
    handle.setPointerCapture?.(pid);
  });
  handle.addEventListener("pointermove", (e) => {
    if (!active) return;
    if (!moved && Math.abs(e.clientX - startX) > 3) {
      moved = true;
      input.blur();
    }
    if (moved) {
      e.preventDefault();
      // Sensitivity falls off with vertical distance from the field: at its own
      // level it scrubs as before; moving away (up or down) gives finer control.
      const y = e.clientY - baseY;
      const sens =
        (SCRUB_FALLOFF * SCRUB_FALLOFF) /
        (SCRUB_FALLOFF * SCRUB_FALLOFF + y * y);
      val = clampVal(input, val + (e.clientX - lastX) * perPx * sens);
      input.value = fmtNum(val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    lastX = e.clientX;
  });
  const end = () => {
    if (!active) return;
    active = false;
    if (pid != null) handle.releasePointerCapture?.(pid);
    if (moved) handle.dataset.justScrubbed = "1";
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
  handle.addEventListener("click", (e) => {
    if (handle.dataset.justScrubbed) {
      delete handle.dataset.justScrubbed;
      e.preventDefault();
    }
  });
}
for (const id of ids) attachScrub(el[id], el[id]);
for (const label of document.querySelectorAll("label[data-for]")) {
  attachScrub(label, document.getElementById(label.dataset.for));
}

// --- Plane <-> pixel (device pixels) ---------------------------------------

function pixToPlane(view, px, py) {
  const c = view.canvas,
    aspect = c.width / c.height;
  const fx = px / c.width,
    fy = 1 - py / c.height;
  return {
    x: view.center.x + (fx - 0.5) * 2 * aspect * view.half,
    y: view.center.y + (fy - 0.5) * 2 * view.half,
  };
}
function planeToPix(view, pt) {
  const c = view.canvas,
    aspect = c.width / c.height;
  const fx = (pt.x - view.center.x) / (2 * aspect * view.half) + 0.5;
  const fy = (pt.y - view.center.y) / (2 * view.half) + 0.5;
  return [fx * c.width, (1 - fy) * c.height];
}
// Pointer client coords -> device pixels on a canvas.
function evToPx(view, e) {
  const r = view.canvas.getBoundingClientRect();
  return [
    (e.clientX - r.left) * (view.canvas.width / r.width),
    (e.clientY - r.top) * (view.canvas.height / r.height),
  ];
}

// Picture space <-> View 1 screen pixels.  Display: p = ζ·m + b.
function screenToP(px, py) {
  return cAdd(cMul(pixToPlane(views.v1, px, py), src.m), src.b);
}
function pToScreen(p) {
  return planeToPix(views.v1, cMul(cSub(p, src.b), cInv(src.m)));
}

// --- Rendering --------------------------------------------------------------

function drawStage(view, w, h) {
  if (glCanvas.width !== w) glCanvas.width = w; // resizing reallocates the GL
  if (glCanvas.height !== h) glCanvas.height = h; // backbuffer; skip when unchanged
  gl.viewport(0, 0, w, h);
  const [ar, ai] = currentA();
  gl.uniform2f(U.uResolution, w, h);
  gl.uniform2f(U.uViewCenter, view.center.x, view.center.y);
  gl.uniform1f(U.uViewHalf, view.half);
  gl.uniform1f(U.uImgAspect, imgAspect);
  gl.uniform2f(U.uM, src.m.x, src.m.y);
  gl.uniform2f(U.uB, src.b.x, src.b.y);
  gl.uniform2f(U.uA, ar, ai);
  gl.uniform2f(U.uT, num("tx"), num("ty"));
  gl.uniform2f(U.uRectCenter, rect.cx, rect.cy);
  gl.uniform2f(U.uRectSize, rect.w, rect.h);
  gl.uniform2f(U.uOrigin, origin.x, origin.y);
  gl.uniform1f(U.uOverlap, num("blend"));
  gl.uniform1i(U.uStage, view.stage);
  gl.uniform1i(U.uTexStage, texStage);
  gl.uniform4f(U.uTexMap, texMap.cx, texMap.cy, texMap.hx, texMap.hy);
  gl.uniform1i(U.uWrapFill, wrapChk.checked ? 1 : 0);
  gl.uniform1i(U.uTex, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Overlay ink: stroke the current path twice — a wide dark halo underneath,
// the colour on top. A single fixed (or even background-sampled) colour always
// vanishes somewhere along a long path; the casing keeps it visible on any
// imagery, light or dark.
function cased(ctx, dpr, color = "#6ea8fe", w = 2) {
  ctx.lineWidth = (w + 2) * dpr;
  ctx.strokeStyle = "rgba(10,12,16,0.85)";
  ctx.stroke();
  ctx.lineWidth = w * dpr;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// A draggable handle: white dot with a coloured outline over a dark halo.
function drawHandle(ctx, x, y, dpr, stroke = "#6ea8fe") {
  ctx.beginPath();
  ctx.arc(x, y, 5 * dpr, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  cased(ctx, dpr, stroke);
}
// Four corners (bl, br, tr, tl) of an axis-aligned rect from centre + half-size.
function rectCornersHalf(cx, cy, hx, hy) {
  return [
    { x: cx - hx, y: cy - hy },
    { x: cx + hx, y: cy - hy },
    { x: cx + hx, y: cy + hy },
    { x: cx - hx, y: cy + hy },
  ];
}

function drawRectOverlay() {
  const view = views.v2,
    c = view.canvas,
    ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const corners = rectCornersHalf(rect.cx, rect.cy, rect.w / 2, rect.h / 2).map(
    (p) => planeToPix(view, p),
  );

  // Faint tiled copies left/right to convey periodicity.
  ctx.lineWidth = 1 * dpr;
  ctx.strokeStyle = "rgba(110,168,254,0.25)";
  for (const k of [-2, -1, 1, 2]) {
    const [x0, y0] = planeToPix(view, {
      x: rect.cx - rect.w / 2 + k * rect.w,
      y: rect.cy - rect.h / 2,
    });
    const [x1, y1] = planeToPix(view, {
      x: rect.cx + rect.w / 2 + k * rect.w,
      y: rect.cy + rect.h / 2,
    });
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }

  ctx.beginPath();
  corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  cased(ctx, dpr);
  // Handles at the midpoint of each side (drag to change just width or height).
  const edges = [
    { x: rect.cx - rect.w / 2, y: rect.cy }, // left
    { x: rect.cx + rect.w / 2, y: rect.cy }, // right
    { x: rect.cx, y: rect.cy + rect.h / 2 }, // top
    { x: rect.cx, y: rect.cy - rect.h / 2 }, // bottom
  ].map((p) => planeToPix(view, p));
  for (const [x, y] of edges) drawHandle(ctx, x, y, dpr);

  if (refChk.checked) {
    const [rx, ry] = planeToPix(view, refPt);
    drawHandle(ctx, rx, ry, dpr);
  }
}

// View 3: the reference point repeated in every tile (grey), with two copies
// connected by a draggable line.
function drawView3Refs() {
  if (!refChk.checked) return;
  const view = views.v3,
    ctx = view.canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Visible source-space (zpre) bounds → lattice index range.
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of [
    [0, 0],
    [view.canvas.width, 0],
    [0, view.canvas.height],
    [view.canvas.width, view.canvas.height],
  ]) {
    const s = v3ToLog(pixToPlane(view, x, y));
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
  }
  const m0 = Math.floor((minX - refPt.x) / rect.w),
    m1 = Math.ceil((maxX - refPt.x) / rect.w);
  const n0 = Math.floor((minY - refPt.y) / rect.h),
    n1 = Math.ceil((maxY - refPt.y) / rect.h);
  if ((m1 - m0 + 1) * (n1 - n0 + 1) <= 4000) {
    for (let m = m0; m <= m1; m++)
      for (let n = n0; n <= n1; n++) {
        const [x, y] = planeToPix(
          view,
          logToV3({ x: refPt.x + m * rect.w, y: refPt.y + n * rect.h }),
        );
        drawHandle(ctx, x, y, dpr, "#9aa0b0"); // quiet grey copies
      }
  }

  // The two highlighted copies + connecting line (one end may be mid-drag).
  const e0 = refDrag && refDrag.i === 0 ? refDrag.free : endLog(0);
  const e1 = refDrag && refDrag.i === 1 ? refDrag.free : endLog(1);
  const p0 = planeToPix(view, logToV3(e0)),
    p1 = planeToPix(view, logToV3(e1));
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  cased(ctx, dpr);
  for (const p of [p0, p1]) drawHandle(ctx, p[0], p[1], dpr);
}

function drawView1Overlay() {
  const c = views.v1.canvas,
    ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Origin pin (ζ = 0) — accent over a dark halo, visible on any background.
  const [ox, oy] = pToScreen(origin);
  const r = 9 * dpr;
  ctx.beginPath();
  ctx.arc(ox, oy, r, 0, 2 * Math.PI);
  cased(ctx, dpr);
  ctx.beginPath();
  ctx.moveTo(ox - r * 1.6, oy);
  ctx.lineTo(ox + r * 1.6, oy);
  ctx.moveTo(ox, oy - r * 1.6);
  ctx.lineTo(ox, oy + r * 1.6);
  cased(ctx, dpr);
}

// Each view's 2D overlay, drawn on top of its blitted GL frame.
const overlayFor = {
  v1: drawView1Overlay,
  v2: drawRectOverlay,
  v3: drawView3Refs,
};

// render() with no argument repaints every view; render(["v3","v4"]) repaints
// only those. Dirty keys accumulate (union) until the next animation frame, so
// batching never drops a view. Display-only interactions (pan/zoom of one view)
// pass just that view; parameter changes pass the views they actually affect.
let raf = 0,
  pendingAll = false;
const pending = new Set();
function render(dirty) {
  // dirty is a view-key array; anything else (no arg, or an Event when render is
  // used directly as a listener) means repaint everything.
  if (Array.isArray(dirty)) {
    for (const k of dirty) pending.add(k);
  } else pendingAll = true;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const keys = pendingAll ? Object.keys(views) : [...pending];
    pending.clear();
    pendingAll = false;
    if (!haveImage) return;
    syncRectFields();
    const dpr = window.devicePixelRatio || 1;
    for (const key of keys) {
      const v = views[key];
      const w = Math.max(1, Math.floor(v.canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(v.canvas.clientHeight * dpr));
      if (v.canvas.width !== w) v.canvas.width = w;
      if (v.canvas.height !== h) v.canvas.height = h;
      drawStage(v, w, h);
      v.canvas.getContext("2d").drawImage(glCanvas, 0, 0);
      if (overlayFor[key]) overlayFor[key]();
    }
  });
}
window.addEventListener("resize", render);

// --- View 1: pan / zoom the source -----------------------------------------

// Decide what a pointerdown in View 1 grabs: the origin pin, or otherwise pan
// the picture (viewing only).
function hitView1(px, py) {
  const dpr = window.devicePixelRatio || 1;
  const [ox, oy] = pToScreen(origin);
  if (Math.hypot(ox - px, oy - py) < 11 * dpr) return { type: "pin" };
  return null;
}

let v1Drag = null;
views.v1.canvas.addEventListener("pointerdown", (e) => {
  const [px, py] = evToPx(views.v1, e);
  const hit = hitView1(px, py);
  if (hit) {
    v1Drag = { ...hit, last: screenToP(px, py) };
  } else {
    v1Drag = { type: "pan", last: pixToPlane(views.v1, px, py) };
    views.v1.canvas.style.cursor = "grabbing";
  }
  views.v1.canvas.setPointerCapture(e.pointerId);
});
views.v1.canvas.addEventListener("pointermove", (e) => {
  if (!v1Drag) return;
  const [px, py] = evToPx(views.v1, e);
  if (v1Drag.type === "pin") {
    origin.x = screenToP(px, py).x;
    origin.y = screenToP(px, py).y;
    render(); // origin drives the whole mapping
  } else {
    // pan — View 1 display only
    const now = pixToPlane(views.v1, px, py);
    const dm = cMul(src.m, {
      x: now.x - v1Drag.last.x,
      y: now.y - v1Drag.last.y,
    });
    src.b.x -= dm.x;
    src.b.y -= dm.y;
    v1Drag.last = pixToPlane(views.v1, px, py);
    render(["v1"]);
  }
});
const dropV1 = () => {
  v1Drag = null;
  views.v1.canvas.style.cursor = "grab";
};
views.v1.canvas.addEventListener("pointerup", dropV1);
views.v1.canvas.addEventListener("pointercancel", dropV1);

views.v1.canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const [px, py] = evToPx(views.v1, e);
    const z0 = pixToPlane(views.v1, px, py);
    const g = Math.exp(-e.deltaY * 0.0015); // zoom factor about the cursor
    scaleSourceAbout(z0, g);
    render(["v1"]); // View 1 display only
  },
  { passive: false },
);

// uv(ζ) = ζ·m + b. To keep ζ0's uv fixed while replacing m by m', set
// b' = uv0 − ζ0·m'.
function setSourceKeeping(z0, newM) {
  const uv0 = {
    x: cMul(z0, src.m).x + src.b.x,
    y: cMul(z0, src.m).y + src.b.y,
  };
  src.m = newM;
  const t = cMul(z0, src.m);
  src.b = { x: uv0.x - t.x, y: uv0.y - t.y };
}
function scaleSourceAbout(z0, g) {
  setSourceKeeping(z0, { x: src.m.x * g, y: src.m.y * g });
}

// --- Generic view pan / zoom (navigation; moves the view's center & half) --

// `down(px,py,e)` may return a custom drag object handled by `move`; if it
// returns null, a plain pan starts instead.
function attachPanZoom(view, hooks = {}) {
  const drawView = hooks.render || (() => render([view.key])); // display-only: this view
  const drawAll = hooks.render || render; // custom moves may affect others
  let drag = null;
  view.canvas.addEventListener("pointerdown", (e) => {
    const [px, py] = evToPx(view, e);
    const custom = hooks.down ? hooks.down(px, py) : null;
    if (custom) drag = { custom };
    else {
      drag = { pan: true, grab: pixToPlane(view, px, py) };
      view.canvas.style.cursor = "grabbing";
    }
    view.canvas.setPointerCapture(e.pointerId);
  });
  view.canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const [px, py] = evToPx(view, e);
    if (drag.pan) {
      const now = pixToPlane(view, px, py);
      view.center.x += drag.grab.x - now.x;
      view.center.y += drag.grab.y - now.y;
      drawView();
    } else if (hooks.move) {
      hooks.move(drag.custom, px, py);
      drawAll();
    }
  });
  const up = () => {
    if (drag && drag.custom && hooks.up) {
      hooks.up(drag.custom);
      drawAll();
    }
    drag = null;
    view.canvas.style.cursor = "";
  };
  view.canvas.addEventListener("pointerup", up);
  view.canvas.addEventListener("pointercancel", up);
  view.canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const [px, py] = evToPx(view, e);
      const g = Math.exp(e.deltaY * 0.0015); // wheel up -> zoom in (about cursor)
      const p0 = pixToPlane(view, px, py);
      view.half *= g;
      view.center.x += (p0.x - view.center.x) * (1 - g);
      view.center.y += (p0.y - view.center.y) * (1 - g);
      drawView();
    },
    { passive: false },
  );
}

// --- View 2: move / resize the tile rectangle (plus pan/zoom) --------------

function rectDown(px, py) {
  const dpr = window.devicePixelRatio || 1;
  if (refChk.checked) {
    const [rx, ry] = planeToPix(views.v2, refPt);
    if (Math.hypot(rx - px, ry - py) < 12 * dpr) {
      return { mode: "refpt", last: pixToPlane(views.v2, px, py) };
    }
  }
  const edges = [
    { id: "L", x: rect.cx - rect.w / 2, y: rect.cy },
    { id: "R", x: rect.cx + rect.w / 2, y: rect.cy },
    { id: "T", x: rect.cx, y: rect.cy + rect.h / 2 },
    { id: "B", x: rect.cx, y: rect.cy - rect.h / 2 },
  ];
  let mode = null;
  edges.forEach((e) => {
    const [cx, cy] = planeToPix(views.v2, e);
    if (Math.hypot(cx - px, cy - py) < 12 * dpr) mode = e.id;
  });
  const here = pixToPlane(views.v2, px, py);
  if (
    mode === null &&
    Math.abs(here.x - rect.cx) < rect.w / 2 &&
    Math.abs(here.y - rect.cy) < rect.h / 2
  ) {
    mode = "move";
  }
  return mode === null ? null : { mode, last: here };
}
function rectMove(drag, px, py) {
  const here = pixToPlane(views.v2, px, py);
  if (drag.mode === "refpt") {
    refPt.x += here.x - drag.last.x;
    refPt.y += here.y - drag.last.y;
    drag.last = here;
    return;
  }
  if (drag.mode === "move") {
    rect.cx += here.x - drag.last.x;
    rect.cy += here.y - drag.last.y;
  } else if (drag.mode === "L") {
    const right = rect.cx + rect.w / 2;
    rect.w = Math.max(right - here.x, 0.05);
    rect.cx = right - rect.w / 2;
  } else if (drag.mode === "R") {
    const left = rect.cx - rect.w / 2;
    rect.w = Math.max(here.x - left, 0.05);
    rect.cx = left + rect.w / 2;
  } else if (drag.mode === "T") {
    const bottom = rect.cy - rect.h / 2;
    rect.h = Math.max(here.y - bottom, 0.05);
    rect.cy = bottom + rect.h / 2;
  } else if (drag.mode === "B") {
    const top = rect.cy + rect.h / 2;
    rect.h = Math.max(top - here.y, 0.05);
    rect.cy = top - rect.h / 2;
  }
  drag.last = here;
}

// View 3: drag a line endpoint; on release it snaps to the nearest copy.
function refV3Down(px, py) {
  if (!refChk.checked) return null;
  const dpr = window.devicePixelRatio || 1;
  for (let i = 0; i < 2; i++) {
    const [ex, ey] = planeToPix(views.v3, logToV3(endLog(i)));
    if (Math.hypot(ex - px, ey - py) < 12 * dpr) return { i, free: endLog(i) };
  }
  return null;
}
function refV3Move(state, px, py) {
  state.free = v3ToLog(pixToPlane(views.v3, px, py));
  refDrag = state;
}
function refV3Up(state) {
  refEnds[state.i] = {
    m: Math.round((state.free.x - refPt.x) / rect.w),
    n: Math.round((state.free.y - refPt.y) / rect.h),
  };
  refDrag = null;
}

attachPanZoom(views.v2, { down: rectDown, move: rectMove });
attachPanZoom(views.v3, { down: refV3Down, move: refV3Move, up: refV3Up });
attachPanZoom(views.v4);

// --- File loading -----------------------------------------------------------

// Load the picked file into the given pipeline stage; reset the input so the
// same file can be re-picked.
function loadFromInput(input, stage) {
  const f = input.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(img.src);
    uploadImage(img, stage);
  };
  img.onerror = () => {
    URL.revokeObjectURL(img.src);
    alert("Could not load that file as an image.");
  };
  img.src = URL.createObjectURL(f);
  input.value = "";
}

// The main source picker (Upload File) always loads a fresh source (stage 1).
document
  .getElementById("file")
  .addEventListener("change", (e) => loadFromInput(e.target, 1));

// Per-view upload: a shared hidden input; uploadStage records the target view.
let uploadStage = 2;
const uploadFile = document.getElementById("uploadFile");
uploadFile.addEventListener("change", (e) =>
  loadFromInput(e.target, uploadStage),
);
function triggerUpload(stage) {
  uploadStage = stage;
  uploadFile.click();
}

// --- Export: pick the region in a popup, then save -------------------------

const modal = document.getElementById("exportModal");
// Preview navigation view and the export selection rectangle, both in plane
// coordinates. The rectangle is what gets written to the PNG. exportStage picks
// which view (2, 3 or 4) the modal previews and saves.
let exportStage = 4;
const exportView = {
  canvas: document.getElementById("exportCanvas"),
  stage: 4,
  center: { x: 0, y: 0 },
  half: 2.2,
};
const selRect = { cx: 0, cy: 0, hx: 1.6, hy: 1.6 };

// The current tile as seen in a given view's plane coordinates. View 2 is the
// log rectangle itself; in View 3 it is that rectangle mapped through the twist.
// Exporting exactly one tile is what makes the download → upload round-trip
// reproduce View 4 (its radial period is the rectangle width, not 2π).
function tileCellRegion(stage) {
  if (stage === 2) {
    return { cx: rect.cx, cy: rect.cy, hx: rect.w / 2, hy: rect.h / 2 };
  }
  const cs = rectCornersHalf(rect.cx, rect.cy, rect.w / 2, rect.h / 2).map(
    logToV3,
  );
  let lo = { x: Infinity, y: Infinity },
    hi = { x: -Infinity, y: -Infinity };
  for (const c of cs) {
    lo.x = Math.min(lo.x, c.x);
    hi.x = Math.max(hi.x, c.x);
    lo.y = Math.min(lo.y, c.y);
    hi.y = Math.max(hi.y, c.y);
  }
  return {
    cx: (lo.x + hi.x) / 2,
    cy: (lo.y + hi.y) / 2,
    hx: (hi.x - lo.x) / 2,
    hy: (hi.y - lo.y) / 2,
  };
}

function openExport(stage) {
  if (!haveImage) {
    alert("Load an image first.");
    return;
  }
  exportStage = stage;
  exportView.stage = stage;
  if (stage === 4) {
    exportView.center = { x: 0, y: 0 };
    exportView.half = 2.2;
    selRect.cx = 0;
    selRect.cy = 0;
    selRect.hx = 1.6;
    selRect.hy = 1.6;
  } else {
    // Views 2 & 3: default to one tile
    const cell = tileCellRegion(stage);
    selRect.cx = cell.cx;
    selRect.cy = cell.cy;
    selRect.hx = cell.hx;
    selRect.hy = cell.hy;
    exportView.center = { x: cell.cx, y: cell.cy };
    exportView.half = Math.max(cell.hx, cell.hy) * 1.6;
  }
  modal.hidden = false;
  requestAnimationFrame(renderExport); // wait for layout, then draw
}

function drawSelRect() {
  const ctx = exportView.canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const corners = rectCornersHalf(
    selRect.cx,
    selRect.cy,
    selRect.hx,
    selRect.hy,
  ).map((p) => planeToPix(exportView, p));
  // Dim everything outside the selection.
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.rect(0, 0, exportView.canvas.width, exportView.canvas.height);
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 3; i >= 0; i--) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath();
  ctx.fill("evenodd");

  ctx.beginPath();
  corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  cased(ctx, dpr);
  for (const [x, y] of corners) drawHandle(ctx, x, y, dpr);
}

function renderExport() {
  const dpr = window.devicePixelRatio || 1;
  const cv = exportView.canvas;
  const w = Math.max(1, Math.floor(cv.clientWidth * dpr));
  const h = Math.max(1, Math.floor(cv.clientHeight * dpr));
  cv.width = w;
  cv.height = h;
  drawStage(exportView, w, h);
  cv.getContext("2d").drawImage(glCanvas, 0, 0);
  drawSelRect();
}

function selDown(px, py) {
  const dpr = window.devicePixelRatio || 1;
  const corners = rectCornersHalf(
    selRect.cx,
    selRect.cy,
    selRect.hx,
    selRect.hy,
  );
  let mode = null;
  corners.forEach((cn, i) => {
    const [cx, cy] = planeToPix(exportView, cn);
    if (Math.hypot(cx - px, cy - py) < 12 * dpr) mode = i;
  });
  const here = pixToPlane(exportView, px, py);
  if (
    mode === null &&
    Math.abs(here.x - selRect.cx) < selRect.hx &&
    Math.abs(here.y - selRect.cy) < selRect.hy
  ) {
    mode = "move";
  }
  return mode === null ? null : { mode, last: here };
}
function selMove(drag, px, py) {
  const here = pixToPlane(exportView, px, py);
  if (drag.mode === "move") {
    selRect.cx += here.x - drag.last.x;
    selRect.cy += here.y - drag.last.y;
  } else {
    const opp = [2, 3, 0, 1][drag.mode];
    const fixed = {
      x: selRect.cx + (opp === 1 || opp === 2 ? 1 : -1) * selRect.hx,
      y: selRect.cy + (opp >= 2 ? 1 : -1) * selRect.hy,
    };
    selRect.hx = Math.max(Math.abs(here.x - fixed.x) / 2, 0.02);
    selRect.hy = Math.max(Math.abs(here.y - fixed.y) / 2, 0.02);
    selRect.cx = (here.x + fixed.x) / 2;
    selRect.cy = (here.y + fixed.y) / 2;
  }
  drag.last = here;
}
attachPanZoom(exportView, {
  down: selDown,
  move: selMove,
  render: renderExport,
});

// Per-view download (export) and upload buttons.
document
  .getElementById("chooseFile")
  .addEventListener("click", () => document.getElementById("file").click());
document.getElementById("save").addEventListener("click", () => openExport(4));
document.getElementById("dl2").addEventListener("click", () => openExport(2));
document.getElementById("dl3").addEventListener("click", () => openExport(3));
document
  .getElementById("ul2")
  .addEventListener("click", () => triggerUpload(2));
document
  .getElementById("ul3")
  .addEventListener("click", () => triggerUpload(3));
document.getElementById("exportCancel").addEventListener("click", () => {
  modal.hidden = true;
});
modal.addEventListener("pointerdown", (e) => {
  if (e.target === modal) modal.hidden = true;
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
});

document.getElementById("exportConfirm").addEventListener("click", () => {
  const size = parseInt(el.outSize.value, 10) || 2048;
  // Output dimensions follow the selection's aspect; long edge = size.
  let w = size,
    h = size;
  if (selRect.hx >= selRect.hy)
    h = Math.round((size * selRect.hy) / selRect.hx);
  else w = Math.round((size * selRect.hx) / selRect.hy);
  const region = {
    stage: exportStage,
    center: { x: selRect.cx, y: selRect.cy },
    half: selRect.hy,
  };
  // Remember this region so re-uploading the saved image to the same view (2/3)
  // maps it back to exactly the same plane rect. Rounding w and h makes the
  // rendered half-width hy·w/h, not hx — store that, or the round-trip drifts.
  if (exportStage === 2 || exportStage === 3) {
    lastRegion[exportStage] = {
      cx: selRect.cx,
      cy: selRect.cy,
      hx: (selRect.hy * w) / h,
      hy: selRect.hy,
    };
  }
  drawStage(region, w, h);
  glCanvas.toBlob((blob) => {
    if (!blob) {
      alert("Export failed — try a smaller size.");
      modal.hidden = true;
      render();
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "print-gallery.png";
    a.click();
    URL.revokeObjectURL(a.href);
    modal.hidden = true;
    render(); // restore the main views
  }, "image/png");
});

// --- Tutorial ----------------------------------------------------------------

// Guided walk-through using the bundled demo picture. tutorial.png contains a
// copy of itself (the framed print's house window shows the room again) with
// the recursion's fixed point exactly at the image centre and a nesting scale
// of ~1/16.6 — measured log-space period ln(16.6) ≈ 2.81.
const TUT_IMAGE = "tutorial.png";
const TUT_WIDTH = 2.81;

const TUT_STEPS = [
  {
    pos: "center",
    html: `<b>Welcome!</b> This tutorial recreates Escher's <i>Print Gallery</i>
      effect: a picture that spirals into a copy of itself. The picture we'll use
      in this tutorial showcases this effect: the framed print shows a house,
      and through the house's window you can see this very room again, about
      17× smaller.`,
  },
  {
    pos: "itr",
    targets: ["#c1"],
    html: `<b>1 · Source.</b> The crosshair pin marks the point all nested
      copies converge on. Zoom in on the pin (scroll) and watch the room
      repeat and get blurrier as you go: That's because picture has finite resolution,
      so each deeper copy is drawn with fewer pixels. In this picture the 
      convergence point happens to be exactly the image centre, and the pin is
      already at the right position. If you use your own picture you would 
      drag the pin onto the centre of the recursion.`,
  },
  {
    pos: "ibr",
    targets: ["#c2"],
    html: `<b>2 · Logarithm.</b> This is the logarithm of the picture, unrolled
      about the pin: circles around the pin become vertical lines, and zooming
      in becomes a step to the left. Because the picture contains itself, the
      log picture repeats horizontally, but since the resolution decreases as
      we zoom in, the log picture gets blurrier towards the left.`,
  },
  {
    pos: "ibr",
    targets: ["#c2", ".field:has(#rw)"],
    html: `<b>Fit the tile.</b> The blue rectangle selects one period of the
      repetition — and this is the whole point of the tool: Views 3 and 4 are
      rebuilt from this single tile, so every nesting level comes out as sharp
      as the copy you select, instead of blurring towards the centre. Keep the
      <b>Height</b> at one full turn, 2π ≈ 6.283, and set the <b>Width</b> to
      the repeat distance: drag the side handles (or scrub the Width field)
      until the content at the left edge lines up with the content at the right
      edge.`,
    auto() {
      const right = rect.cx + rect.w / 2;
      rect.w = TUT_WIDTH;
      rect.cx = right - rect.w / 2;
      render(TILE_VIEWS);
    },
  },
  {
    pos: "ibl",
    targets: ["#c3", ".checkbox:has(#wrapFill)", ".field:has(#blend)"],
    html: `<b>3 · Fully Tiled Plane.</b> The plane rebuilt from your tile: the
      picture now continues at every scale, each level as crisp as the tile
      itself. Dark voids appear where the source picture ends: tick
      <b>Wrap Fill</b> to fill them with the content one tile over (it's on by
      default outside the tutorial), and raise <b>Tile Blend</b> a little
      (≈ 0.05) to soften the remaining seams.`,
    auto() {
      wrapChk.checked = true;
      el.blend.value = 0.05;
      render(TWIST_VIEWS);
    },
  },
  {
    pos: "ibl",
    targets: ["#escher"],
    html: `<b>Escher it!</b> Now the twist: rotate and scale the tiled plane so
      that going once around the origin also steps exactly one tile — then the
      picture flows seamlessly into its own copy. You could try to achieve this 
      manually, but pressing <b>Escher it!</b> will do it for you!.`,
    auto() {
      document.getElementById("escher").click();
    },
  },
  {
    pos: "itl",
    targets: ["#c4"],
    html: `<b>4 · Result.</b> The Print Gallery effect. Follow the room once
      around the centre: you arrive inside the framed print, one nesting level
      deeper — with no seam. Zoom in and out; it repeats forever in both
      directions. (View 3 below it shows the same twisted tiling before the
      final exponential.)`,
  },
  {
    pos: "center",
    html: `<b>That's it!</b> You can now save your result with the download button.
      To go further: load your own picture — it needs no built-in copy,
      any tile gives a spiral; retouch seams by downloading View 2, editing it
      externally and uploading it back; or explore <b>Reference Point</b> mode
      to aim the twist at two specific copies.`,
  },
];

const tutEls = {
  panel: document.getElementById("tutPanel"),
  step: document.getElementById("tutStep"),
  text: document.getElementById("tutText"),
  next: document.getElementById("tutNext"),
  auto: document.getElementById("tutAuto"),
  exit: document.getElementById("tutExit"),
};
let tutIndex = -1;
let tutGlow = [];

function tutClearGlow() {
  for (const g of tutGlow) g.classList.remove("tut-glow");
  tutGlow = [];
}

function tutShow(i) {
  tutIndex = i;
  const s = TUT_STEPS[i];
  tutClearGlow();
  for (const sel of s.targets || []) {
    const g = document.querySelector(sel);
    if (g) {
      g.classList.add("tut-glow");
      tutGlow.push(g);
    }
  }
  // Dim every pane/bar that doesn't contain a highlighted element, so the
  // step's spot is the bright one (steps without targets dim everything).
  for (const sec of document.querySelectorAll("#grid .pane, #grid .bar")) {
    sec.classList.toggle("tut-dimmed", !tutGlow.some((g) => sec.contains(g)));
  }
  tutEls.step.textContent = `Step ${i + 1} of ${TUT_STEPS.length}`;
  tutEls.text.innerHTML = s.html;
  tutEls.auto.hidden = !s.auto;
  tutEls.next.textContent = i === TUT_STEPS.length - 1 ? "Finish" : "Next";
  tutEls.panel.className = "tut-" + (s.pos || "center");
  tutEls.panel.hidden = false;
}

function tutEnd() {
  tutClearGlow();
  for (const sec of document.querySelectorAll(".tut-dimmed"))
    sec.classList.remove("tut-dimmed");
  tutIndex = -1;
  tutEls.panel.hidden = true;
}

tutEls.exit.addEventListener("click", tutEnd);
tutEls.next.addEventListener("click", () => {
  if (tutIndex >= TUT_STEPS.length - 1) tutEnd();
  else tutShow(tutIndex + 1);
});
tutEls.auto.addEventListener("click", () => {
  const s = TUT_STEPS[tutIndex];
  if (s && s.auto) s.auto();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.hidden && tutIndex >= 0) tutEnd();
});

document.getElementById("tutorial").addEventListener("click", () => {
  const img = new Image();
  img.onload = () => {
    // A clean slate, so every step starts from the state it describes.
    el.theta.value = 0;
    el.scale.value = 1;
    el.tx.value = 0;
    el.ty.value = 0;
    el.blend.value = 0;
    refChk.checked = false;
    wrapChk.checked = false;
    rect.cx = -0.5;
    rect.cy = 0;
    rect.w = 1.2;
    rect.h = 2 * Math.PI;
    refPt.x = -0.5;
    refPt.y = 0;
    refEnds[0] = { m: 0, n: 0 };
    refEnds[1] = { m: 1, n: 1 };
    views.v2.center = { x: -0.5, y: 0 };
    views.v2.half = Math.PI;
    views.v3.center = { x: -0.5, y: 0 };
    views.v3.half = Math.PI;
    views.v4.center = { x: 0, y: 0 };
    views.v4.half = 1.8;
    lastRegion[2] = lastRegion[3] = null;
    uploadImage(img, 1); // resets View 1 + origin pin, and renders
    tutShow(0);
  };
  img.onerror = () =>
    alert(
      `Could not load the tutorial image (${TUT_IMAGE}). ` +
        `Serve the app folder over HTTP (e.g. python3 -m http.server) and reload.`,
    );
  img.src = TUT_IMAGE;
});

// --- Boot with a generated placeholder -------------------------------------

(function placeholder() {
  const SIZE = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const x = c.getContext("2d");

  // 8x8 orange/blue checkerboard with a half-scale copy of the whole image
  // nested recursively, scaling toward a fixed point inside the upper-right
  // quarter (not the corner) so the Droste centre sits within the image.
  const px = SIZE * 0.625,
    py = SIZE * 0.375; // recursion fixed point
  function droste(cx, cy, size) {
    const n = 8,
      s = size / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        x.fillStyle = (i + j) % 2 ? "#2b6cb0" : "#f6ad55";
        x.fillRect(cx + i * s, cy + j * s, s + 1, s + 1);
      }
    if (size > 8) droste(px + 0.5 * (cx - px), py + 0.5 * (cy - py), size / 2);
  }
  droste(0, 0, SIZE);

  x.fillStyle = "#fff";
  x.font = "bold 56px sans-serif";
  x.textAlign = "center";
  x.fillText("load an image", SIZE / 2, SIZE * 0.92);

  const img = new Image();
  img.onload = () => uploadImage(img);
  img.src = c.toDataURL();
})();
