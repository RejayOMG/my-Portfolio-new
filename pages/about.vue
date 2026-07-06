<script setup lang="ts">
import { gsap, ScrollTrigger, SplitText } from '~/utils/gsap'
import { audio } from '~/utils/audio'

const app = useAppStore()
const content = useContentStore()
const experienceStore = useExperienceStore()

useHead({ title: 'about — motion designer portfolio' })

const rootRef = ref<HTMLElement | null>(null)

// image trail overlay (react bits port, variant 1) — sticker artwork
// 36 nodes (12 unique stickers, repeated) so more cards can be on screen at once
const trailImages = Array.from({ length: 36 }, (_, i) => `/img/trail/stickers-${(i % 12) + 1}.webp`)
let splits: SplitText[] = []
let triggers: ScrollTrigger[] = []

onMounted(() => {
  // keep the dithered webgl atmosphere, hide the project planes
  experienceStore.instance?.world.gallery.hideInstant()

  if (app.reducedMotion || !rootRef.value) return

  rootRef.value.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const split = new SplitText(el, { type: 'lines', linesClass: 'reveal-line' })
    splits.push(split)
    const tween = gsap.from(split.lines, {
      yPercent: 110,
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: 'expoOut',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    })
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
  })
})

onBeforeUnmount(() => {
  triggers.forEach((t) => t.kill())
  splits.forEach((s) => s.revert())
  triggers = []
  splits = []
})
</script>

<template>
  <main ref="rootRef" class="about container">
    <ClientOnly>
      <ImageTrail class="about__trail" :items="trailImages" />
    </ClientOnly>

    <header class="about__intro">
      <p class="about__lead t-xl" data-reveal>
        i'm a motion designer &amp; 3d artist crafting playful, tactile worlds for brands,
        broadcast and the web — blending simulation, hand-drawn frames and code.
      </p>
      <p class="about__sub t-m t-dim" data-reveal>
        available for freelance direction, animation and real-time work worldwide.
      </p>
    </header>

    <section class="about__grid grid">
      <div class="about__col about__col--projects">
        <h2 class="t-xs t-dim">selected works</h2>
        <ul>
          <li v-for="project in content.projects" :key="project._id">
            <NuxtLink
              :to="`/projects/${project.slug}`"
              class="link-underline t-m"
              @mouseenter="!app.isTouch && audio.play('hover')"
              @click="audio.play('click')"
            >
              {{ project.title }}
            </NuxtLink>
            <span class="t-xs t-dim">&nbsp;{{ project.year }}</span>
          </li>
        </ul>
      </div>

      <div class="about__col about__col--contact">
        <h2 class="t-xs t-dim">say hi</h2>
        <a
          :href="`mailto:${content.settings.email}`"
          class="link-underline t-m t-accent"
          @click="audio.play('click')"
          >{{ content.settings.email }}</a
        >

        <h2 class="t-xs t-dim about__socials-title">elsewhere</h2>
        <ul class="about__socials">
          <li v-for="social in content.settings.socialLinks" :key="social.label">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener"
              class="link-underline t-m"
              @mouseenter="!app.isTouch && audio.play('hover')"
              @click="audio.play('click')"
              >{{ social.label }}</a
            >
          </li>
        </ul>
      </div>
    </section>

    <footer class="about__credits t-xs t-dim">
      <span>design @studiothing</span>
      <span>development @codething</span>
      <span>© {{ new Date().getFullYear() }} — all rights reserved</span>
    </footer>
  </main>
</template>

<style scoped>
.about {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxxl);
  padding-top: var(--gap-xxl);
  padding-bottom: var(--gap-l);
  min-height: calc(var(--ivh) * 100);
}

.about__intro {
  display: flex;
  flex-direction: column;
  gap: var(--gap-m);
  max-width: 82%;
}

.about__lead {
  line-height: 1.12;
}

.about__grid {
  padding-inline: 0;
  row-gap: var(--gap-l);
}

.about__col {
  display: flex;
  flex-direction: column;
  gap: var(--gap-s);
}

.about__col--projects {
  grid-column: 1 / span 6;
}

.about__col--contact {
  grid-column: 8 / span 5;
}

.about__col ul {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.about__socials-title {
  margin-top: var(--gap-m);
}

.about__credits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-m);
  padding-top: var(--gap-l);
  border-top: 1px solid rgba(250, 250, 250, 0.1);
}

:deep(.reveal-line) {
  display: block;
  overflow: hidden;
}

@media (max-width: 767px) {
.about__trail {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  overflow: hidden;
}

.about__intro {
    max-width: 100%;
  }

  .about__col--projects,
  .about__col--contact {
    grid-column: 1 / -1;
  }
}
</style>
