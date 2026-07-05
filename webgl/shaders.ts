/** shared glsl chunks */
export const bayerChunk = /* glsl */ `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`

/* ------------------------------------------------------------ project plane */
export const planeVertex = /* glsl */ `
uniform float uScrollSpeed;
uniform float uBend;
uniform float uTime;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // elastic distortion driven by scroll velocity — grows with speed.
  // NOTE: geometry is a unit plane scaled by mesh.scale (px), so x/y offsets
  // live in unit space (fraction of plane size); z scale stays 1 (px space).
  float bend = sin(uv.y * 3.141592) * uScrollSpeed;
  pos.x += bend * 0.05;              // horizontal sway, ~5% of width at v=1
  pos.y += sin(uv.x * 3.141592) * uScrollSpeed * 0.022;
  // bulge always pushes OUTWARD (toward the camera) no matter the scroll
  // direction — reverse scrolling must not suck the card inward
  pos.z += abs(bend) * 34.0;

  // curvature hugging the gallery cylinder — pure bend along x (px)
  pos.z += sin(uv.x * 3.141592) * uBend;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const planeFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform float uHasTexture;
uniform sampler2D uTextTexture;
uniform float uHasText;
uniform vec2 uPlaneSizes;
uniform vec2 uImageSizes;
uniform float uRevealProgress;
uniform float uZoom;
uniform float uColorStrength;
uniform float uEdgeFade;
uniform float uCornerRadius;
uniform float uBlur;
uniform float uScrollSpeed;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;

${bayerChunk}

vec3 saturate3(vec3 color, float amount) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(luma), color, amount);
}

vec3 sampleColor(vec2 uv) {
  if (uHasTexture > 0.5) {
    return texture2D(uTexture, uv).rgb;
  }
  // procedural gradient fallback (no thumbnail asset)
  float g = uv.y + sin(uv.x * 4.0 + uTime * 0.0004) * 0.12;
  vec3 color = mix(uColorB, uColorA, smoothstep(0.05, 1.1, g));
  float vign = smoothstep(1.15, 0.35, distance(uv, vec2(0.5)));
  return color * (0.35 + vign * 0.75);
}

void main() {
  // background-cover uv mapping
  float rs = uPlaneSizes.x / uPlaneSizes.y;
  float ri = max(uImageSizes.x, 1.0) / max(uImageSizes.y, 1.0);
  vec2 st = rs < ri
    ? vec2(uImageSizes.x * uPlaneSizes.y / uImageSizes.y, uPlaneSizes.y)
    : vec2(uPlaneSizes.x, uImageSizes.y * uPlaneSizes.x / uImageSizes.x);
  vec2 offset = (rs < ri
    ? vec2((st.x - uPlaneSizes.x) / 2.0, 0.0)
    : vec2(0.0, (st.y - uPlaneSizes.y) / 2.0)) / st;
  vec2 uv = vUv * uPlaneSizes / st + offset;

  // hover micro-zoom around center
  float zoom = 1.0 + uZoom * 0.12;
  uv = (uv - 0.5) / zoom + 0.5;

  // depth-of-field defocus + vertical motion smear.
  // taps ride a dithered golden spiral inside an ellipse elongated along y.
  vec2 rad = vec2(
    uBlur * 0.034,
    uBlur * 0.105 + abs(uScrollSpeed) * (0.02 + uBlur * 0.06)
  );
  vec3 color;
  if (max(rad.x, rad.y) < 0.0008) {
    color = sampleColor(uv);
  } else {
    float rot = bayer4(gl_FragCoord.xy) * 6.2831;
    color = vec3(0.0);
    for (int i = 0; i < 9; i++) {
      float t = float(i) / 9.0;
      float ang = t * 19.416 + rot;
      vec2 off = vec2(cos(ang), sin(ang)) * sqrt(t) * rad;
      color += sampleColor(uv + off);
    }
    color /= 9.0;
  }

  // hover saturation lift
  color = saturate3(color, 1.0 + uColorStrength * 0.5);
  color *= 1.0 + uColorStrength * 0.08;

  // card backside — dimmed and washed out, like unlit cardboard
  if (!gl_FrontFacing) {
    color = saturate3(color, 0.55) * 0.32;
  }

  // typographic overlay (per-card randomized canvas texture) — melts away
  // as the card falls out of focus
  if (uHasText > 0.5) {
    vec4 label = texture2D(uTextTexture, vUv);
    color = mix(color, label.rgb, label.a * (1.0 - uBlur * 0.85));
  }

  // rounded-rect mask (sdf in plane pixel space)
  vec2 p = (vUv - 0.5) * uPlaneSizes;
  vec2 halfSize = 0.5 * uPlaneSizes - vec2(uCornerRadius);
  vec2 q = abs(p) - halfSize;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCornerRadius;
  float rounded = 1.0 - smoothstep(-1.5, 0.5, sdf);

  // dithered dissolve reveal
  float d = bayer8(gl_FragCoord.xy * 0.75);
  float reveal = step(d, uRevealProgress * 1.02);

  float alpha = reveal * uEdgeFade * rounded;
  if (alpha < 0.001) discard;

  gl_FragColor = vec4(color, alpha);
}
`

/* ------------------------------------------------------- fullscreen dither */
export const postVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

export const postFragment = /* glsl */ `
uniform sampler2D tScene;
uniform float uTime;

varying vec2 vUv;

${bayerChunk}

void main() {
  vec3 color = texture2D(tScene, vUv).rgb;

  // ordered bayer dithering — quantize to limited levels for grain
  float levels = 28.0;
  float d = bayer8(gl_FragCoord.xy + vec2(mod(uTime * 0.06, 64.0)));
  color = floor(color * levels + d) / levels;

  gl_FragColor = vec4(color, 1.0);
}
`

/* -------------------------------------------------------------- background */
export const bgVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const bgFragment = /* glsl */ `
uniform float uTime;
uniform float uCell;
uniform vec2 uRes;       // canvas size in device px
uniform float uOverscan; // bg plane is uOverscan× larger than the viewport
varying vec2 vUv;

// cheap value noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  float t = uTime * 0.00005;
  float n = noise(vUv * 3.0 + t * 8.0) * 0.6 + noise(vUv * 9.0 - t * 5.0) * 0.4;
  // very dark drifting field between bg and panel tones
  vec3 a = vec3(0.039); // #0a0a0a
  vec3 b = vec3(0.090); // #171717
  vec3 color = mix(a, b, smoothstep(0.25, 0.95, n) * 0.8);

  // ---- faint, gently breathing grid --------------------------------
  // no lens distortion: a plain regular grid in stable viewport pixels.
  // viewport-normalized coords where [-1,1] spans the visible frame.
  vec2 pv = (vUv * 2.0 - 1.0) * uOverscan;
  vec2 screen = (pv * 0.5 + 0.5) * uRes;
  vec2 g = abs(fract(screen / uCell) - 0.5);
  float line = smoothstep(0.47, 0.5, max(g.x, g.y));
  // slow drifting field makes the grid fade in and out — barely there
  float fade = 0.3 + 0.7 * noise(vUv * 2.2 + vec2(t * 3.0, -t * 2.0));
  color += line * 0.016 * fade;

  gl_FragColor = vec4(color, 1.0);
}
`
