// Generates minimal Lottie JSON files: loader + 5 smiley variants.
// Run: node scripts/gen-lottie.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public', 'lottie')
mkdirSync(OUT, { recursive: true })

const ACCENT = [0.129, 1, 0.753, 1] // #21ffc0
const FG = [0.98, 0.98, 0.98, 1] // #fafafa

const ease = (t, s, i = [0.4, 1], o = [0.6, 0]) => ({
  i: { x: [i[0]], y: [i[1]] },
  o: { x: [o[0]], y: [o[1]] },
  t,
  s,
})

const transform = (extra = {}) => ({
  ty: 'tr',
  p: { a: 0, k: [0, 0] },
  a: { a: 0, k: [0, 0] },
  s: { a: 0, k: [100, 100] },
  r: { a: 0, k: 0 },
  o: { a: 0, k: 100 },
  ...extra,
})

const stroke = (color, width) => ({
  ty: 'st',
  c: { a: 0, k: color },
  o: { a: 0, k: 100 },
  w: { a: 0, k: width },
  lc: 2,
  lj: 2,
})

const fill = (color) => ({ ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 } })

const layer = (name, shapes, ks = {}, op = 60) => ({
  ddd: 0,
  ind: 1,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [100, 100, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
    ...ks,
  },
  ao: 0,
  shapes,
  ip: 0,
  op,
  st: 0,
  bm: 0,
})

const doc = (name, layers, op = 60) => ({
  v: '5.9.6',
  fr: 60,
  ip: 0,
  op,
  w: 200,
  h: 200,
  nm: name,
  ddd: 0,
  assets: [],
  layers: layers.map((l, i) => ({ ...l, ind: i + 1 })),
})

// ---------------------------------------------------------------- loader ---
// rotating trimmed circle stroke
const loader = doc(
  'loader',
  [
    layer(
      'arc',
      [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [88, 88] } },
            {
              ty: 'tm',
              s: {
                a: 1,
                k: [ease(0, [0]), ease(30, [0]), { t: 60, s: [90] }],
              },
              e: {
                a: 1,
                k: [ease(0, [10]), ease(30, [100]), { t: 60, s: [100] }],
              },
              o: { a: 0, k: 0 },
              m: 1,
            },
            stroke(ACCENT, 6),
            transform(),
          ],
        },
      ],
      {
        r: {
          a: 1,
          k: [
            { i: { x: [0.999], y: [1] }, o: { x: [0.001], y: [0] }, t: 0, s: [0] },
            { t: 60, s: [360] },
          ],
        },
      }
    ),
  ],
  60
)
writeFileSync(join(OUT, 'loader.json'), JSON.stringify(loader))

// --------------------------------------------------------------- smileys ---
// pop-in face: circle + eyes + mouth path, with overshoot scale
const popScale = {
  a: 1,
  k: [
    ease(0, [0, 0, 100], [0.2, 1], [0.4, 0]),
    ease(14, [118, 118, 100]),
    ease(22, [94, 94, 100]),
    { t: 30, s: [100, 100, 100] },
  ],
}

// mouth path builders (vertices in face space, face radius 45)
const path = (v, i, o, closed = false) => ({
  ty: 'sh',
  ks: { a: 0, k: { i, o, v, c: closed } },
})

const mouths = {
  grin: path(
    [
      [-22, 8],
      [0, 26],
      [22, 8],
    ],
    [
      [0, 0],
      [-12, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [12, 0],
      [0, 0],
    ]
  ),
  flat: path(
    [
      [-18, 16],
      [18, 16],
    ],
    [
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
    ]
  ),
  wow: {
    ty: 'el',
    p: { a: 0, k: [0, 16] },
    s: { a: 0, k: [16, 20] },
  },
  smirk: path(
    [
      [-16, 14],
      [4, 22],
      [20, 10],
    ],
    [
      [0, 0],
      [-8, 2],
      [0, 6],
    ],
    [
      [0, 0],
      [8, -2],
      [0, 0],
    ]
  ),
  sad: path(
    [
      [-20, 22],
      [0, 8],
      [20, 22],
    ],
    [
      [0, 0],
      [-11, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [11, 0],
      [0, 0],
    ]
  ),
}

const eye = (x, tall = false) => ({
  ty: 'gr',
  it: [
    { ty: 'el', p: { a: 0, k: [x, -12] }, s: { a: 0, k: tall ? [7, 13] : [8, 8] } },
    fill(FG),
    transform(),
  ],
})

const smileyVariants = [
  { mouth: mouths.grin, color: ACCENT, eyes: [eye(-15), eye(15)], rot: 0 },
  { mouth: mouths.wow, color: [1, 0.72, 0.2, 1], eyes: [eye(-15, true), eye(15, true)], rot: -8 },
  { mouth: mouths.smirk, color: [1, 0.35, 0.65, 1], eyes: [eye(-15), eye(15)], rot: 6 },
  { mouth: mouths.flat, color: [0.45, 0.62, 1, 1], eyes: [eye(-15), eye(15)], rot: 0 },
  { mouth: mouths.sad, color: [0.85, 0.4, 1, 1], eyes: [eye(-15), eye(15)], rot: 4 },
]

smileyVariants.forEach((v, idx) => {
  const face = {
    ty: 'gr',
    it: [
      { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [90, 90] } },
      stroke(v.color, 6),
      transform(),
    ],
  }
  const mouth = {
    ty: 'gr',
    it: [v.mouth, stroke(FG, 5), transform()],
  }
  const smiley = doc(
    `smiley${idx + 1}`,
    [
      layer('face', [face, ...v.eyes, mouth], {
        s: popScale,
        r: {
          a: 1,
          k: [ease(0, [v.rot - 14]), ease(18, [v.rot + 4]), { t: 30, s: [v.rot] }],
        },
      }, 90),
    ],
    90
  )
  writeFileSync(join(OUT, `smiley${idx + 1}.json`), JSON.stringify(smiley))
})

console.log('lottie files written to', OUT)
