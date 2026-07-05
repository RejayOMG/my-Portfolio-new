<script setup lang="ts">
// animated film-grain overlay, adapted from the react-bits <Noise /> component.
// renders a fixed, full-viewport canvas of random monochrome grain that sits
// above the webgl scene but below the ui. purely decorative — pointer-events
// are disabled and it is hidden from assistive tech.

const props = withDefaults(
  defineProps<{
    patternSize?: number
    patternScaleX?: number
    patternScaleY?: number
    patternRefreshInterval?: number
    patternAlpha?: number
  }>(),
  {
    patternSize: 250,
    patternScaleX: 1,
    patternScaleY: 1,
    patternRefreshInterval: 2,
    patternAlpha: 15,
  },
)

const app = useAppStore()
const grainRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const canvas = grainRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const canvasSize = 1024
  let frame = 0
  let animationId = 0

  const resize = () => {
    canvas.width = canvasSize
    canvas.height = canvasSize
  }

  const drawGrain = () => {
    const imageData = ctx.createImageData(canvasSize, canvasSize)
    const data = imageData.data
    const alpha = props.patternAlpha

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = alpha
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const loop = () => {
    if (frame % props.patternRefreshInterval === 0) {
      drawGrain()
    }
    frame++
    animationId = window.requestAnimationFrame(loop)
  }

  window.addEventListener('resize', resize)
  resize()

  if (app.reducedMotion) {
    // no animation — a single static grain field
    drawGrain()
  } else {
    loop()
  }

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    if (animationId) window.cancelAnimationFrame(animationId)
  })
})
</script>

<template>
  <canvas ref="grainRef" class="noise-overlay" aria-hidden="true" />
</template>

<style scoped>
.noise-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: calc(var(--ivh) * 100);
  z-index: 1;
  pointer-events: none;
  image-rendering: pixelated;
}
</style>
