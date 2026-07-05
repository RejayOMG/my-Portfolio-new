<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()
const experienceStore = useExperienceStore()
const router = useRouter()

useHead({ title: 'works — motion designer portfolio' })

const gallery = () => experienceStore.instance?.world.gallery ?? null

/** reveal the gallery in the current view mode */
function show() {
  const g = gallery()
  if (!g) return
  g.mode = app.viewMode
  if (app.effectiveViewMode === 'spiral') {
    g.reveal()
  }
}

onMounted(() => {
  app.transitioning = false
  if (app.introDone) show()
})

// first entry: reveal once the intro gate is dismissed
watch(
  () => app.introDone,
  (done) => done && show(),
)

// gallery may be created after this page mounts (async webgl init)
watch(
  () => experienceStore.instance,
  (instance) => {
    if (instance && app.introDone) show()
  },
)

/* --------------------------- click layer: spiral plane -> project detail */
let pointerDown = { x: 0, y: 0, t: 0 }

function onHitDown(e: PointerEvent) {
  pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() }
}

async function onHitUp(e: PointerEvent) {
  // ignore drags (spiral rotation gesture)
  const dx = e.clientX - pointerDown.x
  const dy = e.clientY - pointerDown.y
  if (Math.hypot(dx, dy) > 8 || performance.now() - pointerDown.t > 400) return

  const g = gallery()
  if (!g || g.focusing || app.effectiveViewMode !== 'spiral' || !app.introDone) return

  const plane = app.isTouch ? g.raycastAt(e.clientX, e.clientY) : g.hovered
  if (!plane) return

  app.transitioning = true
  app.cursorLabel = ''
  audio.play('longclick')

  // shared-element transition: plane grows to cover the viewport
  await g.focusPlane(plane)
  await router.push(`/projects/${plane.project.slug}`)
}

onBeforeUnmount(() => {
  const g = gallery()
  if (!g) return
  if (app.transitioning) return // focus transition owns the teardown
  g.hideStaggered()
})
</script>

<template>
  <main class="home">
    <h1 class="visually-hidden">motion designer — selected works</h1>

    <!-- webgl hit layer (spiral mode) -->
    <div
      class="home__hit"
      :class="{ 'is-active': app.introDone && app.effectiveViewMode === 'spiral' }"
      aria-hidden="true"
      @pointerdown="onHitDown"
      @pointerup="onHitUp"
    />

    <ViewSwitch />

    <!-- dom list view (also the crawlable markup) -->
    <ProjectListView />
  </main>
</template>

<style scoped>
.home {
  min-height: calc(var(--ivh) * 100);
}

.home__hit {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.home__hit.is-active {
  pointer-events: auto;
}
</style>
