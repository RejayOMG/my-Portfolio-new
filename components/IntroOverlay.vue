<script setup lang="ts">
import { gsap } from '~/utils/gsap'
import { audio } from '~/utils/audio'

const app = useAppStore()

const overlayRef = ref<HTMLElement | null>(null)
const dotRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const greetingRef = ref<HTMLElement | null>(null)
const identityRef = ref<HTMLElement | null>(null)
const sphereRef = ref<HTMLElement | null>(null)
const finalCopyRef = ref<HTMLElement | null>(null)
const entryRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)

const visible = ref(true)
const introReady = ref(false)
let exiting = false
let timeline: gsap.core.Timeline | null = null

function enter() {
  if (!introReady.value || exiting) return
  exiting = true

  // The single entry path starts audio; the global sound toggle can mute later.
  app.setMuted(false)
  audio.unlock(true)
  app.soundEnabled = true

  timeline?.kill()
  gsap.to(overlayRef.value, {
    opacity: 0,
    duration: app.reducedMotion ? 0.2 : 0.75,
    ease: 'expoOut',
    onComplete: () => {
      try {
        sessionStorage.setItem('portfolio:intro-seen', '1')
      } catch {}
      visible.value = false
      app.introDone = true
    },
  })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (!visible.value || !introReady.value) return
  e.preventDefault()
  enter()
}

function onBtnHover() {
  if (app.isTouch || app.reducedMotion) return
  audio.play('hover')
}

function setFinalState() {
  gsap.set([dotRef.value, cardRef.value, greetingRef.value, identityRef.value], { autoAlpha: 0 })
  gsap.set([sphereRef.value, finalCopyRef.value, entryRef.value], {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    clearProps: 'transform',
  })
  introReady.value = true
  nextTick(() => buttonRef.value?.focus({ preventScroll: true }))
}

function runIntro() {
  if (app.reducedMotion) {
    setFinalState()
    return
  }

  const dot = dotRef.value
  const card = cardRef.value
  const greeting = greetingRef.value
  const identity = identityRef.value
  const sphere = sphereRef.value
  const finalCopy = finalCopyRef.value
  const entry = entryRef.value

  gsap.set(dot, {
    autoAlpha: 0,
    y: 34,
    scaleX: 0.42,
    scaleY: 0.42,
    transformOrigin: '50% 50%',
  })
  gsap.set([card, sphere, greeting, identity, finalCopy, entry], { autoAlpha: 0 })
  gsap.set(card, { scale: 0.18, borderRadius: 999 })
  gsap.set(sphere, { scale: 0.45, rotation: -12 })
  gsap.set([greeting, identity, finalCopy], { y: 12 })
  gsap.set(entry, { scale: 0.96, y: 10 })

  timeline = gsap.timeline({
    defaults: { ease: 'expoOut' },
    onComplete: () => {
      introReady.value = true
      buttonRef.value?.focus({ preventScroll: true })
    },
  })

  timeline
    // 1. tiny glow dot: rise first, stretch vertically while rising, then drop
    .to(dot, { autoAlpha: 1, duration: 0.16 }, 0)
    .to(
      dot,
      { y: -44, scaleX: 0.68, scaleY: 1.38, duration: 0.52, ease: 'power2.out' },
      0,
    )
    // 2. greeting appears during the fall, not before it
    .to(greeting, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.58)
    .to(
      dot,
      { y: 6, scaleX: 0.84, scaleY: 1.16, duration: 0.4, ease: 'power2.in' },
      0.52,
    )
    // land → squash → bounce → settle
    .to(dot, { y: 0, scaleX: 1.22, scaleY: 0.76, duration: 0.12, ease: 'power2.out' }, 0.92)
    .to(dot, { y: -10, scaleX: 0.92, scaleY: 1.08, duration: 0.18, ease: 'power2.out' }, 1.04)
    .to(dot, { y: 0, scaleX: 1, scaleY: 1, duration: 0.3, ease: 'springOut' }, 1.22)
    .to(greeting, { autoAlpha: 0, y: -8, duration: 0.42 }, 1.95)
    // 3. abstract logo card + identity
    .to(dot, { autoAlpha: 0, scaleX: 0.72, scaleY: 0.72, duration: 0.38 }, 2.05)
    .to(
      card,
      { autoAlpha: 1, scale: 1, borderRadius: 18, duration: 0.78, ease: 'expoOut' },
      2.12,
    )
    .to(identity, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.44)
    .to(identity, { autoAlpha: 0, y: -8, duration: 0.38 }, 3.6)
    // 4. glossy sphere + final positioning copy
    .to(card, { autoAlpha: 0, scale: 0.72, borderRadius: 999, duration: 0.55 }, 3.64)
    .to(sphere, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.85, ease: 'springOut' }, 3.82)
    .to(finalCopy, { autoAlpha: 1, y: 0, duration: 0.68 }, 4.3)
    // 5. entry button appears only after the story finishes
    .to(entry, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55 }, 5.15)
}

onMounted(() => {
  try {
    if (sessionStorage.getItem('portfolio:intro-seen') === '1') {
      visible.value = false
      app.introDone = true
      return
    }
  } catch {}

  window.addEventListener('keydown', onKeydown)
  nextTick(runIntro)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  timeline?.kill()
})
</script>

<template>
  <div v-if="visible" ref="overlayRef" class="intro" role="dialog" aria-label="site entry">
    <div class="intro__inner">
      <div class="intro__mark-wrap" aria-hidden="true">
        <div ref="dotRef" class="intro__seed" />

        <div ref="cardRef" class="intro__logo-card">
          <span class="logo-shape logo-shape--moon" />
          <span class="logo-shape logo-shape--field" />
          <span class="logo-shape logo-shape--orb" />
          <span class="logo-shape logo-shape--coral" />
        </div>

        <div ref="sphereRef" class="intro__sphere">
          <span class="intro__sphere-eye intro__sphere-eye--left" />
          <span class="intro__sphere-eye intro__sphere-eye--right" />
          <span class="intro__sphere-smile" />
        </div>
      </div>

      <div class="intro__text-wrap">
        <p ref="greetingRef" class="intro__greeting">hey <span>!</span></p>
        <p ref="identityRef" class="intro__identity">I’m Renyi</p>
        <div ref="finalCopyRef" class="intro__final-copy">
          <p>AI Product Designer</p>
          <p>crafting AI-native creative tools</p>
        </div>
      </div>

      <div ref="entryRef" class="intro__entry">
        <button ref="buttonRef" class="intro__btn" type="button" @mouseenter="onBtnHover" @click="enter">
          enter site ↵
        </button>
        <p class="intro__hint">press Enter to continue</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: #030303;
}

.intro__inner {
  display: flex;
  min-height: min(38rem, 72vh);
  transform: translateY(-4vh);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  text-align: center;
}

.intro__mark-wrap {
  position: relative;
  display: grid;
  width: clamp(9rem, 18vw, 16rem);
  height: clamp(6rem, 14vw, 10rem);
  place-items: center;
}

.intro__seed {
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  background: #22ffc2;
  box-shadow:
    0 0 1.4rem rgba(33, 255, 192, 0.48),
    0 0 4rem rgba(33, 255, 192, 0.14);
  will-change: transform, opacity;
}

.intro__logo-card,
.intro__sphere {
  position: absolute;
  will-change: transform, opacity;
}

.intro__logo-card {
  overflow: hidden;
  width: clamp(10.8rem, 18vw, 15rem);
  aspect-ratio: 2.65 / 1;
  background: #1208fb;
  box-shadow: 0 1.4rem 4rem rgba(0, 0, 0, 0.28);
}

.logo-shape {
  position: absolute;
  display: block;
}

.logo-shape--moon {
  left: -16%;
  top: -12%;
  width: 38%;
  height: 124%;
  border-radius: 50%;
  background: #08005d;
}

.logo-shape--field {
  left: 26%;
  top: 0;
  width: 25%;
  height: 100%;
  background: linear-gradient(180deg, #8a63ff 0%, #604fff 100%);
}

.logo-shape--orb {
  left: 42%;
  bottom: -12%;
  width: 27%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #12e090;
}

.logo-shape--coral {
  right: -9%;
  bottom: -14%;
  width: 30%;
  height: 78%;
  transform: rotate(15deg);
  border-radius: 18% 18% 28% 28%;
  background: #ff5a45;
}

.intro__sphere {
  width: clamp(4.8rem, 7.3vw, 6.6rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 23% 28%, rgba(255, 255, 255, 0.95) 0 8%, transparent 18%),
    radial-gradient(circle at 60% 25%, rgba(142, 255, 77, 0.95) 0 9%, transparent 17%),
    radial-gradient(circle at 74% 30%, rgba(25, 255, 150, 0.95) 0 8%, transparent 17%),
    radial-gradient(circle at 68% 48%, #1affb3 0 20%, transparent 39%),
    radial-gradient(circle at 37% 34%, #efffe8 0 15%, transparent 34%),
    radial-gradient(circle at 72% 16%, #7dff3f 0 10%, transparent 35%),
    radial-gradient(circle at 37% 78%, #03100d 0 35%, transparent 58%),
    linear-gradient(135deg, #fbfff1 0%, #68ff27 26%, #10f0b5 58%, #030504 100%);
  box-shadow:
    inset -0.65rem -0.95rem 1.6rem rgba(0, 0, 0, 0.62),
    inset 0.55rem 0.45rem 1.2rem rgba(255, 255, 255, 0.42),
    0 1.2rem 2.8rem rgba(0, 0, 0, 0.36);
}

.intro__sphere-eye {
  position: absolute;
  top: 29%;
  width: 0.66rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(229, 255, 185, 0.78);
  box-shadow: inset 0.08rem 0.08rem 0.2rem rgba(255, 255, 255, 0.75);
}

.intro__sphere-eye--left {
  left: 45%;
}

.intro__sphere-eye--right {
  left: 60%;
}

.intro__sphere-smile {
  position: absolute;
  left: 28%;
  top: 47%;
  width: 47%;
  height: 22%;
  transform: rotate(8deg);
  border-right: 0.3rem solid transparent;
  border-bottom: 0.28rem solid #07130f;
  border-left: 0.3rem solid transparent;
  border-radius: 0 0 50% 50%;
}

.intro__text-wrap {
  position: relative;
  display: grid;
  min-height: 5.4rem;
  place-items: start center;
}

.intro__greeting,
.intro__identity,
.intro__final-copy {
  grid-area: 1 / 1;
  margin: 0;
  will-change: transform, opacity;
}

.intro__greeting {
  font-size: clamp(2.25rem, 4.1vw, 4rem);
  font-weight: 500;
  letter-spacing: -0.04em;
}

.intro__greeting span {
  opacity: 0.55;
}

.intro__identity {
  font-size: clamp(2rem, 3.4vw, 3.4rem);
  font-weight: 500;
  letter-spacing: 0.08em;
}

.intro__final-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: clamp(1.2rem, 1.8vw, 1.75rem);
  font-weight: 520;
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.intro__final-copy p {
  margin: 0;
}

.intro__entry {
  display: flex;
  margin-top: 1.8rem;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  will-change: transform, opacity;
}

.intro__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3.1rem;
  padding: 0 1.45rem;
  border-radius: 999px;
  background: #f5f5f5;
  color: #050505;
  font-size: clamp(1rem, 1.2vw, 1.18rem);
  font-weight: 520;
  letter-spacing: -0.035em;
  transition:
    transform 0.35s var(--ease-expo-out),
    background 0.35s var(--ease-expo-out);
}

.intro__btn:hover,
.intro__btn:focus-visible {
  background: #e8e8e8;
  transform: scale(1.045);
}

.intro__btn:focus-visible {
  outline: 1px solid rgba(255, 255, 255, 0.72);
  outline-offset: 0.38rem;
}

.intro__hint {
  margin: 0;
  color: rgba(250, 250, 250, 0.46);
  font-size: 0.78rem;
  letter-spacing: -0.02em;
}

@media (max-width: 767px) {
  .intro__inner {
    min-height: 58vh;
    transform: translateY(-2vh);
  }

  .intro__text-wrap {
    min-height: 4.8rem;
  }
}
</style>
