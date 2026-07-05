import EventEmitter from './utils/EventEmitter'

export default class Sizes extends EventEmitter {
  width = 0
  height = 0
  pixelRatio = 1

  private onResize = () => {
    this.measure()
    this.trigger('resize')
  }

  constructor() {
    super()
    this.measure()
    window.addEventListener('resize', this.onResize)
  }

  private measure() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
  }

  destroy() {
    window.removeEventListener('resize', this.onResize)
    this.dispose()
  }
}
