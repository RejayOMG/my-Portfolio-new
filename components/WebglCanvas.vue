<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()
const content = useContentStore()
const experienceStore = useExperienceStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  if (!app.webglSupported || !canvasRef.value) {
    app.resourcesReady = true
    return
  }

  const { default: Experience } = await import('~/webgl/Experience')

  const experience = Experience.init(canvasRef.value, {
    reducedMotion: app.reducedMotion,
    isTouch: app.isTouch,
  })
  experienceStore.set(experience)

  const gallery = experience.world.gallery
  gallery.setProjects(content.projects)

  // wire gallery events into the ui / sound layer
  gallery.onHover = (plane) => {
    app.cursorLabel = plane ? 'view' : ''
    if (plane) audio.play('hover', 120)
  }
  gallery.onTick = () => audio.play('tick', 90)

  app.resourcesReady = true
})

// keep gallery content in sync if cms data arrives late
watch(
  () => content.projects,
  (projects) => {
    experienceStore.instance?.world.gallery.setProjects(projects)
  },
)

onBeforeUnmount(() => {
  // app-level component — only unmounts on full teardown
  experienceStore.instance?.destroy()
  experienceStore.clear()
})
</script>

<template>
  <canvas v-if="app.webglSupported" ref="canvasRef" class="webgl-canvas" aria-hidden="true" />
</template>
