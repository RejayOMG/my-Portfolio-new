import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

let registered = false

/** register gsap plugins once (client only) and create shared eases */
export function setupGsap() {
  if (registered || typeof window === 'undefined') return
  registered = true
  gsap.registerPlugin(ScrollTrigger, Observer, SplitText, CustomEase)

  // shared easing tokens, mirrors css custom properties
  CustomEase.create('expoOut', '0.19,1,0.22,1')
  CustomEase.create('springOut', 'M0,0 C0.2,0 0.25,1.35 0.45,1.35 0.65,1.35 0.65,1 1,1')

  gsap.defaults({ ease: 'expoOut', duration: 1 })

  // debug handle: lets tooling force-complete animations in throttled
  // (hidden) tabs where gsap lagSmoothing crawls tween progress.
  ;(window as unknown as { __gsap?: typeof gsap }).__gsap = gsap
}

export { gsap, ScrollTrigger, Observer, SplitText, CustomEase }
