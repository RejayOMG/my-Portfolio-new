export interface Project {
  _id: string
  title: string
  slug: string
  year: number
  shortDescription: string
  client?: string
  behanceUrl?: string
  /** resolved CDN url of the thumbnail (or empty — plane renders procedural fallback) */
  thumbnail: string
  /** resolved CDN urls */
  styleframes: string[]
  /** mux playback id — empty falls back to demo stream */
  muxPlaybackId: string
  /** procedural fallback colors used when no thumbnail texture exists */
  colorA: string
  colorB: string
}

export interface SocialLink {
  label: string
  url: string
}

export interface SiteSettings {
  title: string
  email: string
  socialLinks: SocialLink[]
  showreelPlaybackId: string
}
