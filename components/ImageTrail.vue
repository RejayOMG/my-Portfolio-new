<script setup lang="ts">
/**
 * image trail — vue port of the react bits <ImageTrail /> component
 * (javascript + css flavor, variant 1).
 *
 * adaptation: pointer events are listened on `window` instead of the
 * container so the overlay can stay `pointer-events: none` and links
 * underneath remain clickable. positions are still computed relative
 * to the container rect, so the behavior is identical.
 */
import { gsap } from '~/utils/gsap'
import { audio } from '~/utils/audio'

const props = withDefaults(defineProps<{ items?: string[] }>(), {
  items: () => [],
})

const app = useAppStore()
const containerRef = ref<HTMLElement | null>(null)

interface Point {
  x: number
  y: number
}

function lerp(a: number, b: number, n: number) {
  return (1 - n) * a + n * b
}

function getLocalPointerPos(e: MouseEvent | TouchEvent, rect: DOMRect): Point {
  let clientX = 0
  let clientY = 0
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('clientX' in e) {
    clientX = e.clientX
    clientY = e.clientY
  }
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function getMouseDistance(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

class ImageItem {
  el: HTMLElement
  inner: HTMLElement | null
  rect: DOMRect
  private resize: () => void

  constructor(el: HTMLElement) {
    this.el = el
    this.inner = el.querySelector('.trail__img-inner')
    this.rect = el.getBoundingClientRect()
    this.resize = () => {
      gsap.set(this.el, { scale: 1, x: 0, y: 0, opacity: 0 })
      this.rect = this.el.getBoundingClientRect()
    }
    window.addEventListener('resize', this.resize)
  }

  destroy() {
    window.removeEventListener('resize', this.resize)
    gsap.killTweensOf(this.el)
  }
}

/** variant 1: images follow the pointer, then fade + shrink away */
class ImageTrailEffect {
  private container: HTMLElement
  private images: ImageItem[]
  private imagesTotal: number
  private imgPosition = 0
  private zIndexVal = 1
  private activeImagesCount = 0
  private isIdle = true
  private threshold = 53 // distance gate between spawns — lower = denser trail

  private mousePos: Point = { x: 0, y: 0 }
  private lastMousePos: Point = { x: 0, y: 0 }
  private cacheMousePos: Point = { x: 0, y: 0 }

  private rafId = 0
  private started = false
  private onMove: (e: MouseEvent | TouchEvent) => void
  private urls: string[]
  private lastUrlIndex = -1

  constructor(container: HTMLElement, urls: string[]) {
    this.container = container
    this.urls = urls
    this.images = [...container.querySelectorAll<HTMLElement>('.trail__img')].map(
      (el) => new ImageItem(el),
    )
    this.imagesTotal = this.images.length

    this.onMove = (ev) => {
      const rect = this.container.getBoundingClientRect()
      this.mousePos = getLocalPointerPos(ev, rect)
      if (!this.started) {
        this.started = true
        this.cacheMousePos = { ...this.mousePos }
        this.lastMousePos = { ...this.mousePos }
        this.rafId = requestAnimationFrame(() => this.render())
      }
    }
    window.addEventListener('mousemove', this.onMove, { passive: true })
    window.addEventListener('touchmove', this.onMove, { passive: true })
  }

  private render() {
    const distance = getMouseDistance(this.mousePos, this.lastMousePos)
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1)
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1)

    if (distance > this.threshold) {
      this.showNextImage()
      this.lastMousePos = { ...this.mousePos }
    }
    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1
    }
    this.rafId = requestAnimationFrame(() => this.render())
  }

  private showNextImage() {
    if (!this.imagesTotal) return
    ++this.zIndexVal
    // cycle nodes sequentially (FIFO) so cards always die in the order they
    // appeared — even when a fast drag recycles a node, it is the oldest one.
    this.imgPosition = (this.imgPosition + 1) % this.imagesTotal
    const img = this.images[this.imgPosition]

    // random artwork per spawn (never the same one twice in a row),
    // decoupled from node order so images stay random while nodes stay FIFO
    if (img.inner && this.urls.length > 1) {
      let next = Math.floor(Math.random() * this.urls.length)
      if (next === this.lastUrlIndex) next = (next + 1) % this.urls.length
      this.lastUrlIndex = next
      img.inner.style.backgroundImage = `url(${this.urls[next]})`
    }

    // mechanical ratchet tick, slight pitch drift so it feels like a real knob
    audio.play('tick', 60, gsap.utils.random(0.92, 1.1))

    gsap.killTweensOf(img.el)
    // silky lifecycle: soft pop-in + decelerating glide with momentum,
    // then a long overlapping fade — no hard phase cuts
    const dx = this.mousePos.x - this.cacheMousePos.x
    const dy = this.mousePos.y - this.cacheMousePos.y
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated(),
      })
      .set(img.el, { zIndex: this.zIndexVal }, 0)
      // glide from the smoothed pointer position past the cursor, easing out
      .fromTo(
        img.el,
        {
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2,
        },
        {
          duration: 0.9,
          ease: 'expo.out',
          x: this.mousePos.x - img.rect.width / 2 + dx * 0.35,
          y: this.mousePos.y - img.rect.height / 2 + dy * 0.35,
        },
        0,
      )
      // scale-up entrance: the card grows in as it appears
      .fromTo(
        img.el,
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' },
        0,
      )
      // plain exit: simultaneous fade + shrink, no bounce
      .to(
        img.el,
        {
          duration: 0.5,
          ease: 'power2.in',
          opacity: 0,
          scale: 0.3,
        },
        0.55,
      )
  }

  private onImageActivated() {
    this.activeImagesCount++
    this.isIdle = false
  }

  private onImageDeactivated() {
    this.activeImagesCount--
    if (this.activeImagesCount === 0) {
      this.isIdle = true
    }
  }

  destroy() {
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('mousemove', this.onMove)
    window.removeEventListener('touchmove', this.onMove)
    this.images.forEach((img) => img.destroy())
    this.images = []
  }
}

let effect: ImageTrailEffect | null = null

onMounted(() => {
  if (app.reducedMotion || !props.items.length || !containerRef.value) return
  effect = new ImageTrailEffect(containerRef.value, [...new Set(props.items)])
})

onBeforeUnmount(() => {
  effect?.destroy()
  effect = null
})
</script>

<template>
  <div ref="containerRef" class="trail" aria-hidden="true">
    <div v-for="(url, i) in props.items" :key="i" class="trail__img">
      <div class="trail__img-inner" :style="{ backgroundImage: `url(${url})` }" />
    </div>
  </div>
</template>

<style scoped>
.trail {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;
}

.trail__img {
  width: 146px;
  aspect-ratio: 1;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  will-change: transform, opacity;
}

.trail__img-inner {
  background-position: 50% 50%;
  background-size: contain;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

@media (max-width: 767px) {
  .trail__img {
    width: 100px;
  }
}
</style>
