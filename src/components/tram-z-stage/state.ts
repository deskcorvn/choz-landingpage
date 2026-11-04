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
export const HANDOFF_CARD_MS = 2600
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
  /** honesty label under the text ("giọng đọc tổng hợp", "ảnh minh họa") */
  label?: string
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

/** A hand-over between two agents, shown as a card over the map while the beam travels. */
export interface HandoffCard {
  id: string
  from: string
  to: string
  text: string
  until: number
}

export interface Listing {
  key: string
  title: string
  ocop: string | null
  /** honesty label from the supplier's say (synthetic voice, drawn photo) */
  label: string | null
  verdict: 'pass' | 'warn' | 'block' | null
  verdictText: string | null
  note: string | null
  waiting: boolean
  approvedText: string | null
  live: boolean
  seconds: string | null
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

export interface SupplierSettlement {
  supplier: string
  amount: number
  fee: number
  receives: number
}

export interface LogLine {
  id: string
  clock: string
  type: string
  who: string
  text: string
}

/** dat_gio: the baskets booked and the picklist they become. */
export interface BasketBoard {
  baskets: number
  byPrice: { price: number; count: number }[]
  total: number
  extras: number
}

export interface PicklistItem {
  sku: string
  name: string
  qty: number
  unit: string
}

export interface Picklist {
  orders: number
  items: number
  bySupplier: { supplier: string; items: PicklistItem[] }[]
  short: { name: string; need: number; stock: number; missing: number; suggest: string | null; refund: number }[]
}

export interface Substitution {
  sku: string
  alt: string
  orders: { order: string; household: string; total: number }[]
}

/** gom_kho: one lot at the warehouse, latest check result. */
export interface Lot {
  key: string
  supplier: string
  item: string
  label: string
  tempC: number | null
  expiry: string
  qty: number
  result: 'đạt' | 'loại'
  reasons: string[]
  replaced: boolean
}

/** ra_tram: the van's plan. */
export interface RouteLeg {
  from: string
  to: string
  arrive: string
  dropBags?: number
  station?: string
  pickLaundry?: number
  pickParcels?: number
  bringBack?: number
  bringBackParcels?: number
}

export interface Route {
  depart: string
  bags: number
  stations: number
  laundry: string[]
  parcels: string[]
  /** the return trip in words, from plan_route */
  returnTrip: string
  legs: RouteLeg[]
  /** index of the leg the van is on (from xe1 move events) */
  at: number
}

/** dat_gio: one house's baskets, from the household bubbles before the picklist exists. */
export interface HouseBasket {
  id: string
  house: number
  households: number
  text: string
}

/** nhan_hang: one house's visit to the station. */
export interface Payment {
  id: string
  house: number
  households: number
  orders: number
  paid: number
}

export interface ThreadLine {
  id: string
  who: string
  kind: 'customer' | 'agent' | 'request' | 'approve' | 'answer' | 'tool'
  text: string
}

export interface Approval {
  id: string
  scene: string | null
  kind: string
  by: string
  request: string
  answer: string | null
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
  handoffs: HandoffCard[]
  listings: Listing[]
  /** OCOP mark announced by the supplier for a listing key, before the listing tool creates it */
  ocop: Record<string, string>
  settlement: Settlement | null
  supplierSettlements: SupplierSettlement[]
  baskets: BasketBoard | null
  houseBaskets: HouseBasket[]
  picklist: Picklist | null
  substitution: Substitution | null
  householdNotes: { id: string; to: string; text: string }[]
  /** honesty labels announced with a listing key, before the listing tool creates the card */
  labels: Record<string, string>
  lots: Lot[]
  route: Route | null
  payments: Payment[]
  thread: ThreadLine[]
  approvals: Approval[]
  /** the last actor that did something (flow strip) */
  lastActor: string | null
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
    handoffs: [],
    listings: [],
    ocop: {},
    settlement: null,
    supplierSettlements: [],
    baskets: null,
    houseBaskets: [],
    picklist: null,
    substitution: null,
    householdNotes: [],
    labels: {},
    lots: [],
    route: null,
    payments: [],
    thread: [],
    approvals: [],
    lastActor: null,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function picklistFrom(p: any): Picklist | null {
  if (!p || typeof p !== 'object' || !p.by_supplier) return null
  const bySupplier = Object.entries(p.by_supplier as Record<string, PicklistItem[]>).map(([supplier, items]) => ({
    supplier,
    items: (items ?? []).map((x) => ({ sku: String(x.sku), name: String(x.name), qty: Number(x.qty), unit: String(x.unit ?? '') })),
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const short = ((p.short as any[]) ?? []).map((x) => ({
    name: String(x.name),
    need: Number(x.need),
    stock: Number(x.stock),
    missing: Number(x.missing),
    suggest: x.suggest?.name ? String(x.suggest.name) : null,
    refund: Number(x.suggest?.refund_vnd_each ?? 0),
  }))
  return { orders: Number(p.orders ?? 0), items: Number(p.items ?? bySupplier.reduce((n, s) => n + s.items.length, 0)), bySupplier, short }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function routeFrom(o: any): Route | null {
  if (!o || !Array.isArray(o.legs)) return null
  return {
    depart: String(o.depart ?? ''),
    bags: Number(o.bags ?? 0),
    stations: Number(o.stations ?? 1),
    laundry: Array.isArray(o.laundry_households) ? o.laundry_households.map(String) : [],
    parcels: Array.isArray(o.parcel_households) ? o.parcel_households.map(String) : [],
    returnTrip: String(o.return_trip ?? ''),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    legs: o.legs.map((l: any) => ({
      from: String(l.from),
      to: String(l.to),
      arrive: String(l.arrive ?? ''),
      dropBags: typeof l.drop_bags === 'number' ? l.drop_bags : undefined,
      station: l.station ? String(l.station) : undefined,
      pickLaundry: typeof l.pick_laundry === 'number' ? l.pick_laundry : undefined,
      pickParcels: typeof l.pick_parcels === 'number' ? l.pick_parcels : undefined,
      bringBack: typeof l.bring_back_laundry === 'number' ? l.bring_back_laundry : undefined,
      bringBackParcels: typeof l.bring_back_parcels === 'number' ? l.bring_back_parcels : undefined,
    })),
    at: -1,
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

/** The listing an event is about: `detail.listing` (sample key) first, then the run id, then a predicate. */
function findListing(listings: Listing[], ev: StageEvent, pred?: (l: Listing) => boolean): number {
  const key = ev.detail?.listing ? String(ev.detail.listing) : ''
  if (key) {
    const i = listings.findIndex((l) => l.key === key)
    if (i >= 0) return i
  }
  const run = ev.detail?.listing_run ? String(ev.detail.listing_run) : ''
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
  if (s.startsWith('block') || s.startsWith('không đăng')) return 'block'
  if (s.startsWith('warn') || s.startsWith('có chỗ lệch')) return 'warn'
  if (s.startsWith('pass') || s.startsWith('khớp ảnh')) return 'pass'
  return null
}

const secondsOf = (text: string): string | null => {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*giây/)
  return m ? `${m[1]} giây` : null
}

export function applyEvent(prev: StageState, ev: StageEvent, now: number, anchor: Anchor): StageState {
  const s: StageState = { ...prev, seen: prev.seen + 1 }
  if (!s.mode && ev.mode) s.mode = ev.mode
  s.log = [...prev.log, logLine(ev)]
  if (s.log.length > LOG_MAX) s.log = s.log.slice(s.log.length - LOG_MAX)
  if (ev.from && ev.type !== 'move') s.lastActor = ev.from

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
      // a read-out of the metrics (detail.auto, the closing line) is not agent work
      if (ev.type === 'tool' || (ev.type === 'say' && !ev.detail?.auto)) a.actions += 1
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
      label: ev.detail?.label && (ev.detail.synthetic_voice || ev.detail.illustration) ? String(ev.detail.label) : undefined,
    }
    s.bubbles = [...s.bubbles.filter((x) => x.key !== at.key), b]
  }

  const blocked = !!ev.detail?.blocked
  const markBlocked = () => {
    const i = findListing(s.listings, ev, (l) => l.verdict === 'block')
    if (i < 0) return
    const l = { ...s.listings[i], blocked: true, reason: ev.detail?.reason ?? s.listings[i].reason, stampAt: now }
    s.listings = s.listings.map((x, k) => (k === i ? l : x))
  }
  const pushThread = (kind: ThreadLine['kind'], who: string, text: string) => {
    s.thread = [...s.thread, { id: ev.id, who, kind, text }]
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
        const i = findListing(s.listings, ev, (l) => l.verdict === 'warn')
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, note: ev.text ?? x.note } : x))
      }
      if (ev.from === 'ag_dang_ban' && ev.detail?.status === 'ready') {
        const i = findListing(s.listings, ev)
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, live: true, seconds: secondsOf(ev.text ?? '') } : x))
      }
      // A household paying at the station: count its orders and money at once (the payment line is the source;
      // the next metric line carries the same running totals).
      if (ev.detail?.payment) {
        const orders = Array.isArray(ev.detail.orders) ? ev.detail.orders.length : 0
        const households = Array.isArray(ev.detail.households) ? ev.detail.households.length : orders
        const paid = Number(ev.detail.paid_vnd ?? 0)
        const house = Number((ev.text ?? '').match(/Nhà\s+(\d)/)?.[1] ?? s.payments.length + 1)
        s.payments = [...s.payments, { id: ev.id, house, households, orders, paid }]
        s.metrics = { ...s.metrics, orders: (s.metrics.orders ?? 0) + orders, gmv_vnd: (s.metrics.gmv_vnd ?? 0) + paid }
      }
      if (ev.to === 'ag_dang_ban' && ev.detail?.ocop && ev.detail?.listing)
        s.ocop = { ...s.ocop, [String(ev.detail.listing)]: String(ev.detail.ocop) }
      if (ev.to === 'ag_dang_ban' && ev.detail?.label && ev.detail?.listing)
        s.labels = { ...s.labels, [String(ev.detail.listing)]: String(ev.detail.label) }
      // a house booking its baskets (dat_gio): one row per house on the "Gom đơn" board
      if (ev.to === 'ag_chia_don' && ev.detail?.house)
        s.houseBaskets = [
          ...s.houseBaskets,
          { id: ev.id, house: Number(ev.detail.house), households: Array.isArray(ev.detail.households) ? ev.detail.households.length : 0, text: ev.text ?? '' },
        ]
      // customer-care thread (nhan_hang)
      if (ev.to === 'ag_cham_khach' && ev.from && !isAgent(ev.from)) pushThread('customer', ev.from, ev.text ?? '')
      if (ev.from === 'ag_cham_khach' && ev.to && !isAgent(ev.to) && !ev.to.startsWith('hu_')) pushThread('answer', ev.from, ev.text ?? '')
      // the agent telling a household its order changed (dat_gio)
      if (ev.from === 'ag_chia_don' && ev.to && /^ho\d+$/.test(ev.to))
        s.householdNotes = [...s.householdNotes, { id: ev.id, to: ev.to, text: ev.text ?? '' }]
      // the supplier's settlement line (doi_soat)
      if (ev.from === 'ag_doi_soat' && ev.detail?.settlement && ev.to) {
        const d = ev.detail.settlement
        s.supplierSettlements = [
          ...s.supplierSettlements.filter((x) => x.supplier !== ev.to),
          { supplier: ev.to, amount: Number(d.amount_vnd ?? 0), fee: Number(d.fee_vnd ?? 0), receives: Number(d.supplier_receives_vnd ?? 0) },
        ]
      }
      // the supplier swapping a rejected lot
      if (ev.from && /^ncc\d+$/.test(ev.from) && ev.detail?.lot) {
        const key = `${ev.from}:${ev.detail.lot}`
        s.lots = s.lots.map((l) => (l.key === key ? { ...l, replaced: true } : l))
      }
      break
    }
    case 'handoff': {
      const a = AGENT_CODES.indexOf(ev.from ?? '')
      const b = AGENT_CODES.indexOf(ev.to ?? '')
      if (a < 0 || b < 0 || a === b) addBubble(ev.from, 'handoff')
      else {
        s.beams = [...s.beams, { id: ev.id, from: a, to: b, until: now + BEAM_MS }]
        s.handoffs = [...s.handoffs, { id: ev.id, from: ev.from!, to: ev.to!, text: ev.text ?? '', until: now + HANDOFF_CARD_MS }]
      }
      const p = picklistFrom(ev.detail?.picklist)
      if (p) s.picklist = p
      break
    }
    case 'approve_request': {
      addBubble(ev.from, 'request')
      const from = ev.from ? anchor(ev.from) : null
      const to = ev.to ? anchor(ev.to) : null
      const kind = String(ev.detail?.kind ?? '')
      if (from && to) s.flights = [...s.flights, { id: ev.id, from, to, toKey: to.key, label: kind, until: now + FLIGHT_MS }]
      s.approvals = [...s.approvals, { id: ev.id, scene: s.scene, kind, by: ev.to ?? '', request: ev.text ?? '', answer: null }]
      if (kind === 'duyet_listing') {
        const i = findListing(s.listings, ev, (l) => l.verdict === 'warn')
        if (i >= 0) s.listings = s.listings.map((x, k) => (k === i ? { ...x, waiting: true } : x))
      }
      if (kind === 'doi_tra' && ev.from) pushThread('request', ev.from, ev.text ?? '')
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
      const req = String(ev.detail?.request ?? '')
      s.approvals = s.approvals.map((a) => (a.id === req || (!req && a.answer === null) ? { ...a, answer: ev.text ?? 'Đã duyệt' } : a))
      if (ev.detail?.kind === 'duyet_listing') {
        const i = findListing(s.listings, ev, (l) => l.waiting)
        if (i >= 0)
          s.listings = s.listings.map((x, k) =>
            k === i ? { ...x, waiting: false, approvedText: ev.text ?? 'Đã duyệt' } : x,
          )
      }
      if (ev.detail?.kind === 'doi_tra' && ev.from) pushThread('approve', ev.from, ev.text ?? '')
      break
    }
    case 'error':
      addBubble(ev.from, blocked ? 'block' : 'error')
      if (blocked) markBlocked()
      break
    case 'move':
      if (ev.from === 'xe1' && s.route && ev.loc) {
        const next = s.route.legs.findIndex((l, i) => i > s.route!.at && l.to === ev.loc)
        if (next >= 0) s.route = { ...s.route, at: next }
      }
      break
    case 'tool': {
      const name = ev.tool?.name ?? ''
      const key = String(ev.detail?.listing ?? ev.detail?.sample ?? '')
      const out = ev.detail?.output
      if (name === 'choz_listing' && ev.tool) {
        const l: Listing = {
          key: key || ev.id,
          title: ev.tool.output_summary,
          ocop: ev.detail?.ocop ? String(ev.detail.ocop) : (s.ocop[key] ?? null),
          label: s.labels[key] ?? null,
          verdict: null,
          verdictText: null,
          note: null,
          waiting: false,
          approvedText: null,
          live: false,
          seconds: null,
          blocked: false,
          reason: null,
          stampAt: -1,
        }
        s.listings = [...s.listings.filter((x) => x.key !== l.key), l]
      }
      if (name === 'verify_listing' && ev.tool) {
        const i = findListing(s.listings, ev)
        if (i >= 0) {
          const v = verdictOf(ev.tool.output_summary)
          s.listings = s.listings.map((x, k) => (k === i ? { ...x, verdict: v, verdictText: ev.tool!.output_summary } : x))
        }
      }
      if (name === 'list_baskets' && out) {
        const byPrice = Object.entries((out.by_price ?? {}) as Record<string, number>)
          .map(([price, count]) => ({ price: Number(price), count: Number(count) }))
          .sort((a, b) => a.price - b.price)
        s.baskets = { baskets: Number(out.baskets ?? 0), byPrice, total: Number(out.total_vnd ?? 0), extras: Number(out.extras ?? 0) }
      }
      if (name === 'make_picklist' && out) {
        const p = picklistFrom(out)
        if (p) s.picklist = p
      }
      if (name === 'apply_substitution' && out) {
        s.substitution = {
          sku: String(out.sku ?? ''),
          alt: String(out.alt ?? ''),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orders: ((out.orders as any[]) ?? []).map((o) => ({ order: String(o.order), household: String(o.household), total: Number(o.total_vnd ?? 0) })),
        }
      }
      if (name === 'check_lot' && out) {
        const lotKey = `${out.supplier}:${out.item}`
        const was = s.lots.find((l) => l.key === lotKey)
        const lot: Lot = {
          key: lotKey,
          supplier: String(out.supplier),
          item: String(out.item),
          label: String(out.label ?? ''),
          tempC: typeof out.temp_c === 'number' ? out.temp_c : null,
          expiry: String(out.expiry ?? ''),
          qty: Number(out.qty ?? 0),
          result: out.result === 'loại' ? 'loại' : 'đạt',
          reasons: Array.isArray(out.reasons) ? out.reasons.map(String) : [],
          replaced: !!was && was.result === 'loại' && out.result === 'đạt',
        }
        s.lots = was ? s.lots.map((l) => (l.key === lotKey ? lot : l)) : [...s.lots, lot]
      }
      if (name === 'plan_route' && out) {
        const r = routeFrom(out)
        if (r) s.route = r
      }
      if (name === 'settlement') {
        const st = settlementFrom(out?.totals)
        if (st) s.settlement = st
      }
      if (ev.from === 'ag_cham_khach' && ev.tool) pushThread('tool', ev.from, `${ev.tool.output_summary}`)
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
  const handoffs = keep(s.handoffs)
  if (bubbles === s.bubbles && beams === s.beams && flights === s.flights && ticks === s.ticks && handoffs === s.handoffs) return s
  return { ...s, bubbles, beams, flights, ticks, handoffs }
}

export const speakerLabel = (who: string, to?: string) => (to ? `${actorName(who)} → ${actorName(to)}` : actorName(who))
