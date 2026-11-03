import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { clockOf } from '../../src/components/tram-z-stage/format'
import { SCENES } from '../../src/components/tram-z-stage/roster'
import { applyEvent, initialState } from '../../src/components/tram-z-stage/state'
import { buildSchedule, parseJsonl } from '../../src/components/tram-z-stage/timeline'

const { events } = parseJsonl(readFileSync(path.resolve(__dirname, '../../public/demo/events.jsonl'), 'utf8'))

describe('tram-z-stage timeline', () => {
  it('replays the sample day in 30 s with the per-scene durations', () => {
    const sch = buildSchedule(events)
    expect(sch.total).toBe(30000)
    expect(sch.scenes.map((s) => [s.scene, s.ms])).toEqual(SCENES.map((s) => [s.code, s.ms]))
  })

  it('keeps events in order, inside their scene, never on top of each other', () => {
    const { at, scenes } = buildSchedule(events)
    let scene = -1
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === 'scene') scene++
      const slot = scenes[scene]
      expect(at[i]).toBeGreaterThanOrEqual(slot.start)
      expect(at[i]).toBeLessThan(slot.start + slot.ms)
      if (i > 0 && events[i].type !== 'scene') expect(at[i] - at[i - 1]).toBeGreaterThan(20)
    }
  })

  it('prints the evening before from negative t', () => {
    expect(clockOf(-14400)).toBe('20:00')
    expect(clockOf(79200)).toBe('22:00')
  })
})

describe('tram-z-stage state', () => {
  const anchor = () => ({ x: 0, y: 0, side: 'map' as const, key: 'k' })
  const final = events.reduce((s, ev, i) => applyEvent(s, ev, i * 100, anchor), initialState())

  it('ends with the counters of the last metric line', () => {
    const lastMetric = [...events].reverse().find((e) => e.type === 'metric')
    expect(final.metrics).toMatchObject(lastMetric?.metrics ?? {})
  })

  it('stamps the banned listing and reads the 10% split 5/2/1/2', () => {
    expect(final.listings.some((l) => l.blocked)).toBe(true)
    expect(final.settlement?.feePct).toBeCloseTo(10)
    expect(final.settlement?.parts.map((p) => Math.round(p.pct))).toEqual([5, 2, 1, 2])
  })
})
