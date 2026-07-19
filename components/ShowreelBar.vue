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
const repeatCount = 2
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
          d="M59,57 h82 a16,16 0 0 1 16,16 v54 a16,16 0 0 1 -16,16 h-82 a16,16 0 0 1 -16,-16 v-54 a16,16 0 0 1 16,-16 z"
          transform="rotate(-14 100 100)"
        />
      </defs>
      <text ref="labelRef" class="showreel__ring-text">
        <textPath ref="textPathRef" href="#showreel-rect" startOffset="0">
          showreel&#160;&#160;✲&#160;&#160;2025&#160;&#160;•&#160;&#160;showreel&#160;&#160;✲&#160;&#160;2025&#160;&#160;•&#160;&#160;
          <animate
            ref="animateRef"
            attributeName="startOffset"
            from="0"
            :to="scrollTo"
            dur="30s"
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
  bottom: -23.25rem;
  left: -14.25rem;
  z-index: 40;
  width: 42.9rem;
  height: 42.9rem;
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
  width: 22.4rem;
  height: 16.4rem;
  border-radius: 2.3rem;
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
  font-size is expressed relative to the SVG viewBox (200 units), so the label
  scales together with the card as the container grows — spacing stays natural
  because the perimeter/textLength ratio is resolution-independent.
*/
.showreel__ring-text {
  font-size: 8.7px;
  letter-spacing: 0.85px;
  fill: var(--color-text);
}

@media (max-width: 767px) {
  .showreel {
    width: 31.2rem;
    height: 31.2rem;
    bottom: -9rem;
    left: -7.5rem;
  }

  .showreel__card-inner {
    width: 16.6rem;
    height: 12.1rem;
  }
}
</style>
