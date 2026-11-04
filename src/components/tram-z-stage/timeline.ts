/**
 * Replay timing. 26 simulated hours play scene by scene: each scene gets its own duration and its events are
 * spread over it by simulated time, mixed half-and-half with an even spacing so bursts of events at the same
 * minute stay readable and nothing is lost. After each scene the stage holds on a conclusion card for CARD_MS.
 * The 30-second version (?brief=1) uses the shorter durations and no cards.
 */
import { SCENES } from './roster'
import type { StageEvent } from './types'

export const DEFAULT_SCENE_MS = 4000
/** How long each scene's conclusion card stays on screen. */
export const CARD_MS = 5000
/** ?pace=slow, for a presenter talking over the stage: longer scenes, longer cards. */
export const SLOW_PACE = { mult: 1.6, cardMs: 8000 }
/** Live mode: never fire two events closer than this on stage. */
export const LIVE_GAP_MS = 180

export interface SceneSlot {
  scene: string
  /** when the scene's events start */
  start: number
  /** ms of play (events) */
  ms: number
  /** ms of the conclusion card after the play (0 in brief mode) */
  hold: number
}

export interface Schedule {
  /** on-stage ms for each event, same order as the input */
  at: number[]
  scenes: SceneSlot[]
  total: number
  brief: boolean
  pace: 'normal' | 'slow'
}

export interface ScheduleOptions {
  /** the 30-second version: short scenes, no conclusion cards */
  brief?: boolean
  /** conclusion card hold per scene (default CARD_MS, or SLOW_PACE.cardMs when pace is slow) */
  cardMs?: number
  /** slow: every scene ×SLOW_PACE.mult and cards of SLOW_PACE.cardMs (ignored in brief mode) */
  pace?: 'normal' | 'slow'
}

const sceneMs = (code: string, brief: boolean) => {
  const s = SCENES.find((x) => x.code === code)
  if (!s) return DEFAULT_SCENE_MS
  return brief ? s.briefMs : s.ms
}

export function buildSchedule(events: StageEvent[], opts: ScheduleOptions = {}): Schedule {
  const brief = !!opts.brief
  const slow = !brief && opts.pace === 'slow'
  const hold = brief ? 0 : (opts.cardMs ?? (slow ? SLOW_PACE.cardMs : CARD_MS))
  const at: number[] = new Array(events.length).fill(0)
  const scenes: SceneSlot[] = []

  // Split into groups: a group starts at a scene event (events before the first scene join the first group).
  const groups: { scene: string; idx: number[] }[] = []
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type === 'scene' && ev.scene) groups.push({ scene: ev.scene, idx: [i] })
    else if (groups.length === 0) groups.push({ scene: SCENES[0].code, idx: [i] })
    else groups[groups.length - 1].idx.push(i)
  }

  let cursor = 0
  for (const g of groups) {
    const ms = Math.round(sceneMs(g.scene, brief) * (slow ? SLOW_PACE.mult : 1))
    scenes.push({ scene: g.scene, start: cursor, ms, hold })
    const first = events[g.idx[0]]
    const rest = first.type === 'scene' ? g.idx.slice(1) : g.idx
    if (first.type === 'scene') at[g.idx[0]] = cursor
    const n = rest.length
    if (n > 0) {
      const lead = Math.min(250, ms * 0.06)
      const span = ms * 0.88 - lead
      const t0 = first.t
      const t1 = events[rest[n - 1]].t
      const range = t1 - t0 || 1
      rest.forEach((ei, k) => {
        const prop = Math.min(1, Math.max(0, (events[ei].t - t0) / range))
        const even = n > 1 ? k / (n - 1) : 0
        at[ei] = cursor + lead + span * (0.5 * prop + 0.5 * even)
      })
    }
    cursor += ms + hold
  }
  return { at, scenes, total: cursor, brief, pace: slow ? 'slow' : 'normal' }
}

/** The scene slot whose play or hold contains the playhead, and whether the playhead is in its hold. */
export function slotAt(scenes: SceneSlot[], playhead: number): { slot: SceneSlot; index: number; holding: boolean } | null {
  for (let i = scenes.length - 1; i >= 0; i--) {
    const s = scenes[i]
    if (playhead >= s.start) return { slot: s, index: i, holding: s.hold > 0 && playhead >= s.start + s.ms }
  }
  return null
}

/** Simulated time shown at a playhead, interpolated between the events around it (the clock runs, it does not jump). */
export function simTimeAt(events: StageEvent[], at: number[], cursor: number, playhead: number): number | null {
  if (events.length === 0) return null
  if (cursor <= 0) return events[0].t
  const i = cursor - 1
  const next = cursor < events.length ? cursor : -1
  if (next < 0) return events[i].t
  const a = at[i]
  const b = at[next]
  if (b <= a) return events[i].t
  const k = Math.min(1, Math.max(0, (playhead - a) / (b - a)))
  return events[i].t + (events[next].t - events[i].t) * k
}

/** Parse JSON Lines; bad lines are skipped and counted. Sorted by t (stable), never by wall. */
export function parseJsonl(text: string): { events: StageEvent[]; bad: number } {
  const events: StageEvent[] = []
  let bad = 0
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim()
    if (!s) continue
    try {
      const ev = JSON.parse(s) as StageEvent
      if (ev && typeof ev.t === 'number' && typeof ev.type === 'string') events.push(ev)
      else bad++
    } catch {
      bad++
    }
  }
  const sorted = events.map((e, i) => ({ e, i })).sort((a, b) => a.e.t - b.e.t || a.i - b.i)
  return { events: sorted.map((x) => x.e), bad }
}
