import EventEmitter from './utils/EventEmitter'

export default class Time extends EventEmitter {
  start = performance.now()
  current = this.start
  elapsed = 0
  delta = 16
  private rafId = 0
  private running = true

  constructor() {
    super()
    this.rafId = window.requestAnimationFrame(this.tick)
  }

  private tick = () => {
    if (!this.running) return
    const now = performance.now()
    this.delta = Math.min(now - this.current, 60) // clamp tab-switch spikes
    this.current = now
    this.elapsed = now - this.start

    this.trigger('tick')
    this.rafId = window.requestAnimationFrame(this.tick)
  }

  destroy() {
    this.running = false
    window.cancelAnimationFrame(this.rafId)
    this.dispose()
  }
}
