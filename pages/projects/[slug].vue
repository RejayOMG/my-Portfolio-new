<script setup lang="ts">
import { gsap, ScrollTrigger } from '~/utils/gsap'
import { audio } from '~/utils/audio'

const route = useRoute()
const app = useAppStore()
const content = useContentStore()
const experienceStore = useExperienceStore()

const slug = computed(() => String(route.params.slug))
const project = computed(() => content.bySlug(slug.value))

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'project not found', fatal: true })
}

const siblings = computed(() => content.siblings(slug.value))

useHead(() => ({
  title: `${project.value?.title ?? 'project'} — motion designer portfolio`,
  meta: [{ name: 'description', content: project.value?.shortDescription ?? '' }],
}))

const rootRef = ref<HTMLElement | null>(null)
const heroRef = ref<HTMLElement | null>(null)
const muxRef = ref<InstanceType<typeof import('~/components/MuxVideo.vue').default> | null>(null)
const soundOn = ref(false)

let triggers: ScrollTrigger[] = []

onMounted(() => {
  // hero fades in over the focused webgl plane, then the gallery resets
  if (heroRef.value) {
    gsap.fromTo(
      heroRef.value,
      { opacity: app.transitioning ? 0 : 1 },
      {
        opacity: 1,
        duration: 0.5,
        ease: 'power1.out',
        onComplete: () => {
          experienceStore.instance?.world.gallery.afterFocus()
          app.transitioning = false
        },
      },
    )
  } else {
    experienceStore.instance?.world.gallery.afterFocus()
    app.transitioning = false
  }

  if (app.reducedMotion || !rootRef.value) return

  // styleframes: scroll parallax + clip reveal
  rootRef.value.querySelectorAll<HTMLElement>('.frame').forEach((el, i) => {
    const img = el.querySelector('img, .frame__fallback')
    const reveal = gsap.fromTo(
      el,
      { clipPath: 'inset(12% 6% 12% 6%)', opacity: 0.4 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity: 1,
        duration: 1.2,
        ease: 'expoOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    )
    if (reveal.scrollTrigger) triggers.push(reveal.scrollTrigger)

    if (img) {
      const parallax = gsap.fromTo(
        img,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
      if (parallax.scrollTrigger) triggers.push(parallax.scrollTrigger)
    }
  })
})

onBeforeUnmount(() => {
  triggers.forEach((t) => t.kill())
  triggers = []
})

function toggleHeroSound() {
  const video = muxRef.value?.videoRef as HTMLVideoElement | null | undefined
  if (!video) return
  soundOn.value = !soundOn.value
  video.muted = !soundOn.value
  audio.play('click')
}

function navSound() {
  audio.play('click')
}
</script>

<template>
  <main v-if="project" ref="rootRef" class="project">
    <!-- hero -->
    <header ref="heroRef" class="project__hero">
      <button
        class="project__hero-media"
        :aria-label="soundOn ? 'mute video' : 'unmute video'"
        @click="toggleHeroSound"
      >
        <MuxVideo
          ref="muxRef"
          :playback-id="project.muxPlaybackId"
          :autoplay="true"
          :muted="true"
          :loop="true"
        />
        <span class="project__hero-soundtag t-xs">{{ soundOn ? 'sound on' : 'sound off' }}</span>
      </button>
    </header>

    <!-- info -->
    <section class="project__info grid">
      <h1 class="project__title t-xl">{{ project.title }}</h1>

      <dl class="project__meta">
        <div>
          <dt class="t-xs t-dim">year</dt>
          <dd class="t-m">{{ project.year }}</dd>
        </div>
        <div v-if="project.client">
          <dt class="t-xs t-dim">client</dt>
          <dd class="t-m">{{ project.client }}</dd>
        </div>
      </dl>

      <div class="project__desc">
        <p class="t-m">{{ project.shortDescription }}</p>
        <a
          v-if="project.behanceUrl"
          :href="project.behanceUrl"
          target="_blank"
          rel="noopener"
          class="project__behance t-s"
          @mouseenter="!app.isTouch && audio.play('hover')"
          @click="audio.play('click')"
        >
          view on behance ↗
        </a>
      </div>
    </section>

    <!-- styleframes -->
    <section v-if="project.styleframes.length || !project.thumbnail" class="project__frames container">
      <template v-if="project.styleframes.length">
        <figure v-for="(frame, i) in project.styleframes" :key="i" class="frame">
          <img :src="frame" :alt="`${project.title} styleframe ${i + 1}`" loading="lazy" />
        </figure>
      </template>
      <template v-else>
        <!-- procedural placeholders when no cms assets exist -->
        <figure v-for="i in 3" :key="i" class="frame">
          <div
            class="frame__fallback"
            :style="{
              background: `linear-gradient(${120 + i * 40}deg, ${project.colorA}, ${project.colorB})`,
            }"
          />
        </figure>
      </template>
    </section>

    <!-- prev / next -->
    <nav class="project__nav container" aria-label="project navigation">
      <NuxtLink
        v-if="siblings.prev"
        :to="`/projects/${siblings.prev.slug}`"
        class="project__nav-link"
        @mouseenter="!app.isTouch && audio.play('hover')"
        @click="navSound"
      >
        <span class="t-xs t-dim">← previous</span>
        <span class="t-l">{{ siblings.prev.title }}</span>
      </NuxtLink>
      <NuxtLink
        v-if="siblings.next"
        :to="`/projects/${siblings.next.slug}`"
        class="project__nav-link project__nav-link--next"
        @mouseenter="!app.isTouch && audio.play('hover')"
        @click="navSound"
      >
        <span class="t-xs t-dim">next →</span>
        <span class="t-l">{{ siblings.next.title }}</span>
      </NuxtLink>
    </nav>

    <div class="project__back container">
      <NuxtLink to="/" class="link-underline t-s" @click="navSound">← all works</NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.project {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxl);
  padding-bottom: var(--gap-xl);
  background: var(--color-bg);
}

/* ------------------------------------------------------------------ hero */
.project__hero {
  height: calc(var(--ivh) * 100);
}

.project__hero-media {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.project__hero-media :deep(.mux-video) {
  width: 100%;
  height: 100%;
}

.project__hero-soundtag {
  position: absolute;
  bottom: var(--gap-m);
  left: var(--grid-margin);
  padding: 0.5em 1em;
  color: var(--color-bg);
  background: var(--color-accent);
  border-radius: 2em;
}

/* ------------------------------------------------------------------ info */
.project__info {
  row-gap: var(--gap-l);
}

.project__title {
  grid-column: 1 / -1;
}

.project__meta {
  grid-column: 1 / span 3;
  display: flex;
  flex-direction: column;
  gap: var(--gap-s);
}

.project__desc {
  grid-column: 5 / span 7;
  display: flex;
  flex-direction: column;
  gap: var(--gap-m);
}

.project__behance {
  width: fit-content;
  padding: 0.8em 1.6em;
  border: 1px solid var(--color-text-dim);
  border-radius: 3em;
  transition:
    border-color 0.4s var(--ease-expo-out),
    color 0.4s var(--ease-expo-out),
    transform 0.5s var(--ease-spring);
}

.project__behance:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  transform: translateY(-0.3rem);
}

/* ---------------------------------------------------------------- frames */
.project__frames {
  display: flex;
  flex-direction: column;
  gap: var(--gap-l);
}

.frame {
  overflow: hidden;
  border-radius: 0.6rem;
  aspect-ratio: 16 / 9;
  background: var(--color-panel);
}

.frame img,
.frame__fallback {
  width: 100%;
  height: 114%;
  object-fit: cover;
  will-change: transform;
}

/* ------------------------------------------------------------------- nav */
.project__nav {
  display: flex;
  justify-content: space-between;
  gap: var(--gap-m);
  padding-top: var(--gap-l);
  border-top: 1px solid rgba(250, 250, 250, 0.1);
}

.project__nav-link {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: color 0.4s var(--ease-expo-out);
}

.project__nav-link:hover {
  color: var(--color-accent);
}

.project__nav-link--next {
  text-align: right;
  margin-left: auto;
}

@media (max-width: 767px) {
  .project__meta {
    grid-column: 1 / -1;
    flex-direction: row;
    gap: var(--gap-l);
  }

  .project__desc {
    grid-column: 1 / -1;
  }
}
</style>
