<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()

const ringRef = ref<SVGSVGElement | null>(null)
const labelRef = ref<SVGTextElement | null>(null)
const textPathRef = ref<SVGTextPathElement | null>(null)

// the label is "showreel ✲ 2025 •" repeated `repeatCount` times. we measure the
// perimeter at runtime and stretch the whole label to exactly one perimeter, so
// the repeats tile the outline once with natural spacing. scrolling by one unit
// (perimeter / repeatCount) lands the pattern back on itself → seamless, endless.
const repeatCount = 3
const scrollTo = ref(0)

function openReel() {
  audio.play('longclick')
  app.videoModalOpen = true
}

onMounted(() => {
  const path = ringRef.value?.querySelector<SVGPathElement>('#showreel-rect')
  const label = labelRef.value
  const animate = ringRef.value?.querySelector('animate')

  if (app.reducedMotion) {
    animate?.remove()
    return
  }

  if (path && label) {
    const perimeter = path.getTotalLength()
    // stretch the whole label to exactly one perimeter so `repeatCount` units
    // tile the loop with near-natural spacing (chosen so the stretch stays ~1×).
    label.setAttribute('textLength', String(perimeter))
    label.setAttribute('lengthAdjust', 'spacing')
    // scroll one unit = perimeter / repeatCount → the pattern repeats identically.
    scrollTo.value = perimeter / repeatCount
    animate?.setAttribute('to', String(perimeter / repeatCount))
    ;(animate as any)?.beginElement?.()
  }
})
</script>

<template>
  <button
    class="showreel"
    aria-label="play showreel"
    @mouseenter="!app.isTouch && audio.play('hover')"
    @click="openReel"
  >
    <!-- tilted thumbnail card -->
    <span class="showreel__card" aria-hidden="true">
      <span class="showreel__card-inner" />
    </span>

    <!-- label travelling around the rounded-rectangle card outline -->
    <svg ref="ringRef" class="showreel__ring" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <!--
          rounded rectangle that hugs the card outline with an equal gap on all
          four sides. centred in the viewBox and tilted -14deg to match the card.
          the path length is measured at runtime; the label text is then stretched
          with textLength so its repeats tile the perimeter exactly (seamless loop).
        -->
        <path
          id="showreel-rect"
          d="M42,52 h116 a22,22 0 0 1 22,22 v52 a22,22 0 0 1 -22,22 h-116 a22,22 0 0 1 -22,-22 v-52 a22,22 0 0 1 22,-22 z"
          transform="rotate(-14 100 100)"
        />
      </defs>
      <text ref="labelRef" class="showreel__ring-text">
        <textPath ref="textPathRef" href="#showreel-rect" startOffset="0">
          showreel&#160;&#160;✲&#160;&#160;2025&#160;&#160;•&#160;&#160;showreel&#160;&#160;✲&#160;&#160;2025&#160;&#160;•&#160;&#160;showreel&#160;&#160;✲&#160;&#160;2025&#160;&#160;•&#160;&#160;
          <animate
            ref="animateRef"
            attributeName="startOffset"
            from="0"
            :to="scrollTo"
            dur="20s"
            repeatCount="indefinite"
          />
        </textPath>
      </text>
    </svg>
  </button>
</template>

<style scoped>
.showreel {
  position: fixed;
  bottom: -9.5rem;
  left: -9.5rem;
  z-index: 40;
  width: 33rem;
  height: 33rem;
  transition: transform 0.6s var(--ease-spring);
}

.showreel:hover {
  transform: scale(1.06) rotate(3deg);
}

.showreel__card {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.showreel__card-inner {
  width: 17.25rem;
  height: 12.6rem;
  border-radius: 1.8rem;
  transform: rotate(-14deg);
  background:
    radial-gradient(circle at 30% 65%, #ff6b4a 0%, #ff2f7b 32%, transparent 60%),
    radial-gradient(circle at 62% 40%, #21ffc0 0%, transparent 55%),
    linear-gradient(150deg, #f8ff4a 0%, #d6ff3d 55%, #8dff5a 100%);
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.55);
  transition: transform 0.6s var(--ease-spring);
}

.showreel:hover .showreel__card-inner {
  transform: rotate(-8deg) scale(1.05);
}

.showreel__ring {
  position: absolute;
  inset: 0;
}

/*
  font-size is expressed relative to the SVG viewBox (200 units). the container
  grew by 1.5×, so we shrink the type by the same factor to keep its on-screen
  size unchanged while the outline path scales up with the card.
*/
.showreel__ring-text {
  font-size: 6.2px;
  letter-spacing: 0.9px;
  fill: var(--color-text);
}

@media (max-width: 767px) {
  .showreel {
    width: 24rem;
    height: 24rem;
    bottom: -6rem;
    left: -5rem;
  }

  .showreel__card-inner {
    width: 12.75rem;
    height: 9.3rem;
  }
}
</style>
