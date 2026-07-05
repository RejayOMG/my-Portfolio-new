import type { Project, SiteSettings } from '~/types/content'

/**
 * local fallback content — used when no sanity project id is configured,
 * so the site builds and runs standalone. planes without thumbnails render
 * a procedural gradient in the shader (uHasTexture = 0).
 */

const palette: Array<[string, string]> = [
  ['#21ffc0', '#0a3d2c'],
  ['#ff8a3d', '#3d1c0a'],
  ['#7aa0ff', '#0a163d'],
  ['#ff5aa5', '#3d0a22'],
  ['#d96bff', '#250a3d'],
  ['#fff35a', '#3d360a'],
  ['#5affe2', '#0a3d38'],
  ['#ff6b6b', '#3d0a0a'],
  ['#9dff5a', '#1c3d0a'],
  ['#5a8bff', '#0a1230'],
  ['#ff9d5a', '#3d1e0a'],
  ['#c05aff', '#1e0a3d'],
]

const titles = [
  'chromatic drift',
  'soft machines',
  'neon botany',
  'gravity loop',
  'signal bloom',
  'paper storms',
  'liquid type',
  'afterglow',
  'kinetic mesh',
  'aurora field',
  'solar static',
  'velvet noise',
]

const clients = [
  'studio dumbar', 'nike', 'arte', 'spotify',
  'self-initiated', 'adult swim', 'mtv', 'wetransfer',
  'dropbox', 'figma',
  'vice', 'aiga',
]

export const fallbackProjects: Project[] = titles.map((title, i) => ({
  _id: `fallback-${i}`,
  title,
  slug: title.replace(/\s+/g, '-'),
  year: 2025 - (i % 4),
  client: clients[i],
  shortDescription:
    'a motion exploration blending 3d simulation, hand-drawn frames and generative type — directed and animated end to end.',
  behanceUrl: 'https://www.behance.net',
  thumbnail: '',
  styleframes: [],
  muxPlaybackId: '',
  colorA: palette[i][0],
  colorB: palette[i][1],
}))

export const fallbackSettings: SiteSettings = {
  title: 'motion designer — portfolio',
  email: 'hello@studio.tv',
  socialLinks: [
    { label: 'instagram', url: 'https://instagram.com' },
    { label: 'x', url: 'https://x.com' },
    { label: 'behance', url: 'https://behance.net' },
    { label: 'linkedin', url: 'https://linkedin.com' },
  ],
  showreelPlaybackId: '',
}

/** public demo hls stream used when no mux playback id is set */
export const FALLBACK_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
