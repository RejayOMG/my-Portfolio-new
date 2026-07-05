<script setup lang="ts">
import { FALLBACK_STREAM } from '~/data/fallback'

const props = withDefaults(
  defineProps<{
    playbackId?: string
    autoplay?: boolean
    muted?: boolean
    loop?: boolean
    controls?: boolean
  }>(),
  { playbackId: '', autoplay: true, muted: true, loop: true, controls: false },
)

const videoRef = ref<HTMLVideoElement | null>(null)
let hls: import('hls.js').default | null = null

const src = computed(() =>
  props.playbackId ? `https://stream.mux.com/${props.playbackId}.m3u8` : FALLBACK_STREAM,
)

const poster = computed(() =>
  props.playbackId
    ? `https://image.mux.com/${props.playbackId}/thumbnail.webp?width=1280&time=1`
    : undefined,
)

async function attach() {
  const video = videoRef.value
  if (!video) return

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src.value
  } else {
    const { default: Hls } = await import('hls.js')
    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 20 })
      hls.loadSource(src.value)
      hls.attachMedia(video)
    }
  }

  if (props.autoplay) {
    video.play().catch(() => {})
  }
}

onMounted(attach)

watch(src, () => {
  hls?.destroy()
  hls = null
  attach()
})

onBeforeUnmount(() => {
  hls?.destroy()
  hls = null
})

defineExpose({ videoRef })
</script>

<template>
  <video
    ref="videoRef"
    class="mux-video"
    :muted="muted"
    :loop="loop"
    :controls="controls"
    :poster="poster"
    playsinline
    preload="metadata"
    crossorigin="anonymous"
  />
</template>

<style scoped>
.mux-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--color-panel);
}
</style>
