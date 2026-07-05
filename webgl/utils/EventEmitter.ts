type Callback = (...args: any[]) => void

export default class EventEmitter {
  private callbacks: Record<string, Callback[]> = {}

  on(event: string, callback: Callback) {
    ;(this.callbacks[event] ||= []).push(callback)
    return this
  }

  off(event: string, callback?: Callback) {
    if (!callback) {
      delete this.callbacks[event]
    } else {
      this.callbacks[event] = (this.callbacks[event] ?? []).filter((cb) => cb !== callback)
    }
    return this
  }

  trigger(event: string, ...args: any[]) {
    for (const cb of this.callbacks[event] ?? []) cb(...args)
    return this
  }

  dispose() {
    this.callbacks = {}
  }
}
