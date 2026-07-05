import { createClient, type SanityClient } from '@sanity/client'
import type { Project, SiteSettings } from '~/types/content'
import { fallbackProjects, fallbackSettings } from '~/data/fallback'

let client: SanityClient | null = null

function getClient(): SanityClient | null {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig().public
  if (!sanityProjectId) return null
  if (!client) {
    client = createClient({
      projectId: sanityProjectId as string,
      dataset: (sanityDataset as string) || 'production',
      apiVersion: '2025-05-01',
      useCdn: true,
    })
  }
  return client
}

const PROJECTS_QUERY = /* groq */ `
*[_type == "project"] | order(year desc, title asc) {
  _id,
  title,
  "slug": slug.current,
  year,
  shortDescription,
  client,
  behanceUrl,
  "thumbnail": thumbnail.asset->url + "?w=1280&fm=webp&q=80",
  "styleframes": styleframes[].asset->url,
  "muxPlaybackId": video.asset->playbackId
}`

const SETTINGS_QUERY = /* groq */ `
*[_type == "siteSettings"][0] {
  title,
  email,
  socialLinks[]{ label, url },
  "showreelPlaybackId": showreel.asset->playbackId
}`

const palette: Array<[string, string]> = [
  ['#21ffc0', '#0a3d2c'],
  ['#ff8a3d', '#3d1c0a'],
  ['#7aa0ff', '#0a163d'],
  ['#ff5aa5', '#3d0a22'],
]

export async function fetchProjects(): Promise<Project[]> {
  const sanity = getClient()
  if (!sanity) return fallbackProjects
  try {
    const rows = await sanity.fetch<any[]>(PROJECTS_QUERY)
    if (!rows?.length) return fallbackProjects
    return rows.map((row, i) => ({
      _id: row._id,
      title: row.title ?? 'untitled',
      slug: row.slug ?? row._id,
      year: row.year ?? new Date().getFullYear(),
      shortDescription: row.shortDescription ?? '',
      client: row.client ?? undefined,
      behanceUrl: row.behanceUrl ?? undefined,
      thumbnail: row.thumbnail ?? '',
      styleframes: (row.styleframes ?? []).map((u: string) => `${u}?w=1600&fm=webp&q=80`),
      muxPlaybackId: row.muxPlaybackId ?? '',
      colorA: palette[i % palette.length][0],
      colorB: palette[i % palette.length][1],
    }))
  } catch (err) {
    console.error('[sanity] projects fetch failed, using fallback', err)
    return fallbackProjects
  }
}

export async function fetchSettings(): Promise<SiteSettings> {
  const sanity = getClient()
  if (!sanity) return fallbackSettings
  try {
    const row = await sanity.fetch<any>(SETTINGS_QUERY)
    if (!row) return fallbackSettings
    return {
      title: row.title ?? fallbackSettings.title,
      email: row.email ?? fallbackSettings.email,
      socialLinks: row.socialLinks ?? fallbackSettings.socialLinks,
      showreelPlaybackId: row.showreelPlaybackId ?? '',
    }
  } catch (err) {
    console.error('[sanity] settings fetch failed, using fallback', err)
    return fallbackSettings
  }
}
