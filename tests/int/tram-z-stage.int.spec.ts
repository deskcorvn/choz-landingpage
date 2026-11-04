import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { conclusionOf } from '../../src/components/tram-z-stage/conclusion'
import { fmtVnd } from '../../src/components/tram-z-stage/format'
import { RATES_LINE, aboutTime, cellAmount, centralLines, finalColumns, sourceLabel, viDecimal, viewNumbers } from '../../src/components/tram-z-stage/FinalScreen'
import { clockOf } from '../../src/components/tram-z-stage/format'
import { SCENES, TOOL_LABELS } from '../../src/components/tram-z-stage/roster'
import { applyEvent, initialState } from '../../src/components/tram-z-stage/state'
import { CARD_MS, SLOW_PACE, buildSchedule, parseJsonl, slotAt } from '../../src/components/tram-z-stage/timeline'
import type { Headcount } from '../../src/components/tram-z-stage/types'

const { events } = parseJsonl(readFileSync(path.resolve(__dirname, '../../public/demo/events.jsonl'), 'utf8'))
const headcount = JSON.parse(readFileSync(path.resolve(__dirname, '../../public/demo/headcount.json'), 'utf8')) as Headcount

describe('tram-z-stage timeline', () => {
  it('plays each scene then holds on its conclusion card', () => {
    const sch = buildSchedule(events)
    const play = SCENES.reduce((n, s) => n + s.ms, 0)
    expect(sch.total).toBe(play + SCENES.length * CARD_MS)
    expect(sch.scenes.map((s) => [s.scene, s.ms, s.hold])).toEqual(SCENES.map((s) => [s.code, s.ms, CARD_MS]))
    const first = sch.scenes[0]
    expect(slotAt(sch.scenes, first.start + first.ms - 1)?.holding).toBe(false)
    expect(slotAt(sch.scenes, first.start + first.ms + 1)?.holding).toBe(true)
    expect(slotAt(sch.scenes, sch.scenes[1].start)?.slot.scene).toBe('dang_ban')
  })

  it('slow pace stretches scenes and holds cards for 8 s, for a presenter', () => {
    const sch = buildSchedule(events, { pace: 'slow' })
    const play = SCENES.reduce((n, s) => n + Math.round(s.ms * SLOW_PACE.mult), 0)
    expect(sch.pace).toBe('slow')
    expect(sch.total).toBe(play + SCENES.length * SLOW_PACE.cardMs)
    expect(buildSchedule(events, { pace: 'slow', brief: true }).total).toBe(30000)
  })

  it('brief mode is the 30-second version without cards', () => {
    const sch = buildSchedule(events, { brief: true })
    expect(sch.total).toBe(30000)
    expect(sch.scenes.every((s) => s.hold === 0)).toBe(true)
    expect(slotAt(sch.scenes, 29000)?.holding).toBe(false)
  })

  it('keeps events in order, inside their scene play, never on top of each other', () => {
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
    // the agent cards' own counts add up to the metric (the closing read-out is not agent work)
    const perCard = Object.values(final.agents).reduce((n, a) => n + a.actions, 0)
    expect(perCard).toBe(lastMetric?.metrics?.agent_actions)
    const closing = [...events].reverse().find((e) => e.type === 'say' && e.detail?.auto)
    expect(closing?.text).toContain(String(lastMetric?.metrics?.agent_actions))
  })

  it('stamps the refused listing, keeps the OCOP badge and reads the 10% split 5/2/1/2', () => {
    expect(final.listings.some((l) => l.blocked)).toBe(true)
    expect(final.listings.some((l) => l.ocop)).toBe(true)
    expect(final.settlement?.feePct).toBeCloseTo(10)
    expect(final.settlement?.parts.map((p) => Math.round(p.pct))).toEqual([5, 2, 1, 2])
    expect(final.supplierSettlements.length).toBe(5)
  })

  it('builds the boards of every scene from the events', () => {
    expect(final.baskets?.baskets).toBe(30)
    expect(final.picklist?.orders).toBe(30)
    expect(final.picklist?.bySupplier.length).toBeGreaterThan(0)
    expect(final.lots.length).toBe(6)
    expect(final.lots.some((l) => l.replaced)).toBe(true)
    expect(final.route?.legs.some((l) => l.dropBags === 30)).toBe(true)
    expect(final.route?.parcels.length).toBe(2)
    expect(final.route?.laundry.length).toBe(3)
    expect(final.route?.legs.some((l) => (l.bringBackParcels ?? 0) > 0 && (l.bringBack ?? 0) > 0)).toBe(true)
    expect(final.houseBaskets.map((h) => h.house)).toEqual([1, 2, 3, 4, 5])
    expect(final.houseBaskets.reduce((n, h) => n + h.households, 0)).toBe(30)
    expect(final.listings.filter((l) => l.label).length).toBeGreaterThanOrEqual(1)
    expect(final.route?.at).toBe(final.route!.legs.length - 1)
    expect(final.payments.reduce((n, p) => n + p.orders, 0)).toBe(30)
    expect(final.thread.map((t) => t.kind)).toEqual(['customer', 'tool', 'tool', 'request', 'approve', 'answer'])
    expect(final.approvals.filter((a) => a.answer).length).toBe(final.approvals.length)
  })

  it('keeps a hand-over card for each handoff between two agents', () => {
    const handoffs = events.filter((e) => e.type === 'handoff')
    const at = events.indexOf(handoffs[0])
    const s = events.slice(0, at + 1).reduce((acc, ev, i) => applyEvent(acc, ev, i * 100, anchor), initialState())
    expect(s.handoffs.length).toBe(1)
    expect(s.handoffs[0].from).toBe(handoffs[0].from)
  })

  it('has a Vietnamese label for every tool the agents used', () => {
    const tools = new Set(events.filter((e) => e.type === 'tool').map((e) => e.tool!.name))
    for (const t of tools) expect(TOOL_LABELS[t], t).toBeTruthy()
  })
})

describe('tram-z-stage conclusions', () => {
  it('writes a conclusion card for every scene, with numbers from the events', () => {
    for (const s of SCENES) {
      const c = conclusionOf(s.code, events)
      expect(c, s.code).not.toBeNull()
      expect(c!.title.length).toBeGreaterThan(10)
      expect(c!.steps.length).toBeGreaterThan(0)
      expect(c!.numbers.length).toBeGreaterThan(0)
    }
    expect(conclusionOf('dat_gio', events)!.numbers[0]).toEqual({ label: 'Giỏ đặt', value: '30' })
    expect(conclusionOf('doi_soat', events)!.numbers[1].value).toBe('322.800 đ')
    expect(conclusionOf('ra_tram', events)!.numbers[1].value).toBe('30')
    expect(conclusionOf('ra_tram', events)!.summary).toMatch(/đi đầy, về không rỗng.*30 túi.*3 túi giặt \+ 2 bưu phẩm/)
    expect(conclusionOf('dat_gio', events)!.summary).toMatch(/30 Giỏ của 30 hộ → 1 phiếu gom, 11 mặt hàng, 5 nhà cung cấp; thiếu 2 cải ngọt → thay rau muống, bạn trực Trạm Z duyệt, 2 hộ được báo/)
    for (const s of SCENES) if (s.code !== 'tong_ket') expect(conclusionOf(s.code, events)!.numbers.length).toBeLessThanOrEqual(5)
    expect(conclusionOf('tong_ket', events)!.numbers[0].value).toBe('30')
    expect(conclusionOf('dang_ban', events)!.approvals.length).toBe(1)
  })

  it('uses no English jargon in what the jury reads', () => {
    for (const s of SCENES) {
      const c = conclusionOf(s.code, events)!
      const text = [c.title, c.summary, ...c.steps.map((x) => x.did), ...c.numbers.map((n) => n.label)].join(' ')
      expect(text).not.toMatch(/\b(claim|picklist|handoff|tool|mock)\b/i)
    }
  })
})

describe('tram-z-stage final screen', () => {
  it('lists people by role and money on both sides, from headcount.json', () => {
    for (const key of ['tram_1', 'tram_50'] as const) {
      const b = headcount[key]
      const { manual, agents, saving } = finalColumns(b)
      expect(manual.roles.length).toBeGreaterThan(0)
      expect(agents.roles.length).toBeGreaterThan(0)
      expect(manual.peopleCost).toBe(b.roles_manual!.reduce((n, r) => n + r.cost_vnd_month, 0))
      expect(agents.total).toBe(agents.peopleCost + agents.agentCost)
      expect(saving).toBe(manual.total - agents.total)
      expect(agents.agents).toBe(6)
      // the office / physical split is in the file and adds up to the totals
      expect(b.office!.manual_people + b.physical!.people).toBeCloseTo(b.manual_people, 1)
      expect(b.office!.with_agents_people + b.physical!.people).toBeCloseTo(b.with_agents_people, 1)
      expect(b.office!.with_agents_minutes).toBeLessThan(b.office!.manual_minutes)
    }
  })

  it('shows the honest view: station minutes, whole people, money from view only', () => {
    const v = headcount.view!
    expect(v).toBeTruthy()
    const n = viewNumbers(v)
    // no fractional people anywhere on the two pages
    for (const p of n.people) expect(Number.isInteger(p)).toBe(true)
    expect(n.manualPeople).toMatch(/^\d+ người$/)
    expect(n.agentPeople).toMatch(/^\d+ người \+ 6 agent$/)
    const c = v.central_50
    // headline people are full-time people; hourly work and the hired van are counted in hours and trips
    const ft = (rows: typeof c.manual) => rows.filter((r) => r.pay?.startsWith('toàn thời gian')).reduce((x, r) => x + (r.people ?? 0), 0)
    expect(c.manual_people).toBe(ft(c.manual))
    expect(c.with_agents_people).toBe(ft(c.with_agents))
    expect(c.with_agents_cost_vnd_month).toBe(c.with_agents_staff_cost_vnd_month + c.agents_cost_vnd_month)
    expect(c.saving_vnd_month).toBeCloseTo(c.manual_cost_vnd_month - c.with_agents_cost_vnd_month, 0)
    // the station is the same person on both sides: minutes, no wage
    expect(v.station.with_agents_minutes_day).toBeLessThan(v.station.manual_minutes_day)
    expect(v.station.rows.filter((r) => r.kind === 'tay_chan').every((r) => r.manual_min === r.with_agent_min)).toBe(true)
    expect(aboutTime(119)).toBe('khoảng 2 giờ')
    expect(aboutTime(42.5)).toBe('43 phút')
  })

  it('groups the 50-station rows by kind; physical rows are identical on both sides', () => {
    const v = headcount.view!
    const c = v.central_50
    const groups = centralLines(c)
    expect(groups.map((g) => g.kind)).toEqual(['van_phong', 'tay_chan', 'quan_ly'])
    expect(groups[1].title).toBe('Việc tay chân — giữ nguyên ở cả hai bên')
    for (const l of groups[1].lines) {
      expect(l.same).toBe(true)
      expect(l.manual!.people).toBe(l.agent!.people)
      expect(l.manual!.cost_vnd_month).toBe(l.agent!.cost_vnd_month)
    }
    // every row of the file appears exactly once, with whole people
    const shown = groups.flatMap((g) => g.lines)
    expect(new Set(shown.map((l) => l.role)).size).toBe(new Set([...c.manual, ...c.with_agents].map((r) => r.role)).size)
    for (const l of shown) for (const r of [l.manual, l.agent]) if (r && r.people !== null) expect(Number.isInteger(r.people)).toBe(true)
    // office headline from the file
    const n = viewNumbers(v)
    expect(n.officeManual).toBe(`${c.office_people_manual} người`)
    expect(n.officeAgent).toBe(`${c.office_people_with_agents} người + 6 agent`)
    expect(c.office_people_manual).toBe(c.manual.filter((r) => r.kind === 'van_phong').reduce((x, r) => x + (r.people ?? 0), 0))
    expect(n.agentNote).toContain('đo từ các lượt chạy thật 30, 150, 300 đơn')
    expect(c.agent_cost_model!.fit_points.length).toBeGreaterThanOrEqual(1)
    expect(RATES_LINE).toContain('theo giờ 30.000 đ')
    expect(RATES_LINE).toContain('toàn thời gian có bảo hiểm')
    expect(v.assumptions!.every((a) => a.what && a.value && a.source)).toBe(true)
    expect(sourceLabel('ASSUMED, chờ Chợ Z')).toBe('giả định, chờ Chợ Z xác nhận')
    expect(viDecimal('tài xế 12.5 tr; × 1.318')).toBe('tài xế 12,5 tr; × 1,318')
  })

  it('shows the fee pool, hours for hourly work, and whether the agent model fits inside the fee', () => {
    const v = headcount.view!
    const c = v.central_50
    const n = viewNumbers(v)
    expect(c.fee_pool!.vnd_month).toBe(180_000_000)
    expect(n.feeLine).toBe(`${c.fee_pool!.text}: ${fmtVnd(c.fee_pool!.vnd_month)}/tháng`)
    expect(n.within).toBe(c.with_agents_cost_vnd_month <= c.fee_pool!.vnd_month)
    expect(n.overshoot).toBe(fmtVnd(c.manual_cost_vnd_month - c.fee_pool!.vnd_month))
    expect(n.manualPeopleFT).toBe(`${c.manual_people} người toàn thời gian`)
    const hourly = c.with_agents.filter((r) => r.pay?.startsWith('theo giờ'))
    expect(hourly.length).toBeGreaterThan(0)
    for (const r of hourly) expect(cellAmount(r)).toMatch(/giờ\/ngày$/)
    const van = c.with_agents.find((r) => r.pay?.startsWith('thuê'))!
    expect(cellAmount(van)).toBe('theo chuyến')
    expect(c.managers).toEqual({ manual: 4, with_agents: 2 })
    expect(v.assumptions!.length).toBeGreaterThanOrEqual(11)
  })
})
