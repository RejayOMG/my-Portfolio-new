<script setup lang="ts">
import { audio } from '~/utils/audio'
import type { ViewMode } from '~/stores/app'

const app = useAppStore()
const experienceStore = useExperienceStore()

function setMode(mode: ViewMode) {
  if (app.viewMode === mode || app.transitioning) return
  audio.play('switch')
  audio.play(mode === 'spiral' ? 'spiral' : 'list')
  app.setViewMode(mode)
  experienceStore.instance?.world.gallery.setMode(mode)
}
</script>

<template>
  <div v-if="app.webglSupported" class="view-switch t-s" role="group" aria-label="gallery view mode">
    <button
      class="view-switch__btn"
      :class="{ 'is-active': app.viewMode === 'spiral' }"
      @mouseenter="!app.isTouch && audio.play('hover')"
      @click="setMode('spiral')"
    >
      spiral
    </button>
    <span class="view-switch__dot" aria-hidden="true" />
    <button
      class="view-switch__btn"
      :class="{ 'is-active': app.viewMode === 'list' }"
      @mouseenter="!app.isTouch && audio.play('hover')"
      @click="setMode('list')"
    >
      list
    </button>
  </div>
</template>

<style scoped>
.view-switch {
  position: fixed;
  top: var(--gap-m);
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 1.4rem;
  font-size: 1.7rem;
}

.view-switch__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-text);
  opacity: 0.9;
}

.view-switch__btn {
  color: var(--color-text-dim);
  transition: color 0.4s var(--ease-expo-out);
}

.view-switch__btn:hover {
  color: var(--color-text);
}

.view-switch__btn.is-active {
  color: var(--color-text);
}
</style>
