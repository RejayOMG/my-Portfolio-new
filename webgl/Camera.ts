import * as THREE from 'three'
import type Experience from './Experience'

/**
 * perspective camera calibrated so that 1 world unit == 1 css pixel
 * on the z = 0 plane. keeps webgl planes aligned with dom sizing.
 */
export default class Camera {
  instance: THREE.PerspectiveCamera
  readonly distance = 1000

  constructor(private experience: Experience) {
    const { width, height } = experience.sizes
    this.instance = new THREE.PerspectiveCamera(
      this.fovFor(height),
      width / height,
      10,
      4000,
    )
    this.instance.position.set(0, 0, this.distance)
    experience.scene.add(this.instance)
  }

  private fovFor(height: number) {
    return THREE.MathUtils.radToDeg(2 * Math.atan(height / 2 / this.distance))
  }

  resize() {
    const { width, height } = this.experience.sizes
    this.instance.aspect = width / height
    this.instance.fov = this.fovFor(height)
    this.instance.updateProjectionMatrix()
  }
}
