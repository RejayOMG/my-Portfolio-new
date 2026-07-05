<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()

function close() {
  audio.play('close')
  app.videoModalOpen = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && app.videoModalOpen) close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const content = useContentStore()
</script>

<template>
  <Transition name="fade">
    <div v-if="app.videoModalOpen" class="video-modal" role="dialog" aria-label="showreel">
      <button class="video-modal__close t-s" aria-label="close showreel" @click="close">
        close ✕
      </button>
      <div class="video-modal__frame">
        <MuxVideo
          :playback-id="content.settings.showreelPlaybackId"
          :muted="!app.audible"
          :autoplay="true"
          :loop="false"
          :controls="true"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.video-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: rgba(10, 10, 10, 0.96);
}

.video-modal__frame {
  width: min(92vw, 160rem);
  aspect-ratio: 16 / 9;
}

.video-modal__frame :deep(.mux-video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
}

.video-modal__close {
  position: absolute;
  top: var(--gap-s);
  right: var(--grid-margin);
  z-index: 2;
  color: var(--color-text);
  transition: color 0.3s var(--ease-expo-out);
}

.video-modal__close:hover {
  color: var(--color-accent);
}
</style>
