import { defineStore } from 'pinia'
import type { Project, SiteSettings } from '~/types/content'
import { fallbackProjects, fallbackSettings } from '~/data/fallback'
import { fetchProjects, fetchSettings } from '~/lib/sanity'

export const useContentStore = defineStore('content', {
  state: () => ({
    projects: fallbackProjects as Project[],
    settings: fallbackSettings as SiteSettings,
    loaded: false,
  }),

  getters: {
    bySlug: (state) => (slug: string) =>
      state.projects.find((p) => p.slug === slug),

    siblings: (state) => (slug: string) => {
      const idx = state.projects.findIndex((p) => p.slug === slug)
      if (idx === -1) return { prev: null, next: null }
      const len = state.projects.length
      return {
        prev: state.projects[(idx - 1 + len) % len] ?? null,
        next: state.projects[(idx + 1) % len] ?? null,
      }
    },
  },

  actions: {
    async load() {
      if (this.loaded) return
      const [projects, settings] = await Promise.all([
        fetchProjects(),
        fetchSettings(),
      ])
      this.projects = projects
      this.settings = settings
      this.loaded = true
    },
  },
})
