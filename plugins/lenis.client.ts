import Lenis from 'lenis'
import { setupGsap, gsap, ScrollTrigger } from '~/utils/gsap'

export default defineNuxtPlugin((nuxtApp) => {
  setupGsap()

  const app = useAppStore()
  app.hydratePreferences()

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: !app.reducedMotion,
    easing: (t: number) => 1 - Math.pow(2, -10 * t),
  })

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  // dynamic viewport height token
  const setIvh = () => {
    document.documentElement.style.setProperty('--ivh', `${window.innerHeight * 0.01}px`)
  }
  setIvh()
  window.addEventListener('resize', setIvh)

  // refresh triggers after route transitions settle
  nuxtApp.hook('page:transition:finish', () => {
    lenis.scrollTo(0, { immediate: true })
    ScrollTrigger.refresh()
  })

  return {
    provide: { lenis },
  }
})
