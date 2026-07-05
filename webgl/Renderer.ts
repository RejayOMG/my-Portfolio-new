import * as THREE from 'three'
import type Experience from './Experience'
import { postVertex, postFragment } from './shaders'

/**
 * renderer + fullscreen bayer-dithering post pass.
 * scene renders to an offscreen target, then a screen quad quantizes
 * the frame with an ordered dither for the grainy signature look.
 */
export default class Renderer {
  instance: THREE.WebGLRenderer
  private target: THREE.WebGLRenderTarget
  private postScene = new THREE.Scene()
  private postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private postMaterial: THREE.ShaderMaterial

  constructor(private experience: Experience) {
    const { sizes, canvas } = experience

    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.instance.setClearColor('#0a0a0a', 1)
    this.instance.setSize(sizes.width, sizes.height)
    this.instance.setPixelRatio(sizes.pixelRatio)

    this.target = new THREE.WebGLRenderTarget(
      sizes.width * sizes.pixelRatio,
      sizes.height * sizes.pixelRatio,
      { samples: 0 },
    )

    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: postVertex,
      fragmentShader: postFragment,
      uniforms: {
        tScene: { value: this.target.texture },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial)
    quad.frustumCulled = false
    this.postScene.add(quad)
  }

  resize() {
    const { sizes } = this.experience
    this.instance.setSize(sizes.width, sizes.height)
    this.instance.setPixelRatio(sizes.pixelRatio)
    this.target.setSize(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
  }

  update() {
    const { scene, camera, time } = this.experience
    this.postMaterial.uniforms.uTime.value = time.elapsed

    this.instance.setRenderTarget(this.target)
    this.instance.render(scene, camera.instance)
    this.instance.setRenderTarget(null)
    this.instance.render(this.postScene, this.postCamera)
  }

  destroy() {
    this.target.dispose()
    this.postMaterial.dispose()
    this.instance.dispose()
  }
}
