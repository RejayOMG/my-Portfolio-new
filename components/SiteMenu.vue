<script setup lang="ts">
import { gsap, SplitText } from '~/utils/gsap'
import { audio } from '~/utils/audio'

const app = useAppStore()
const content = useContentStore()

const overlayRef = ref<HTMLElement | null>(null)
const rendered = ref(false)

let splits: SplitText[] = []

async function open() {
  audio.play('click')
  app.menuOpen = true
  rendered.value = true
  await nextTick()

  const overlay = overlayRef.value
  if (!overlay) return

  gsap.fromTo(
    overlay,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expoOut' },
  )

  if (!app.reducedMotion) {
    splits.forEach((s) => s.revert())
    splits = []
    overlay.querySelectorAll<HTMLElement>('[data-split]').forEach((el, i) => {
      const split = new SplitText(el, { type: 'lines,chars', linesClass: 'split-line' })
      splits.push(split)
      gsap.fromTo(
        split.chars,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          delay: 0.15 + i * 0.07,
          stagger: 0.02,
          ease: 'expoOut',
        },
      )
    })
  }
}

function close(playSound = true) {
  if (playSound) audio.play('close')
  const overlay = overlayRef.value
  if (!overlay) {
    app.menuOpen = false
    rendered.value = false
    return
  }
  gsap.to(overlay, {
    clipPath: 'inset(0% 0% 100% 0%)',
    duration: 0.7,
    ease: 'expo.inOut',
    onComplete: () => {
      app.menuOpen = false
      rendered.value = false
      splits.forEach((s) => s.revert())
      splits = []
    },
  })
}

function toggle() {
  app.menuOpen ? close() : open()
}

function onLinkHover(sound: 'menu-home' | 'menu-about') {
  if (!app.isTouch) audio.play(sound, 150)
}

function navigate() {
  audio.play('click')
  close(false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && app.menuOpen) close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <button
      class="menu-btn t-s"
      :aria-expanded="app.menuOpen"
      aria-label="toggle menu"
      @mouseenter="!app.isTouch && audio.play('hover')"
      @click="toggle"
    >
      <span class="menu-btn__label">{{ app.menuOpen ? 'close' : 'menu' }}</span>
      <span class="menu-btn__dot" aria-hidden="true" />
    </button>

    <div v-if="rendered" ref="overlayRef" class="menu" role="navigation">
      <nav class="menu__nav">
        <NuxtLink
          to="/"
          class="menu__link t-xl"
          data-split
          @mouseenter="onLinkHover('menu-home')"
          @click="navigate"
          >works</NuxtLink
        >
        <NuxtLink
          to="/about"
          class="menu__link t-xl"
          data-split
          @mouseenter="onLinkHover('menu-about')"
          @click="navigate"
          >about</NuxtLink
        >
        <a
          :href="`mailto:${content.settings.email}`"
          class="menu__link t-xl"
          data-split
          @mouseenter="onLinkHover('menu-home')"
          @click="audio.play('click')"
          >contact</a
        >
      </nav>

      <div class="menu__footer">
        <a
          :href="`mailto:${content.settings.email}`"
          class="link-underline t-s"
          data-split
          @click="audio.play('click')"
          >{{ content.settings.email }}</a
        >
        <div class="menu__socials">
          <a
            v-for="social in content.settings.socialLinks"
            :key="social.label"
            :href="social.url"
            target="_blank"
            rel="noopener"
            class="link-underline t-xs t-dim"
            @mouseenter="!app.isTouch && audio.play('hover')"
            >{{ social.label }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-btn {
  position: fixed;
  top: var(--gap-m);
  right: var(--grid-margin);
  z-index: 60;
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.2rem 2.4rem;
  font-size: 1.7rem;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: 4rem;
  transition: transform 0.5s var(--ease-spring), background-color 0.4s var(--ease-expo-out);
}

.menu-btn:hover {
  transform: scale(1.06);
  background: #fff;
}

.menu-btn__label {
  letter-spacing: 0.02em;
  transition: letter-spacing 0.6s var(--ease-expo-out);
}

.menu-btn:hover .menu-btn__label {
  letter-spacing: 0.18em;
}

.menu-btn__dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: currentColor;
}

.menu {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--gap-xl);
  padding: var(--gap-xxl) var(--grid-margin) var(--gap-l);
  background: color-mix(in srgb, var(--color-panel) 96%, transparent);
  backdrop-filter: blur(12px);
  clip-path: inset(0% 0% 100% 0%);
}

.menu__nav {
  display: flex;
  flex-direction: column;
  gap: var(--gap-s);
}

.menu__link {
  width: fit-content;
  color: var(--color-text);
  transition: color 0.4s var(--ease-expo-out), transform 0.6s var(--ease-expo-out);
}

.menu__link:hover {
  color: var(--color-accent);
  transform: translateX(1rem);
}

.menu__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap-s);
}

.menu__socials {
  display: flex;
  gap: var(--gap-m);
}

:deep(.split-line) {
  overflow: hidden;
}
</style>
