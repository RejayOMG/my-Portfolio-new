import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type Experience from '~/webgl/Experience'

/** holds the (non-reactive) webgl experience singleton */
export const useExperienceStore = defineStore('experience', {
  state: () => ({
    instance: null as Experience | null,
  }),

  actions: {
    set(experience: Experience) {
      this.instance = markRaw(experience)
    },
    clear() {
      this.instance = null
    },
  },
})
