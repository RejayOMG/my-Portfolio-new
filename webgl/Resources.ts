import * as THREE from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

/**
 * texture loading with optional ktx2 (basis universal) support.
 * `.ktx2` urls go through the gpu-compressed pipeline (transcoder in /basis/),
 * everything else falls back to the standard image loader with mipmaps.
 */
export default class Resources {
  private textureLoader = new THREE.TextureLoader()
  private ktx2Loader: KTX2Loader | null = null
  private cache = new Map<string, Promise<THREE.Texture>>()
  private maxAnisotropy: number

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
    try {
      this.ktx2Loader = new KTX2Loader()
        .setTranscoderPath('/basis/')
        .detectSupport(renderer)
    } catch {
      this.ktx2Loader = null
    }
    this.textureLoader.setCrossOrigin('anonymous')
  }

  load(url: string): Promise<THREE.Texture> {
    let promise = this.cache.get(url)
    if (!promise) {
      promise = this.loadRaw(url).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = Math.min(8, this.maxAnisotropy)
        if (!url.includes('.ktx2')) {
          texture.generateMipmaps = true
          texture.minFilter = THREE.LinearMipmapLinearFilter
        }
        return texture
      })
      this.cache.set(url, promise)
    }
    return promise
  }

  private loadRaw(url: string): Promise<THREE.Texture> {
    if (url.includes('.ktx2') && this.ktx2Loader) {
      return this.ktx2Loader.loadAsync(url)
    }
    return this.textureLoader.loadAsync(url)
  }

  destroy() {
    this.ktx2Loader?.dispose()
    this.cache.clear()
  }
}
