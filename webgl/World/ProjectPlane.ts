import * as THREE from 'three'
import { gsap } from '~/utils/gsap'
import type { Project } from '~/types/content'
import { planeVertex, planeFragment } from '../shaders'

/** decorative word pool for the randomized card typography */
const TAG_WORDS = [
  'motion', '3d', 'direction', 'loop', 'type', 'render',
  'frames', 'play', 'sim', 'mograph', 'cg', 'anim',
]
const GLYPHS = ['✲', '●', '↗', '◯', '✳', '∗']

/** tiny seeded prng — keeps each card's layout stable within a session */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * a single project thumbnail rendered as a shader plane.
 * geometry is shared, every plane owns its material/uniforms.
 */
export default class ProjectPlane {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  material: THREE.ShaderMaterial
  baseWidth = 1
  baseHeight = 1
  hoverScale = 1
  /** vertical entry offset (px) — cards tumble down from above on reveal */
  revealDrop = 0
  private targetHoverScale = 1
  private textTexture: THREE.CanvasTexture | null = null

  constructor(
    public project: Project,
    public index: number,
    geometry: THREE.PlaneGeometry,
  ) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: planeVertex,
      fragmentShader: planeFragment,
      transparent: true,
      depthWrite: false,
      // stacking is fully controlled via renderOrder (set every frame by the
      // gallery) — depth testing would only produce jagged clipping when
      // deformed neighbors interpenetrate during fast scrolling
      depthTest: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: { value: null },
        uHasTexture: { value: 0 },
        uTextTexture: { value: null },
        uHasText: { value: 0 },
        uPlaneSizes: { value: new THREE.Vector2(1, 1) },
        uImageSizes: { value: new THREE.Vector2(1, 1) },
        uRevealProgress: { value: 0 },
        uScrollSpeed: { value: 0 },
        uZoom: { value: 0 },
        uColorStrength: { value: 0 },
        uEdgeFade: { value: 1 },
        uCornerRadius: { value: 0 },
        uBlur: { value: 0 },
        uBend: { value: 0 },
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(project.colorA) },
        uColorB: { value: new THREE.Color(project.colorB) },
      },
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.userData.plane = this
    this.mesh.visible = false

    this.createTextTexture()
    // redraw once webfonts are available so canvas uses the real typeface
    document.fonts?.ready.then(() => this.createTextTexture()).catch(() => {})
  }

  /** randomized typographic overlay drawn onto a transparent canvas */
  private createTextTexture() {
    const rand = mulberry32(this.index * 7919 + 137)
    const W = 1024
    const H = 640
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const font = (weight: number, size: number) =>
      `${weight} ${size}px "Inter Variable", "Indivisible Variable", system-ui, sans-serif`
    const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = 'rgba(250, 250, 250, 0.96)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 14

    // --- title: random corner, slight random tilt
    const title = this.project.title.toLowerCase()
    const corner = Math.floor(rand() * 4)
    const tilt = (rand() - 0.5) * 0.14
    const pad = 66
    ctx.save()
    ctx.font = font(600, 58 + Math.floor(rand() * 14))
    const tw = ctx.measureText(title).width
    const tx = corner % 2 === 0 ? pad : W - pad - tw
    const ty = corner < 2 ? pad + 58 : H - pad
    ctx.translate(tx + tw / 2, ty)
    ctx.rotate(tilt)
    ctx.fillText(title, -tw / 2, 0)
    ctx.restore()

    // --- year: opposite side, small
    const year = String(this.project.year)
    ctx.save()
    ctx.font = font(500, 30)
    const yw = ctx.measureText(year).width
    const yx = corner % 2 === 0 ? W - pad - yw : pad
    const yy = corner < 2 ? H - pad : pad + 30
    ctx.fillText(year, yx, yy)
    ctx.restore()

    // --- scattered decorative tags (1-2 word + glyph pairs)
    const tags = 1 + Math.floor(rand() * 2)
    for (let i = 0; i < tags; i++) {
      const label = `${pick(GLYPHS)} ${pick(TAG_WORDS)}`
      ctx.save()
      ctx.font = font(450, 24 + Math.floor(rand() * 10))
      ctx.globalAlpha = 0.55 + rand() * 0.4
      const lw = ctx.measureText(label).width
      const lx = pad + rand() * (W - pad * 2 - lw)
      const ly = H * 0.38 + rand() * H * 0.3
      ctx.translate(lx, ly)
      ctx.rotate((rand() - 0.5) * 0.3)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    this.textTexture?.dispose()
    this.textTexture = texture
    this.uniforms.uTextTexture.value = texture
    this.uniforms.uHasText.value = 1
  }

  get uniforms() {
    return this.material.uniforms
  }

  setSizes(width: number, height: number) {
    this.baseWidth = width
    this.baseHeight = height
    this.uniforms.uPlaneSizes.value.set(width, height)
    this.uniforms.uCornerRadius.value = Math.min(width, height) * 0.075
  }

  setTexture(texture: THREE.Texture, width: number, height: number) {
    this.uniforms.uTexture.value = texture
    this.uniforms.uImageSizes.value.set(width, height)
    this.uniforms.uHasTexture.value = 1
  }

  reveal(delay = 0, duration = 1.2, drop = 120) {
    this.mesh.visible = true
    gsap.killTweensOf(this.uniforms.uRevealProgress)
    gsap.killTweensOf(this, 'revealDrop')
    // the card tumbles quickly down into place from `drop` px above while
    // dissolving in — opacity reaches 100% well before the motion settles
    this.revealDrop = drop
    gsap.to(this, { revealDrop: 0, duration, delay, ease: 'expoOut' })
    gsap.to(this.uniforms.uRevealProgress, {
      value: 1,
      duration: Math.min(0.5, duration * 0.55),
      delay,
      ease: 'power2.out',
    })
  }

  hide(delay = 0, duration = 0.6, onComplete?: () => void) {
    gsap.killTweensOf(this.uniforms.uRevealProgress)
    gsap.killTweensOf(this, 'revealDrop')
    this.revealDrop = 0
    gsap.to(this.uniforms.uRevealProgress, {
      value: 0,
      duration,
      delay,
      ease: 'power2.in',
      onComplete: () => {
        this.mesh.visible = false
        onComplete?.()
      },
    })
  }

  hideInstant() {
    gsap.killTweensOf(this.uniforms.uRevealProgress)
    gsap.killTweensOf(this, 'revealDrop')
    this.revealDrop = 0
    this.uniforms.uRevealProgress.value = 0
    this.mesh.visible = false
  }

  hoverIn() {
    this.targetHoverScale = 1.06
    gsap.to(this.uniforms.uZoom, { value: 1, duration: 0.7, ease: 'expoOut' })
    gsap.to(this.uniforms.uColorStrength, { value: 1, duration: 0.7, ease: 'expoOut' })
  }

  hoverOut() {
    this.targetHoverScale = 1
    gsap.to(this.uniforms.uZoom, { value: 0, duration: 0.7, ease: 'expoOut' })
    gsap.to(this.uniforms.uColorStrength, { value: 0, duration: 0.7, ease: 'expoOut' })
  }

  update(scrollSpeed: number, time: number, delta: number) {
    this.uniforms.uScrollSpeed.value = scrollSpeed
    this.uniforms.uTime.value = time
    // smooth hover scale
    const k = 1 - Math.pow(0.001, delta / 1000)
    this.hoverScale += (this.targetHoverScale - this.hoverScale) * k
  }

  destroy() {
    gsap.killTweensOf(this.uniforms.uRevealProgress)
    gsap.killTweensOf(this, 'revealDrop')
    gsap.killTweensOf(this.uniforms.uZoom)
    gsap.killTweensOf(this.uniforms.uColorStrength)
    this.textTexture?.dispose()
    this.material.dispose()
  }
}
