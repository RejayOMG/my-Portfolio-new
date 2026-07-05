<script setup lang="ts">
import { gsap } from '~/utils/gsap'
import { audio } from '~/utils/audio'
import type { Project } from '~/types/content'

const app = useAppStore()
const content = useContentStore()

const visible = computed(() => app.introDone && app.effectiveViewMode === 'list')

const thumbRef = ref<HTMLElement | null>(null)
const hoveredProject = ref<Project | null>(null)

let quickX: ((v: number) => void) | null = null
let quickY: ((v: number) => void) | null = null

function onMove(e: PointerEvent) {
  quickX?.(e.clientX)
  quickY?.(e.clientY)
}

onMounted(() => {
  if (app.isTouch || !thumbRef.value) return
  quickX = gsap.quickTo(thumbRef.value, 'x', { duration: 0.5, ease: 'power3.out' })
  quickY = gsap.quickTo(thumbRef.value, 'y', { duration: 0.5, ease: 'power3.out' })
  window.addEventListener('pointermove', onMove, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('pointermove', onMove))

function onRowEnter(project: Project) {
  if (app.isTouch) return
  hoveredProject.value = project
  audio.play('hover', 100)
}

function onRowLeave() {
  hoveredProject.value = null
}

function onRowClick() {
  audio.play('click')
}
</script>

<template>
  <section
    class="project-list"
    :class="{ 'is-visible': visible }"
    :aria-hidden="!visible"
    aria-label="projects"
  >
    <ol class="project-list__rows">
      <li
        v-for="(project, i) in content.projects"
        :key="project._id"
        class="project-list__row-wrap"
        :style="{ '--d': `${(i % 4) * 0.07 + Math.floor(i / 4) * 0.03}s` }"
      >
        <NuxtLink
          :to="`/projects/${project.slug}`"
          class="project-list__row"
          :tabindex="visible ? 0 : -1"
          @mouseenter="onRowEnter(project)"
          @mouseleave="onRowLeave"
          @click="onRowClick"
        >
          <span class="project-list__index t-xs t-dim">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="project-list__title t-l">{{ project.title }}</span>
          <span class="project-list__year t-s t-dim">{{ project.year }}</span>
        </NuxtLink>
      </li>
    </ol>

    <!-- floating hover thumbnail -->
    <div
      ref="thumbRef"
      class="project-list__thumb"
      :class="{ 'is-active': hoveredProject && visible }"
      aria-hidden="true"
    >
      <img
        v-if="hoveredProject?.thumbnail"
        :src="hoveredProject.thumbnail"
        :alt="''"
        loading="lazy"
      />
      <div
        v-else
        class="project-list__thumb-fallback"
        :style="{
          background: hoveredProject
            ? `linear-gradient(160deg, ${hoveredProject.colorA}, ${hoveredProject.colorB})`
            : 'none',
        }"
      />
    </div>
  </section>
</template>

<style scoped>
.project-list {
  position: relative;
  z-index: 5;
  padding: calc(var(--gap-xxl) + 6rem) var(--grid-margin) var(--gap-xxl);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s var(--ease-expo-out);
}

.project-list.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.project-list__row-wrap {
  overflow: hidden;
  border-bottom: 1px solid rgba(250, 250, 250, 0.1);
}

.project-list__row-wrap:first-child {
  border-top: 1px solid rgba(250, 250, 250, 0.1);
}

.project-list__row {
  display: grid;
  grid-template-columns: 6rem 1fr auto;
  align-items: baseline;
  gap: var(--grid-gutter);
  padding: var(--gap-s) 0;
  transform: translateY(110%);
  transition:
    transform 0.9s var(--ease-expo-out) var(--d),
    color 0.4s var(--ease-expo-out),
    padding-left 0.5s var(--ease-expo-out);
}

.project-list.is-visible .project-list__row {
  transform: translateY(0);
}

.project-list__row:hover {
  color: var(--color-accent);
  padding-left: 1.5rem;
}

.project-list__title {
  transition: inherit;
}

.project-list__thumb {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 6;
  width: 32rem;
  aspect-ratio: 16 / 9;
  margin: -9rem 0 0 3rem;
  overflow: hidden;
  border-radius: 0.6rem;
  pointer-events: none;
  opacity: 0;
  transform-origin: center;
  transition: opacity 0.35s var(--ease-expo-out);
}

.project-list__thumb.is-active {
  opacity: 1;
}

.project-list__thumb img,
.project-list__thumb-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 767px) {
  .project-list__row {
    grid-template-columns: 4rem 1fr auto;
  }

  .project-list__thumb {
    display: none;
  }
}
</style>
