/**
 * What the HTML layer shows, as a pure reducer over events. `now` is the playhead in ms, so pausing freezes
 * bubbles and lights; overlays carry an `until` and are pruned once the playhead passes it.
 */
import { AGENTS, AGENT_CODES, actorName, isAgent } from './roster'
import type { Metrics, StageEvent } from './types'

export const BUBBLE_MS = 2500
export const BEAM_MS = 900
export const FLIGHT_MS = 900
export const TICK_MS = 1000
export const ACTIVE_MS = 1400
const LOG_MAX = 500

export interface Pt {
  x: number
  y: number
}

export interface AgentState {
  code: string
  provider: 'claude' | 'meta'
  model: string | null
  ms: number | null
  tool: string | null
  summary: string | null
  ok: boolean
  activeUntil: number
  actions: number
}

export type BubbleKind = 'say' | 'handoff' | 'request' | 'approve' | 'warn' | 'block' | 'error'

export interface Bubble {
  id: string
  key: string
  kind: BubbleKind
  who: string
  to?: string
  text: string
  x: number
  y: number
  side: 'card' | 'map'
  until: number
}

export interface Beam {
  id: string
  from: number
  to: number
  until: number
}

export interface Flight {
  id: string
  from: Pt
  to: Pt
  toKey: string
  label: string
  until: number
}

export interface Tick {
  id: string
  x: number
  y: number
  until: number
}

export interface Listing {
  key: string
  title: string
  verdict: 'pass' | 'warn' | 'block' | null
  verdictText: string | null
  note: string | null
  waiting: boolean
  approvedText: string | null
  live: boolean
  blocked: boolean
  reason: string | null
  stampAt: number
}

export interface SplitPart {
  key: string
  label: string
  vnd: number
  pct: number
}

export interface Settlement {
  amount: number
  fee: number
  feePct: number
  parts: SplitPart[]
  supplierReceives: number
}

export interface LogLine {
  id: string
  clock: string
  type: string
  who: string
  text: string
}

export interface StageState {
  mode: 'mock' | 'live' | null
  scene: string | null
  metrics: Metrics
  agents: Record<string, AgentState>
  bubbles: Bubble[]
  beams: Beam[]
  flights: Flight[]
  ticks: Tick[]
  listings: Listing[]
  settlement: Settlement | null
  log: LogLine[]
  seen: number
}

export type Anchor = (actor: string) => (Pt & { side: 'card' | 'map'; key: string }) | null

export const ZERO_METRICS: Metrics = {
  orders: 0,
  gmv_vnd: 0,
  agent_actions: 0,
  agent_cost_usd: 0,
  agent_cost_vnd: 0,
  human_approvals: 0,
  human_minutes: 0,
  blocked: 0,
}

export function initialState(): StageState {
  const agents: Record<string, AgentState> = {}
  for (const a of AGENTS) {
    agents[a.code] = {
      code: a.code,
      provider: a.provider,
      model: null,
      ms: null,
      tool: null,
      summary: null,
      ok: true,
      activeUntil: -1,
      actions: 0,
    }
  }
  return {
    mode: null,
    scene: null,
    metrics: { ...ZERO_METRICS },
    agents,
    bubbles: [],
    beams: [],
    flights: [],
    ticks: [],
    listings: [],
    settlement: null,
    log: [],
    seen: 0,
  }
}

const SPLIT_LABELS: [string, string][] = [
  ['tram', 'Trạm Z'],
  ['kho_giao', 'Kho & giao'],
  ['gioi_thieu', 'Người giới thiệu'],
  ['cho_z', 'Chợ Z'],
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settlementFrom(totals: any): Settlement | null {
  if (!totals || typeof totals !== 'object') return null
  const amount = Number(totals.amount_vnd)
  const fee = Number(totals.fee_vnd)
  if (!amount || !Number.isFinite(fee)) return null
  const parts = SPLIT_LABELS.filter(([k]) => typeof totals[k] === 'number').map(([key, label]) => ({
    key,
    label,
    vnd: Number(totals[key]),
    pct: (Number(totals[key]) / amount) * 100,
  }))
  return {
    amount,
    fee,
    feePct: (fee / amount) * 100,
    parts,
    supplierReceives: Number(totals.supplier_receives_vnd ?? amount - fee),
  }
}

function logLine(ev: StageEvent): LogLine {
  let who = ev.from ? (ev.to ? `${ev.from}→${ev.to}` : ev.from) : ''
  let text = ev.text ?? ''
  if (ev.type === 'tool' && ev.tool) text = `${ev.tool.name}: ${ev.tool.output_summary}`
  if (ev.type === 'move') who = `${ev.from ?? ''}→${ev.loc ?? ''}`
  if (ev.type === 'scene') text = ev.scene ?? ''
  if (ev.type === 'metric' && ev.metrics) {
    const m = ev.metrics
    text = `đơn ${m.orders ?? 0} · tiền ${m.gmv_vnd ?? 0} · việc ${m.agent_actions ?? 0} · duyệt ${m.human_approvals ?? 0} · ${m.agent_cost_vnd ?? 0} đ`
  }
  return { id: ev.id, clock: ev.clock, type: ev.type, who, text }
}

function findListing(listings: Listing[], run?: string, pred?: (l: Listing) => boolean): number {
  if (run) {
    for (let i = listings.length - 1; i >= 0; i--) {
      if (run === listings[i].key || run.endsWith(listings[i].key) || run.includes(listings[i].key)) return i
    }
  }
  for (let i = listings.length - 1; i >= 0; i--) if (!pred || pred(listings[i])) return i
  return -1
}

const verdictOf = (summary: string): Listing['verdict'] => {
  const s = summary.toLowerCase()
  if (s.startsWith('block')) return 'block'
  if (s.startsWith('warn')) return 'warn'
  if (s.startsWith('pass')) return 'pass'
  return null
}

export function applyEvent(prev: StageState, ev: StageEvent, now: number, anchor: Anchor): StageState {
  const s: StageState = { ...prev, seen: prev.seen + 1 }
  if (!s.mode && ev.mode) s.mode = ev.mode
  s.log = [...prev.log, logLine(ev)]
  if (s.log.length > LOG_MAX) s.log = s.log.slice(s.log.length - LOG_MAX)

  // agent cards: active light, model + latency, last tool, action count
  const touch = (code: string | undefined, update?: (a: AgentState) => void) => {
    if (!code || !AGENT_CODES.includes(code)) return
    const a: AgentState = { ...s.agents[code] }
    a.activeUntil = now + ACTIVE_MS
    if (update) update(a)
    s.agents = { ...s.agents, [code]: a }
  }
  if (isAgent(ev.from)) {
    touch(ev.from, (a) => {
      if (ev.usage) {
        a.provider = ev.usage.provider === 'meta' ? 'meta' : 'claude'
        a.model = ev.usage.model || a.model
        a.ms = typeof ev.usage.ms === 'number' && ev.usage.ms > 0 ? ev.usage.ms : a.ms
      }
      if (ev.type === 'tool' && ev.tool) {
        a.tool = ev.tool.name
        a.summary = ev.tool.output_summary
        a.ok = ev.tool.ok
      }
      if (ev.type === 'tool' || ev.type === 'say') a.actions += 1
    })
  }
  if (isAgent(ev.to) && ev.type !== 'approve') touch(ev.to)

  const addBubble = (who: string | undefined, kind: BubbleKind) => {
    if (!who || !ev.text) return
    const at = anchor(who)
    if (!at) return
    const b: Bubble = {
      id: ev.id,
      key: at.key,
      kind,
      who,
      to: ev.to,
      text: ev.text,
      x: at.x,
      y: at.y,
      side: at.side,
      until: now + BUBBLE_MS,
    }
    s.bubbles = [...s.bubbles.filter((x) => x.key !== at.key), b]
  }

  const blocked = !!ev.detail?.blocked
  const markBlocked = () => {
    const i = findListing(s.listings, ev.detail?.listing_run, (l) => l.verdict === 'block')
    if (i < 0) return
    const l = { ...s.listings[i], blocked: true, reason: ev.detail?.reason ?? s.listings[i].reason, stampAt: now }
    s.listings = s.listings.map((x, k) => (k === i ? l : x))
  }

  switch (ev.type) {
    case 'scene':
      s.scene = ev.scene ?? s.scene
      break
    case 'metric':
      s.metrics = { ...s.metrics, ...(ev.metrics as Metrics) }
      break
    case 'say': {
      const kind: BubbleKind = blocked ? 'block' : ev.detail?.verdict === 'warn' ? 'warn' : 'say'
      addBubble(ev.from, kind)
      if (blocked) markBlocked()
      if (ev.from === 'ag_kiem_chung' && (ev.detail?.verdict === 'warn' || ev.detail?.check)) {
        const i = findListing(s.listings, ev.detail?.listing_run, (l) => l.verdict === 'warn')
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, note: ev.text ?? x.note } : x))
      }
      if (ev.from === 'ag_dang_ban' && ev.detail?.status === 'ready') {
        const i = findListing(s.listings, ev.detail?.listing_run)
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, live: true } : x))
      }
      // A household paying at the station: count its orders and money at once (the payment line is the source;
      // the next metric line carries the same running totals).
      if (ev.detail?.payment) {
        const paid = Array.isArray(ev.detail.orders) ? ev.detail.orders.length : 0
        s.metrics = {
          ...s.metrics,
          orders: (s.metrics.orders ?? 0) + paid,
          gmv_vnd: (s.metrics.gmv_vnd ?? 0) + Number(ev.detail.paid_vnd ?? 0),
        }
      }
      break
    }
    case 'handoff': {
      addBubble(ev.from, 'handoff')
      const a = AGENT_CODES.indexOf(ev.from ?? '')
      const b = AGENT_CODES.indexOf(ev.to ?? '')
      if (a >= 0 && b >= 0 && a !== b) s.beams = [...s.beams, { id: ev.id, from: a, to: b, until: now + BEAM_MS }]
      break
    }
    case 'approve_request': {
      addBubble(ev.from, 'request')
      const from = ev.from ? anchor(ev.from) : null
      const to = ev.to ? anchor(ev.to) : null
      if (from && to) {
        const kind = String(ev.detail?.kind ?? '')
        s.flights = [...s.flights, { id: ev.id, from, to, toKey: to.key, label: kind, until: now + FLIGHT_MS }]
      }
      if (ev.detail?.kind === 'duyet_listing') {
        const i = findListing(s.listings, ev.detail?.listing_run, (l) => l.verdict === 'warn')
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, waiting: true } : x))
      }
      const st = settlementFrom(ev.detail?.totals)
      if (st) s.settlement = st
      break
    }
    case 'approve': {
      addBubble(ev.from, 'approve')
      const at = ev.from ? anchor(ev.from) : null
      if (at) {
        s.ticks = [...s.ticks, { id: ev.id, x: at.x, y: at.y, until: now + TICK_MS }]
        // the yellow card has arrived: it gives way to the tick
        if (s.flights.some((f) => f.toKey === at.key)) s.flights = s.flights.filter((f) => f.toKey !== at.key)
      }
      if (ev.detail?.kind === 'duyet_listing') {
        const i = findListing(s.listings, ev.detail?.listing_run, (l) => l.waiting)
        if (i >= 0)
          s.listings = s.listings.map((x, k) =>
            k === i ? { ...x, waiting: false, approvedText: ev.text ?? 'Đã duyệt' } : x,
          )
      }
      break
    }
    case 'error':
      addBubble(ev.from, blocked ? 'block' : 'error')
      if (blocked) markBlocked()
      break
    case 'tool': {
      const name = ev.tool?.name ?? ''
      const key = String(ev.detail?.sample ?? '')
      if (name === 'choz_listing' && ev.tool) {
        const l: Listing = {
          key: key || ev.id,
          title: ev.tool.output_summary,
          verdict: null,
          verdictText: null,
          note: null,
          waiting: false,
          approvedText: null,
          live: false,
          blocked: false,
          reason: null,
          stampAt: -1,
        }
        s.listings = [...s.listings.filter((x) => x.key !== l.key), l]
      }
      if (name === 'verify_listing' && ev.tool) {
        const i = findListing(s.listings, key)
        if (i >= 0) {
          const v = verdictOf(ev.tool.output_summary)
          s.listings = s.listings.map((x, k) => (k === i ? { ...x, verdict: v, verdictText: ev.tool!.output_summary } : x))
        }
      }
      if (name === 'settlement') {
        const st = settlementFrom(ev.detail?.output?.totals)
        if (st) s.settlement = st
      }
      break
    }
    default:
      break
  }
  return s
}

/** Drop overlays the playhead has passed; returns the same object when nothing changed. */
export function prune(s: StageState, now: number): StageState {
  const keep = <T extends { until: number }>(xs: T[]) => (xs.some((x) => x.until <= now) ? xs.filter((x) => x.until > now) : xs)
  const bubbles = keep(s.bubbles)
  const beams = keep(s.beams)
  const flights = keep(s.flights)
  const ticks = keep(s.ticks)
  if (bubbles === s.bubbles && beams === s.beams && flights === s.flights && ticks === s.ticks) return s
  return { ...s, bubbles, beams, flights, ticks }
}

export const speakerLabel = (who: string, to?: string) => (to ? `${actorName(who)} → ${actorName(to)}` : actorName(who))
