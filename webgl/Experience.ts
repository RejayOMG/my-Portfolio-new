import * as THREE from 'three'
import Sizes from './Sizes'
import Time from './Time'
import Camera from './Camera'
import Renderer from './Renderer'
import Resources from './Resources'
import World from './World/World'

export interface ExperienceOptions {
  reducedMotion: boolean
  isTouch: boolean
}

/**
 * webgl experience singleton — created once, reused across client-side
 * route changes. pages only add/remove scene content, the renderer and
 * canvas are never rebuilt.
 */
export default class Experience {
  static instance: Experience | null = null

  canvas!: HTMLCanvasElement
  options!: ExperienceOptions
  sizes!: Sizes
  time!: Time
  scene!: THREE.Scene
  camera!: Camera
  renderer!: Renderer
  resources!: Resources
  world!: World

  static init(canvas: HTMLCanvasElement, options: ExperienceOptions): Experience {
    if (Experience.instance) return Experience.instance
    return new Experience(canvas, options)
  }

  private constructor(canvas: HTMLCanvasElement, options: ExperienceOptions) {
    Experience.instance = this

    this.canvas = canvas
    this.options = options
    this.sizes = new Sizes()
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.camera = new Camera(this)
    this.renderer = new Renderer(this)
    this.resources = new Resources(this.renderer.instance)
    this.world = new World(this)

    this.sizes.on('resize', () => {
      this.camera.resize()
      this.renderer.resize()
      this.world.resize()
    })

    this.time.on('tick', () => {
      this.world.update()
      this.renderer.update()
    })
  }

  destroy() {
    this.time.destroy()
    this.sizes.destroy()
    this.world.destroy()
    this.renderer.destroy()
    Experience.instance = null
  }
}
