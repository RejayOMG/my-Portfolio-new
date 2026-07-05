<script setup lang="ts">
import { audio } from '~/utils/audio'

const app = useAppStore()

function openReel() {
  audio.play('longclick')
  app.videoModalOpen = true
}
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

    <!-- rotating circular label -->
    <svg class="showreel__ring" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path
          id="showreel-circle"
          d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
        />
      </defs>
      <text class="showreel__ring-text">
        <textPath href="#showreel-circle" startOffset="0">
          showreel &#160;✲&#160; 2025 &#160;•&#160; showreel &#160;✲&#160; 2025 &#160;•&#160;
        </textPath>
      </text>
    </svg>
  </button>
</template>

<style scoped>
.showreel {
  position: fixed;
  bottom: -3rem;
  left: -1rem;
  z-index: 40;
  width: 22rem;
  height: 22rem;
  transition: transform 0.6s var(--ease-spring);
}

.showreel:hover {
  transform: scale(1.07) rotate(3deg);
}

.showreel__card {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.showreel__card-inner {
  width: 11.5rem;
  height: 8.4rem;
  border-radius: 1.2rem;
  transform: rotate(-14deg);
  background:
    radial-gradient(circle at 30% 65%, #ff6b4a 0%, #ff2f7b 32%, transparent 60%),
    radial-gradient(circle at 62% 40%, #21ffc0 0%, transparent 55%),
    linear-gradient(150deg, #f8ff4a 0%, #d6ff3d 55%, #8dff5a 100%);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.55);
  transition: transform 0.6s var(--ease-spring);
}

.showreel:hover .showreel__card-inner {
  transform: rotate(-8deg) scale(1.05);
}

.showreel__ring {
  position: absolute;
  inset: 0;
  animation: showreel-spin 22s linear infinite;
}

.showreel__ring-text {
  font-size: 1.55rem;
  letter-spacing: 0.32em;
  fill: var(--color-text);
}

@keyframes showreel-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .showreel__ring {
    animation: none;
  }
}

@media (max-width: 767px) {
  .showreel {
    width: 16rem;
    height: 16rem;
    bottom: -2rem;
  }

  .showreel__card-inner {
    width: 8.5rem;
    height: 6.2rem;
  }
}
</style>
