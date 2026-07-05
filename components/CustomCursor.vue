<script setup lang="ts">
import { gsap } from '~/utils/gsap'

const app = useAppStore()
const cursorRef = ref<HTMLElement | null>(null)

let quickX: ((v: number) => void) | null = null
let quickY: ((v: number) => void) | null = null

function onMove(e: PointerEvent) {
  quickX?.(e.clientX)
  quickY?.(e.clientY)
}

onMounted(() => {
  if (app.isTouch || !cursorRef.value) return
  quickX = gsap.quickTo(cursorRef.value, 'x', { duration: 0.35, ease: 'power3.out' })
  quickY = gsap.quickTo(cursorRef.value, 'y', { duration: 0.35, ease: 'power3.out' })
  window.addEventListener('pointermove', onMove, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('pointermove', onMove))
</script>

<template>
  <div
    v-if="!app.isTouch"
    ref="cursorRef"
    class="custom-cursor"
    :class="{ 'is-active': app.cursorLabel }"
    aria-hidden="true"
  >
    <span class="custom-cursor__label t-xs">{{ app.cursorLabel }}</span>
  </div>
</template>

<style scoped>
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 90;
  pointer-events: none;
  transform: translate(-100px, -100px);
}

.custom-cursor__label {
  display: grid;
  place-items: center;
  min-width: 5.6rem;
  min-height: 5.6rem;
  margin: 1.4rem 0 0 1.4rem;
  padding: 0.4em;
  border-radius: 50%;
  color: var(--color-bg);
  background: var(--color-accent);
  transform: scale(0);
  transition: transform 0.55s var(--ease-spring);
}

.custom-cursor.is-active .custom-cursor__label {
  transform: scale(1);
}
</style>
