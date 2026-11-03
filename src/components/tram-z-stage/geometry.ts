/**
 * Map geometry without pixi: places, walking graph and where each sprite stands. The map is 1152×792 px
 * (60% of a 1920-wide stage) drawn on a 4 px pixel grid (288×198 cells).
 */
import { houseOf } from './roster'

export const U = 4
export const MAP_W = 1152
export const MAP_H = 792

export interface Pt {
  x: number
  y: number
}

const u = (x: number, y: number): Pt => ({ x: x * U, y: y * U })

/** Left x (cells) of the five supplier stalls ncc1..ncc5 and of the five houses. */
export const STALL_X = [8, 30, 52, 74, 96]
export const HOUSE_X = [140, 169, 198, 227, 256]
export const ROAD_Y = 96

export const NODES: Record<string, Pt> = {
  SUP_YARD: u(64, 70),
  R_SUP: u(64, ROAD_Y),
  R_ALLEY: u(128, ROAD_Y),
  R_MID: u(180, ROAD_Y),
  R_KHO: u(233, ROAD_Y),
  KHO: u(233, 80),
  ALLEY_BOT: u(128, 186),
  TRAM_FRONT: u(100, 186),
}
STALL_X.forEach((sx, i) => {
  NODES[`NCC${i + 1}`] = u(sx + 10, 62)
  NODES[`NCC${i + 1}_Y`] = u(sx + 10, 70)
})
HOUSE_X.forEach((hx, i) => {
  NODES[`H${i + 1}`] = u(hx + 12, 186)
})

const EDGES: [string, string][] = [
  ['SUP_YARD', 'R_SUP'],
  ['R_SUP', 'R_ALLEY'],
  ['R_ALLEY', 'R_MID'],
  ['R_MID', 'R_KHO'],
  ['R_KHO', 'KHO'],
  ['R_ALLEY', 'ALLEY_BOT'],
  ['TRAM_FRONT', 'ALLEY_BOT'],
  ['ALLEY_BOT', 'H1'],
  ['H1', 'H2'],
  ['H2', 'H3'],
  ['H3', 'H4'],
  ['H4', 'H5'],
  ...STALL_X.flatMap((_, i): [string, string][] => [
    [`NCC${i + 1}`, `NCC${i + 1}_Y`],
    [`NCC${i + 1}_Y`, 'SUP_YARD'],
  ]),
]

const ADJ: Record<string, string[]> = {}
for (const [a, b] of EDGES) {
  ;(ADJ[a] ||= []).push(b)
  ;(ADJ[b] ||= []).push(a)
}

/** Node names from a to b (inclusive), breadth first; [b] when there is no route. */
export function route(a: string, b: string): string[] {
  if (a === b) return [b]
  const prev: Record<string, string | null> = { [a]: null }
  const queue = [a]
  while (queue.length) {
    const n = queue.shift() as string
    if (n === b) break
    for (const m of ADJ[n] || []) {
      if (!(m in prev)) {
        prev[m] = n
        queue.push(m)
      }
    }
  }
  if (!(b in prev)) return [b]
  const out: string[] = []
  for (let n: string | null = b; n; n = prev[n]) out.unshift(n)
  return out
}

/** Which sprite stands for an actor code (50 households share five villagers, one per house). */
export function spriteOf(actor?: string): string | null {
  if (!actor) return null
  if (/^ncc[1-5]$/.test(actor)) return actor
  if (/^ho\d+$/.test(actor)) return `v${houseOf(actor)}`
  if (actor === 'hu_tram' || actor === 'hu_kho' || actor === 'xe1') return actor
  return null
}

export interface Spot {
  node: string
  at: Pt
}

const plus = (p: Pt, dx: number, dy = 0): Pt => ({ x: p.x + dx, y: p.y + dy })

export const HU_TRAM_AT = u(94, 166)
export const HU_KHO_AT = u(206, 80)

/** Where a sprite rests before anything moves. */
export function homeSpot(sprite: string): Spot {
  if (sprite.startsWith('ncc')) {
    const node = `NCC${sprite.slice(3)}`
    return { node, at: NODES[node] }
  }
  if (/^v[1-5]$/.test(sprite)) {
    const node = `H${sprite.slice(1)}`
    return { node, at: NODES[node] }
  }
  if (sprite === 'hu_tram') return { node: 'TRAM_FRONT', at: HU_TRAM_AT }
  if (sprite === 'hu_kho') return { node: 'KHO', at: HU_KHO_AT }
  return { node: 'KHO', at: NODES.KHO }
}

/** Where a sprite goes for a place code, or null when the place is not on the map. */
export function spotFor(sprite: string, loc: string): Spot | null {
  const nhaMatch = /^loc_nha([1-5])$/.exec(loc)
  if (sprite.startsWith('ncc')) {
    const i = parseInt(sprite.slice(3), 10)
    if (loc === 'loc_ncc') return homeSpot(sprite)
    if (loc === 'loc_duong') return { node: 'R_MID', at: plus(NODES.R_MID, (i - 3) * 18, 4) }
    if (loc === 'loc_kho') return { node: 'KHO', at: u(244 + i * 7, 80) }
  }
  if (/^v[1-5]$/.test(sprite)) {
    const k = parseInt(sprite.slice(1), 10)
    if (loc === 'loc_tram') return { node: 'TRAM_FRONT', at: plus(NODES.TRAM_FRONT, (k - 3) * 12) }
  }
  if (sprite === 'xe1') {
    if (loc === 'loc_kho') return { node: 'KHO', at: NODES.KHO }
    if (loc === 'loc_duong') return { node: 'R_MID', at: NODES.R_MID }
    if (loc === 'loc_tram') return { node: 'R_ALLEY', at: NODES.R_ALLEY }
  }
  if (nhaMatch) return { node: `H${nhaMatch[1]}`, at: NODES[`H${nhaMatch[1]}`] }
  if (loc === 'loc_ncc') return { node: 'SUP_YARD', at: NODES.SUP_YARD }
  if (loc === 'loc_kho') return { node: 'KHO', at: NODES.KHO }
  if (loc === 'loc_duong') return { node: 'R_MID', at: NODES.R_MID }
  if (loc === 'loc_tram') return { node: 'TRAM_FRONT', at: NODES.TRAM_FRONT }
  return null
}

/** Places labelled on the map (centre x, top y in map px; sign labels sit on the painted signs). */
export const PLACE_LABELS: { text: string; x: number; y: number; tone: 'red' | 'dark' | 'orange' | 'light' }[] = [
  { text: 'Nhà cung cấp', x: 62 * U, y: 18, tone: 'dark' },
  { text: 'Kho khu vực 1', x: 237 * U, y: 77, tone: 'red' },
  { text: 'Tạp hóa', x: 37.5 * U, y: 449, tone: 'orange' },
  { text: 'Trạm Z', x: 94 * U, y: 449, tone: 'red' },
  ...HOUSE_X.map((hx, i) => ({ text: `Nhà ${i + 1}`, x: (hx + 12) * U, y: 436, tone: 'light' as const })),
]

/** How dark the map is at simulated time t (0 day … 0.4 night). */
export function nightOf(t: number): number {
  const h = (((t / 3600) % 24) + 24) % 24
  const max = 0.4
  if (h >= 19.5 || h < 4.75) return max
  if (h < 6.25) return max * (1 - (h - 4.75) / 1.5)
  if (h >= 17.5) return max * ((h - 17.5) / 2)
  return 0
}
