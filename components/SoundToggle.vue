<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()

function toggle() {
  const next = !app.muted
  app.setMuted(next)
  audio.setMuted(next)
  if (!next) {
    // enabling sound implies the user wants audio even if they entered silent
    app.soundEnabled = true
    audio.setEnabled(true)
    audio.play('switch')
  }
}
</script>

<template>
  <button
    class="sound-toggle"
    :class="{ 'is-muted': app.muted }"
    :aria-pressed="!app.muted"
    aria-label="toggle sound"
    @mouseenter="!app.isTouch && audio.play('hover')"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" />
      <g v-if="!app.muted" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M15 9.2a4 4 0 0 1 0 5.6" />
        <path d="M17.5 7a7.2 7.2 0 0 1 0 10" />
      </g>
      <g v-else stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.sound-toggle {
  position: fixed;
  bottom: var(--gap-m);
  right: var(--grid-margin);
  z-index: 50;
  display: grid;
  place-items: center;
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 50%;
  color: var(--color-bg);
  background: var(--color-text);
  transition: transform 0.5s var(--ease-spring), opacity 0.3s var(--ease-expo-out);
}

.sound-toggle:hover {
  transform: scale(1.1);
}

.sound-toggle.is-muted {
  opacity: 0.55;
}

.sound-toggle svg {
  width: 2.2rem;
  height: 2.2rem;
}
</style>
