import * as THREE from 'three'
import { gsap, Observer } from '~/utils/gsap'
import type { Project } from '~/types/content'
import type Experience from '../Experience'
import ProjectPlane from './ProjectPlane'

export type GalleryMode = 'spiral' | 'list'

/** idle auto-drift — cards slowly roll top→bottom (full loop ≈ 70s) */
const AUTO_SPEED = 1 / 70

/**
 * the webgl project gallery — a helix of shader planes with inertial
 * wheel/drag rotation (spiral mode) and a staggered dissolve into the
 * dom list (list mode).
 */
export default class Gallery {
  group = new THREE.Group()
  planes: ProjectPlane[] = []

  mode: GalleryMode = 'spiral'
  revealed = false
  focusing = false

  // the slow auto-drift loop only starts once the entry animation (cards
  // tumbling down from above) has fully finished
  private driftReady = false
  private driftCall: ReturnType<typeof gsap.delayedCall> | null = null

  // spiral motion
  private progress = 0
  private targetProgress = 0
  private scrollSpeed = 0
  private lastProgress = 0
  private lastTickIndex = 0

  // layout — cards ride a real cylindrical helix around the vertical
  // center axis: a card enters at the top on the far side (back facing
  // the screen), winds around the axis while descending, faces the viewer
  // head-on exactly at the vertical center, then winds back toward the
  // far side again as it exits below.
  private radius = 500
  private spanY = 1600
  private bend = 0

  // input / hover
  private observer: Observer | null = null
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2(-2, -2)
  private pointerActive = false
  hovered: ProjectPlane | null = null

  // callbacks wired from the vue layer
  onHover: (plane: ProjectPlane | null) => void = () => {}
  onTick: () => void = () => {}

  private geometry = new THREE.PlaneGeometry(1, 1, 24, 24)
  private onPointerMove = (e: PointerEvent) => {
    this.pointer.set(
      (e.clientX / this.experience.sizes.width) * 2 - 1,
      -(e.clientY / this.experience.sizes.height) * 2 + 1,
    )
    this.pointerActive = true
  }

  constructor(private experience: Experience) {
    experience.scene.add(this.group)
    window.addEventListener('pointermove', this.onPointerMove)
  }

  /* ------------------------------------------------------------- content */

  setProjects(projects: Project[]) {
    for (const plane of this.planes) {
      this.group.remove(plane.mesh)
      plane.destroy()
    }
    this.planes = projects.map((project, i) => {
      const plane = new ProjectPlane(project, i, this.geometry)
      this.group.add(plane.mesh)
      return plane
    })
    this.layout()
    this.loadTextures()
  }

  private loadTextures() {
    for (const plane of this.planes) {
      const url = plane.project.thumbnail
      if (!url) continue
      this.experience.resources
        .load(url)
        .then((texture) => {
          const img = texture.image as { width?: number; height?: number }
          plane.setTexture(texture, img?.width ?? 1280, img?.height ?? 720)
        })
        .catch(() => {}) // keep procedural fallback
    }
  }

  /* -------------------------------------------------------------- layout */

  layout() {
    const { width, height } = this.experience.sizes
    const isMobile = width < 768
    // card area: +8% from the current size (linear ×√1.08 ≈ 1.0392)
    const planeW = isMobile ? width * 0.4735 : width * 0.1793
    const planeH = planeW * 0.62
    const count = Math.max(this.planes.length, 1)
    // vertical stagger: consecutive card centers step down by `gap`. tied to
    // the viewport height so the visible front cascade stretches the full
    // height — the topmost card rides up to the top edge and the bottom one
    // sinks to the bottom edge (spanY ≈ 2.3× viewport tall across the strand).
    const gap = height * 0.1672
    this.spanY = count * gap
    // cylinder radius around the vertical center axis, tuned for a reference
    // layout with two front cards straddling the center. the half-step phase in
    // update() places those cards at ±π/count, so this keeps a 60px net gap
    // between their visible edges while avoiding overlap.
    const hGap = 60
    const frontStep = count > 1 ? 2 * Math.sin(Math.PI / count) : 1
    this.radius = (planeW + hGap) / frontStep
    // sagitta — cards curve to hug the cylinder surface (px)
    this.bend = (planeW * planeW) / (8 * this.radius)

    for (const plane of this.planes) {
      plane.setSizes(planeW, planeH)
    }
  }

  /* --------------------------------------------------------------- input */

  enableInput() {
    if (this.observer || this.experience.options.reducedMotion) return
    this.observer = Observer.create({
      target: window as unknown as Element,
      type: 'wheel,touch,pointer',
      dragMinimum: 3,
      tolerance: 6,
      preventDefault: false,
      onWheel: (self) => {
        this.targetProgress += self.deltaY * 0.00022
      },
      onDrag: (self) => {
        this.targetProgress -= self.deltaY * 0.0012
      },
      onStop: () => {},
    })
  }

  disableInput() {
    this.observer?.kill()
    this.observer = null
  }

  /* ------------------------------------------------------------ visibility */

  reveal() {
    if (this.revealed) return
    this.revealed = true
    const drop = this.experience.options.reducedMotion ? 0 : 120
    const duration = 0.9
    const baseDelay = 0.12
    const stagger = 0.09
    this.planes.forEach((plane, i) => {
      // scatter the descent — each card tumbles in a beat after the previous
      plane.reveal(baseDelay + i * stagger, duration, drop)
    })
    // kick off the slow loop the instant the first card starts dropping in —
    // no dead pause waiting for the whole strand to settle
    this.driftReady = false
    this.driftCall?.kill()
    this.driftCall = gsap.delayedCall(baseDelay, () => {
      this.driftReady = true
    })
    if (this.mode === 'spiral') this.enableInput()
  }

  /** staggered dissolve keyed by index % 4 (list-mode hide) */
  hideStaggered(onComplete?: () => void) {
    this.revealed = false
    this.driftCall?.kill()
    this.disableInput()
    let done = 0
    const total = this.planes.length
    this.planes.forEach((plane, i) => {
      plane.hide((i % 4) * 0.08, 0.5, () => {
        done += 1
        if (done === total) onComplete?.()
      })
    })
  }

  hideInstant() {
    this.revealed = false
    this.driftCall?.kill()
    this.disableInput()
    this.clearHover()
    for (const plane of this.planes) plane.hideInstant()
  }

  setMode(mode: GalleryMode) {
    if (this.mode === mode) return
    this.mode = mode
    if (mode === 'list') {
      this.clearHover()
      this.hideStaggered()
    } else {
      const drop = this.experience.options.reducedMotion ? 0 : 120
      this.planes.forEach((plane, i) => plane.reveal(0.12 + i * 0.09, 0.9, drop))
      this.revealed = true
      this.driftReady = false
      this.driftCall?.kill()
      this.driftCall = gsap.delayedCall(0.12, () => {
        this.driftReady = true
      })
      this.enableInput()
    }
  }

  /* ---------------------------------------------------------------- hover */

  private clearHover() {
    if (!this.hovered) return
    this.hovered.hoverOut()
    this.hovered = null
    this.onHover(null)
  }

  private updateHover() {
    if (
      this.mode !== 'spiral' ||
      !this.revealed ||
      this.focusing ||
      !this.pointerActive ||
      this.experience.options.isTouch
    ) {
      this.clearHover()
      return
    }

    this.raycaster.setFromCamera(this.pointer, this.experience.camera.instance)
    const hits = this.raycaster.intersectObjects(
      this.planes.filter((p) => p.mesh.visible).map((p) => p.mesh),
      false,
    )
    const plane = (hits[0]?.object.userData.plane as ProjectPlane) ?? null

    if (plane !== this.hovered) {
      this.hovered?.hoverOut()
      this.hovered = plane
      plane?.hoverIn()
      this.onHover(plane)
    }
  }

  /** raycast at client coordinates — used for click/tap picking */
  raycastAt(clientX: number, clientY: number): ProjectPlane | null {
    const { width, height } = this.experience.sizes
    const ndc = new THREE.Vector2((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.experience.camera.instance)
    const hits = this.raycaster.intersectObjects(
      this.planes.filter((p) => p.mesh.visible).map((p) => p.mesh),
      false,
    )
    return (hits[0]?.object.userData.plane as ProjectPlane) ?? null
  }

  /* ------------------------------------------------------ focus transition */

  /**
   * shared-element transition: the clicked plane grows to cover the
   * viewport while the others dissolve. resolves when fully covered.
   */
  focusPlane(plane: ProjectPlane): Promise<void> {
    return new Promise((resolve) => {
      this.focusing = true
      this.disableInput()
      this.clearHover()

      const { width, height } = this.experience.sizes
      const cover = Math.max(width / plane.baseWidth, height / plane.baseHeight) * 1.02

      for (const other of this.planes) {
        if (other !== plane) other.hide(0, 0.35)
      }

      // bring in front of everything
      plane.mesh.renderOrder = 10
      gsap.killTweensOf(plane.mesh.position)

      const tl = gsap.timeline({ onComplete: () => resolve() })
      tl.to(
        plane.mesh.position,
        { x: 0, y: 0, z: 40, duration: 0.9, ease: 'expoOut', overwrite: true },
        0,
      )
      tl.to(plane.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.9, ease: 'expoOut' }, 0)
      tl.to(
        plane.mesh.scale,
        {
          x: plane.baseWidth * cover,
          y: plane.baseHeight * cover,
          duration: 0.95,
          ease: 'expo.inOut',
        },
        0.05,
      )
      tl.to(plane.uniforms.uZoom, { value: 0, duration: 0.6 }, 0)
      tl.to(plane.uniforms.uBlur, { value: 0, duration: 0.45 }, 0)
      tl.to(plane.uniforms.uBend, { value: 0, duration: 0.45 }, 0)
    })
  }

  /** called after route change completed — reset everything beneath the dom */
  afterFocus() {
    this.focusing = false
    this.hideInstant()
    for (const plane of this.planes) {
      plane.mesh.renderOrder = 0
      plane.mesh.scale.set(1, 1, 1)
    }
  }

  /* --------------------------------------------------------------- update */

  update() {
    if (!this.planes.length) return
    const { time } = this.experience
    const delta = time.delta

    // idle auto-drift: cards flow slowly downward; user wheel/drag input is
    // simply added on top of the same target, so the gallery follows the
    // gesture and naturally eases back into the default drift afterwards.
    // the drift only kicks in once the entry animation has fully settled.
    if (
      this.revealed &&
      this.driftReady &&
      this.mode === 'spiral' &&
      !this.focusing &&
      !this.experience.options.reducedMotion
    ) {
      this.targetProgress += AUTO_SPEED * (delta / 1000)
    }

    // inertial progress
    const k = 1 - Math.pow(0.002, delta / 1000)
    this.progress += (this.targetProgress - this.progress) * k

    // scroll speed (normalized) for the vertex distortion, smoothed
    const instSpeed = (this.progress - this.lastProgress) * (1000 / Math.max(delta, 1))
    this.lastProgress = this.progress
    this.scrollSpeed += (THREE.MathUtils.clamp(instSpeed * 4, -1, 1) - this.scrollSpeed) * 0.1

    // scroll ticks
    const n = this.planes.length
    const tickIndex = Math.floor(this.progress * n)
    if (tickIndex !== this.lastTickIndex && this.revealed && this.mode === 'spiral') {
      this.lastTickIndex = tickIndex
      this.onTick()
    }

    // cylindrical helix placement around the vertical center axis.
    // theta = 0 → card at the front of the cylinder, facing the viewer;
    // theta = ±π → card on the far side, back turned to the screen.

    // velocity pitch — cards lean into the direction of travel like sheets
    // carried by the motion: ≈5° at the idle drift speed, growing (and
    // flipping sign) with wheel velocity. the lean eases away as a card
    // approaches the screen center and is exactly zero dead-center.
    const idleSpeed = AUTO_SPEED * 4 // smoothed scrollSpeed at idle drift
    const lean =
      THREE.MathUtils.clamp(this.scrollSpeed / idleSpeed, -3.2, 3.2) * (Math.PI / 36)

    for (const plane of this.planes) {
      if (this.focusing && plane.mesh.renderOrder === 10) {
        plane.update(0, time.elapsed, delta)
        continue
      }

      const i = plane.index
      const phase = n > 1 ? 0.5 / n : 0
      const t = THREE.MathUtils.euclideanModulo(i / n + phase + this.progress, 1)
      const off = t - 0.5 // -0.5 .. 0.5, 0 = vertical center
      const dist = Math.abs(off) * 2 // 0 .. 1
      // one full revolution across the span. the half-step phase keeps the
      // foreground split into two offset hero cards (like the reference) rather
      // than a single card sitting on the exact center axis.
      const theta = off * Math.PI * 2

      // focus weight — 1 at the front card, fades out over neighbors
      const focus = 1 - THREE.MathUtils.smoothstep(dist, 0.04, 0.4)

      // ride the cylinder surface (front of the cylinder sits at z = 0). keep
      // the path symmetric: no horizontal skew or width compression, so the
      // radius formula's 60px front-card clearance stays true and cards do not
      // visually overlap.
      plane.mesh.position.set(
        Math.sin(theta) * this.radius,
        (0.5 - t) * this.spanY + plane.revealDrop,
        (Math.cos(theta) - 1) * this.radius,
      )

      // deterministic stacking: the closer a card is to the screen center,
      // the later it draws. depth testing is off, so this fully replaces the
      // per-frame distance sort that used to flip between the two cards
      // straddling the center (equal camera distance) during fast scrolling,
      // which read as jagged clipping where they overlapped.
      plane.mesh.renderOrder = 1 - dist

      // the card is tangent to the cylinder — its normal always points
      // radially outward, so the back naturally shows on the far side.
      // pitch (x) leans into the travel direction, easing flat at center.
      plane.mesh.rotation.x = lean * (1 - focus)
      plane.mesh.rotation.y = theta
      plane.mesh.rotation.z = 0

      // depth-of-field blur + curvature hugging the cylinder surface
      plane.uniforms.uBlur.value = THREE.MathUtils.smoothstep(dist, 0.08, 0.5)
      plane.uniforms.uBend.value = this.bend

      // opacity: fully solid around the center, easing to semi-transparent
      // toward the far top/bottom ends. instead of dissolving to zero at the
      // loop seam, keep a faint floor so the head (t→0, top) and tail (t→1,
      // bottom) end cards stay dimly visible — this surfaces one extra faint
      // card at each extreme end. away from the seam (min(t,1-t) > 0.03) seam
      // is exactly 1, so every current card is left completely untouched.
      const seam = THREE.MathUtils.lerp(
        0.4,
        1,
        THREE.MathUtils.smoothstep(Math.min(t, 1 - t), 0, 0.03),
      )
      const far = 1 - 0.55 * THREE.MathUtils.smoothstep(dist, 0.55, 0.98)
      plane.uniforms.uEdgeFade.value = seam * far

      // perspective does the size work; just a gentle focus emphasis
      const s = plane.hoverScale * (1 + focus * 0.12)
      plane.mesh.scale.set(plane.baseWidth * s, plane.baseHeight * s, 1)

      plane.update(this.scrollSpeed, time.elapsed, delta)
    }

    this.updateHover()
  }

  resize() {
    this.layout()
  }

  destroy() {
    this.driftCall?.kill()
    this.disableInput()
    window.removeEventListener('pointermove', this.onPointerMove)
    for (const plane of this.planes) plane.destroy()
    this.geometry.dispose()
  }
}
