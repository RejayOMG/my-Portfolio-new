import { Howl, Howler } from 'howler'

export type SfxName =
  | 'click'
  | 'hover'
  | 'tick'
  | 'switch'
  | 'spiral'
  | 'list'
  | 'longclick'
  | 'close'
  | 'menu-home'
  | 'menu-about'
  | 'smiley1'
  | 'smiley2'
  | 'smiley3'
  | 'smiley4'

const SFX_SOURCES: Record<SfxName, string> = {
  click: '/sounds/click.ogg',
  hover: '/sounds/hover.ogg',
  tick: '/sounds/tick.ogg',
  switch: '/sounds/switch.ogg',
  spiral: '/sounds/spiral.ogg',
  list: '/sounds/list.ogg',
  longclick: '/sounds/longclick.ogg',
  close: '/sounds/close.ogg',
  'menu-home': '/sounds/menu/homelink.ogg',
  'menu-about': '/sounds/menu/aboutlink.ogg',
  smiley1: '/sounds/smiley/smiley1.ogg',
  smiley2: '/sounds/smiley/smiley2.ogg',
  smiley3: '/sounds/smiley/smiley3.ogg',
  smiley4: '/sounds/smiley/smiley4.ogg',
}

const VOLUMES: Partial<Record<SfxName, number>> = {
  hover: 0.35,
  tick: 0.25,
  click: 0.6,
}

/**
 * global sound system — a plain module singleton (client only).
 * unlocked by the intro gate, muted state driven by the pinia store.
 */
class AudioManager {
  private sfx = new Map<SfxName, Howl>()
  private ambient: Howl | null = null
  private unlocked = false
  private enabled = false // user chose "enter with sound"
  private muted = false
  private lastPlayed = new Map<SfxName, number>()

  /** create howls + resume audio context. called from a user gesture. */
  unlock(withSound: boolean) {
    if (this.unlocked) return
    this.unlocked = true
    this.enabled = withSound

    for (const [name, src] of Object.entries(SFX_SOURCES) as [SfxName, string][]) {
      this.sfx.set(
        name,
        new Howl({ src: [src], volume: VOLUMES[name] ?? 0.5, preload: true }),
      )
    }

    this.ambient = new Howl({
      src: ['/sounds/ambient.ogg'],
      loop: true,
      volume: 0,
      preload: true,
    })

    this.applyMute()

    if (withSound && !this.muted) this.startAmbient()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.applyMute()
    if (!this.ambient) return
    if (muted) {
      this.ambient.fade(this.ambient.volume() as number, 0, 400)
      window.setTimeout(() => this.ambient?.pause(), 450)
    } else if (this.enabled) {
      this.startAmbient()
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled && !this.muted) this.startAmbient()
  }

  private applyMute() {
    Howler.mute(this.muted || !this.enabled)
  }

  private startAmbient() {
    if (!this.ambient) return
    if (!this.ambient.playing()) this.ambient.play()
    this.ambient.fade(this.ambient.volume() as number, 0.12, 1200)
  }

  /** play a one-shot effect, throttled per-sound to avoid machine-gunning */
  play(name: SfxName, throttleMs = 40, rate = 1) {
    if (!this.unlocked || !this.enabled || this.muted) return
    const now = performance.now()
    const last = this.lastPlayed.get(name) ?? 0
    if (now - last < throttleMs) return
    this.lastPlayed.set(name, now)
    const howl = this.sfx.get(name)
    if (!howl) return
    const id = howl.play()
    if (rate !== 1) howl.rate(rate, id)
  }

  /** random smiley blip — returns the index used (1-4) */
  playSmiley(): number {
    const idx = 1 + Math.floor(Math.random() * 4)
    this.play(`smiley${idx}` as SfxName)
    return idx
  }
}

export const audio = new AudioManager()
