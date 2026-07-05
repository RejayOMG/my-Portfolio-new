import { defineStore } from 'pinia'

export type ViewMode = 'spiral' | 'list'

export const useAppStore = defineStore('app', {
  state: () => ({
    // intro gate
    introDone: false,
    resourcesReady: false,

    // audio
    soundEnabled: false, // user entered with sound
    muted: false, // global mute toggle (persisted)

    // gallery view mode
    viewMode: 'spiral' as ViewMode,

    // ui
    menuOpen: false,
    videoModalOpen: false,
    cursorLabel: '' as string,
    transitioning: false,

    // environment capabilities
    webglSupported: true,
    reducedMotion: false,
    isTouch: false,
  }),

  getters: {
    /** effective gallery mode — no webgl forces the DOM list */
    effectiveViewMode(state): ViewMode {
      return state.webglSupported ? state.viewMode : 'list'
    },
    audible(state): boolean {
      return state.soundEnabled && !state.muted
    },
  },

  actions: {
    setViewMode(mode: ViewMode) {
      if (this.viewMode === mode) return
      this.viewMode = mode
    },

    toggleViewMode() {
      this.setViewMode(this.viewMode === 'spiral' ? 'list' : 'spiral')
    },

    setMuted(muted: boolean) {
      this.muted = muted
      if (import.meta.client) {
        try {
          localStorage.setItem('portfolio:muted', muted ? '1' : '0')
        } catch {}
      }
    },

    hydratePreferences() {
      if (!import.meta.client) return
      try {
        this.muted = localStorage.getItem('portfolio:muted') === '1'
      } catch {}
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      this.isTouch = window.matchMedia('(pointer: coarse)').matches
      this.webglSupported = detectWebGL()
      if (this.isTouch || !window.matchMedia('(pointer: fine)').matches) {
        document.documentElement.classList.add('no-fine-pointer')
      }
    },
  },
})

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}
