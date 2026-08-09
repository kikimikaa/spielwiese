import type { CueNote } from '../core/sound'
import { FANFARE_CUE, noteHz, WIN_CUE } from '../core/sound'

// Gentle master volume per note, and a tiny attack so notes don't click on.
const PEAK_GAIN = 0.18
const ATTACK_S = 0.01
const RELEASE_FLOOR = 0.0001
const WAVEFORM: OscillatorType = 'triangle'

/**
 * Board sound: an opt-in, per-device toggle plus playback of the synthesised
 * cues. Off by default (browsers block audio until a user gesture anyway —
 * toggling on is that gesture, so we unlock the audio context there).
 */
export function useSound() {
  const enabled = useCookie<boolean>('spielwiese-sound', { default: () => false, sameSite: 'lax' })
  let ctx: AudioContext | null = null

  function audioContext(): AudioContext | null {
    if (!import.meta.client) return null
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    return ctx
  }

  function play(cue: CueNote[]) {
    if (!enabled.value) return
    const ac = audioContext()
    if (!ac) return
    if (ac.state === 'suspended') void ac.resume()
    const now = ac.currentTime
    for (const note of cue) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = WAVEFORM
      osc.frequency.value = noteHz(note.semitones)
      const start = now + note.at
      const end = start + note.dur
      // A short attack up to the peak, then an exponential decay to near-silence.
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, start + ATTACK_S)
      gain.gain.exponentialRampToValueAtTime(RELEASE_FLOOR, end)
      osc.connect(gain).connect(ac.destination)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  }

  function toggle() {
    enabled.value = !enabled.value
    // Toggling on is a user gesture — unlock the audio context now so the first
    // real cue isn't swallowed by the browser's autoplay policy.
    if (enabled.value) void audioContext()?.resume()
  }

  return {
    enabled,
    toggle,
    playWin: () => play(WIN_CUE),
    playFanfare: () => play(FANFARE_CUE),
  }
}
