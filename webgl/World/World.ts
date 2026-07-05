import * as THREE from 'three'
import type Experience from '../Experience'
import Gallery from './Gallery'
import { bgVertex, bgFragment } from '../shaders'

/**
 * scene contents: an ambient background field (always visible, feeds the
 * dithering pass) and the project gallery.
 */
export default class World {
  gallery: Gallery
  private bgMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>

  constructor(private experience: Experience) {
    // ambient drifting background — gives the dither pass something to chew on
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      uniforms: {
        uTime: { value: 0 },
        uCell: { value: 64 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uOverscan: { value: 1.1 },
      },
      depthWrite: false,
    })
    this.bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMaterial)
    this.bgMesh.renderOrder = -1
    experience.scene.add(this.bgMesh)
    this.layoutBackground()

    this.gallery = new Gallery(experience)
  }

  private layoutBackground() {
    const { width, height, pixelRatio } = this.experience.sizes
    // placed behind the spiral, scaled to always cover the frustum
    this.bgMesh.position.z = -1600
    const dist = this.experience.camera.distance + 1600
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(this.experience.camera.instance.fov / 2))
    const w = h * (width / height)
    this.bgMesh.scale.set(w * 1.1, h * 1.1, 1)
    // denser grid ≈ 64 css px cells, in device px for screen-space sampling
    this.bgMesh.material.uniforms.uCell.value = 64 * pixelRatio
    this.bgMesh.material.uniforms.uRes.value.set(width * pixelRatio, height * pixelRatio)
  }

  update() {
    this.bgMesh.material.uniforms.uTime.value = this.experience.time.elapsed
    this.gallery.update()
  }

  resize() {
    this.layoutBackground()
    this.gallery.resize()
  }

  destroy() {
    this.bgMesh.material.dispose()
    this.bgMesh.geometry.dispose()
    this.gallery.destroy()
  }
}
