<script setup lang="ts">
import type { AnimationItem } from 'lottie-web'
import { audio } from '~/utils/audio'

const app = useAppStore()
const smileyRef = ref<HTMLElement | null>(null)

let anim: AnimationItem | null = null

async function playSmiley() {
  if (!smileyRef.value) return
  // random sound (1-4) + random lottie face (1-5)
  audio.playSmiley()
  const face = 1 + Math.floor(Math.random() * 5)

  const { default: lottie } = await import('lottie-web')
  anim?.destroy()
  anim = lottie.loadAnimation({
    container: smileyRef.value,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    path: `/lottie/smiley${face}.json`,
  })
  anim.addEventListener('complete', () => {
    anim?.destroy()
    anim = null
  })
}

function onEnter() {
  if (!app.isTouch) audio.play('hover')
}

onBeforeUnmount(() => anim?.destroy())
</script>

<template>
  <div class="logo">
    <button
      class="logo__btn"
      aria-label="logo — click me"
      @mouseenter="onEnter"
      @click="playSmiley"
    >
      <span class="logo__ball" />
      <span class="logo__tag t-xs" aria-hidden="true">click me :)</span>
    </button>
    <div ref="smileyRef" class="logo__smiley" aria-hidden="true" />
  </div>
</template>

<style scoped>
.logo {
  position: fixed;
  top: var(--gap-m);
  left: var(--grid-margin);
  z-index: 50;
}

.logo__btn {
  position: relative;
  display: block;
  transition: transform 0.6s var(--ease-spring);
}

.logo__btn:hover {
  transform: scale(1.1) rotate(-8deg);
}

.logo__ball {
  position: relative;
  display: block;
  width: 5.2rem;
  height: 5.2rem;
  background: url('/img/smiley.png') center / contain no-repeat;
}

.logo__tag {
  position: absolute;
  left: 115%;
  top: 50%;
  padding: 0.5em 0.9em;
  white-space: nowrap;
  color: var(--color-bg);
  background: var(--color-accent);
  border-radius: 2em;
  transform-origin: left center;
  transform: translateY(-50%) rotate(-5deg) scale(0);
  transition: transform 0.7s var(--ease-spring);
  pointer-events: none;
}

.logo__btn:hover .logo__tag {
  transform: translateY(-50%) rotate(-5deg) scale(1);
}

.logo__smiley {
  position: absolute;
  top: 110%;
  left: 0;
  width: 8rem;
  height: 8rem;
  pointer-events: none;
}
</style>
