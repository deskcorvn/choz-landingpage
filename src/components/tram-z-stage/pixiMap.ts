/**
 * The pixel map, drawn entirely in code with pixi.js Graphics (no image files). Suppliers, warehouse, road,
 * a grocery shop whose right corner is Trạm Z, and five houses. Sprites walk along the graph in geometry.ts.
 */
import { Application, Container, Graphics } from 'pixi.js'

import {
  HOUSE_X,
  HU_TRAM_AT,
  MAP_H,
  MAP_W,
  NODES,
  STALL_X,
  U,
  homeSpot,
  nightOf,
  route,
  spotFor,
  spriteOf,
  type Pt,
  type Spot,
} from './geometry'
import type { StageEvent } from './types'

export interface TramMap {
  canvas: HTMLCanvasElement
  posOf(sprite: string): Pt | null
  handle(ev: StageEvent, instant?: boolean): void
  update(dtMs: number): void
  setTime(t: number): void
  vanTag(): { x: number; y: number; text: string } | null
  reset(): void
  destroy(): void
}

type Fill = string

/** Rect in grid cells (4 px). */
function R(g: Graphics, x: number, y: number, w: number, h: number, c: Fill, alpha = 1) {
  g.rect(x * U, y * U, w * U, h * U).fill({ color: c, alpha })
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ------------------------------------------------------------------ static world */

function drawGround(g: Graphics) {
  R(g, 0, 0, 288, 198, '#cfe3ae')
  const r = rng(7)
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * 288)
    const y = Math.floor(r() * 198)
    R(g, x, y, 1, 1, r() < 0.6 ? '#b9d494' : '#ddedc6')
  }
  // flowers
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(r() * 288)
    const y = Math.floor(r() * 198)
    R(g, x, y, 1, 1, ['#fda4af', '#fde68a', '#ffffff'][i % 3])
  }
}

function tree(g: Graphics, x: number, y: number) {
  R(g, x + 1, y + 12, 7, 1, '#000000', 0.12)
  R(g, x + 3, y + 8, 2, 5, '#78350f')
  R(g, x + 2, y, 4, 1, '#3f6212')
  R(g, x + 1, y + 1, 6, 8, '#3f6212')
  R(g, x, y + 3, 8, 5, '#3f6212')
  R(g, x + 2, y + 2, 3, 3, '#65a30d')
  R(g, x + 1, y + 4, 2, 2, '#4d7c0f')
  R(g, x + 3, y + 1, 1, 1, '#84cc16')
}

function drawSuppliers(g: Graphics) {
  // fenced yard
  R(g, 4, 4, 118, 70, '#ead9ae')
  for (let x = 4; x <= 121; x += 6) {
    R(g, x, 3, 1, 3, '#92400e')
    if (x < 60 || x > 68) R(g, x, 72, 1, 3, '#92400e')
  }
  R(g, 4, 4, 118, 1, '#a16207')
  R(g, 4, 73, 58, 1, '#a16207')
  R(g, 67, 73, 55, 1, '#a16207')
  R(g, 4, 4, 1, 70, '#a16207')
  R(g, 121, 4, 1, 70, '#a16207')
  // yard path and connector to the road
  R(g, 8, 68, 110, 4, '#d8c08c')
  R(g, 62, 72, 4, 16, '#d8c08c')

  const [s1, s2, s3, s4, s5] = STALL_X
  // ncc1: specialty stall, orange awning
  R(g, s1 - 1, 24, 22, 2, '#7f1d1d')
  for (let k = 0; k < 5; k++) {
    R(g, s1 + k * 4, 26, 2, 5, '#ff7b00')
    R(g, s1 + k * 4 + 2, 26, 2, 5, '#fff7ed')
  }
  R(g, s1, 31, 20, 1, '#c2410c')
  R(g, s1 + 1, 32, 18, 18, '#fde7d3')
  R(g, s1 + 2, 37, 16, 1, '#b45309')
  R(g, s1 + 3, 33, 3, 4, '#b91c1c')
  R(g, s1 + 7, 33, 3, 4, '#ff7b00')
  R(g, s1 + 11, 33, 3, 4, '#b91c1c')
  R(g, s1 + 15, 33, 2, 4, '#ca8a04')
  R(g, s1, 44, 20, 6, '#b45309')
  R(g, s1, 44, 20, 1, '#d97706')
  R(g, s1 + 3, 40, 4, 4, '#fff7ed')
  R(g, s1 + 4, 41, 2, 2, '#b91c1c')
  R(g, s1 + 12, 40, 4, 4, '#fff7ed')
  R(g, s1 + 13, 41, 2, 2, '#b91c1c')
  R(g, s1, 26, 1, 24, '#92400e')
  R(g, s1 + 19, 26, 1, 24, '#92400e')

  // ncc2: vegetable field
  R(g, s2 - 1, 15, 22, 1, '#a16207')
  R(g, s2, 16, 20, 40, '#8b5a2b')
  for (let r = 0; r < 6; r++) {
    R(g, s2 + 1, 18 + r * 6, 18, 3, '#65a30d')
    for (let c = 0; c < 6; c++) R(g, s2 + 2 + c * 3, 18 + r * 6, 1, 1, '#a3e635')
  }

  // ncc3: meat stall, red roof
  R(g, s3 - 1, 22, 22, 3, '#b91c1c')
  R(g, s3 - 1, 25, 22, 1, '#7f1d1d')
  R(g, s3 + 1, 26, 18, 24, '#fff7ed')
  R(g, s3 + 2, 28, 16, 1, '#6b7280')
  for (const [dx, h] of [
    [3, 6],
    [8, 7],
    [13, 6],
  ]) {
    R(g, s3 + dx, 29, 3, h, '#fda4af')
    R(g, s3 + dx + 1, 29, 1, h, '#fb7185')
  }
  R(g, s3 + 13, 40, 5, 4, '#e0f2fe')
  R(g, s3, 44, 20, 6, '#9ca3af')
  R(g, s3, 44, 20, 1, '#d1d5db')
  R(g, s3, 25, 1, 25, '#6b7280')
  R(g, s3 + 19, 25, 1, 25, '#6b7280')

  // ncc4: fish pond with a hut
  R(g, s4 + 4, 16, 12, 3, '#991b1b')
  R(g, s4 + 5, 19, 10, 9, '#fff7ed')
  R(g, s4 + 9, 23, 2, 5, '#92400e')
  R(g, s4, 30, 20, 20, '#c9b07a')
  R(g, s4 + 1, 31, 18, 18, '#38bdf8')
  R(g, s4 + 3, 33, 14, 14, '#0284c7')
  R(g, s4 + 4, 36, 5, 1, '#7dd3fc')
  R(g, s4 + 10, 43, 5, 1, '#7dd3fc')
  R(g, s4 + 6, 40, 3, 2, '#ff7b00')
  R(g, s4 + 12, 37, 3, 2, '#fb923c')

  // ncc5: egg coop
  R(g, s5 + 6, 19, 8, 2, '#92400e')
  R(g, s5 + 3, 21, 14, 3, '#b45309')
  R(g, s5 + 1, 24, 18, 3, '#92400e')
  R(g, s5 + 2, 27, 16, 17, '#fde68a')
  for (const y of [31, 35, 39]) R(g, s5 + 2, y, 16, 1, '#f59e0b')
  R(g, s5 + 8, 36, 4, 8, '#92400e')
  R(g, s5 + 1, 46, 18, 4, '#b45309')
  for (let k = 0; k < 6; k++) R(g, s5 + 2 + k * 3, 45, 2, 2, '#fff7ed')
  R(g, s5 + 15, 50, 3, 3, '#ffffff')
  R(g, s5 + 17, 49, 1, 1, '#ef4444')
}

function drawMiddle(g: Graphics) {
  for (const [x, y] of [
    [126, 6],
    [140, 16],
    [176, 4],
    [130, 40],
    [178, 40],
    [150, 62],
    [128, 66],
    [176, 70],
  ])
    tree(g, x, y)
  // Chợ Z billboard
  R(g, 150, 44, 1, 12, '#6b7280')
  R(g, 164, 44, 1, 12, '#6b7280')
  R(g, 144, 28, 28, 17, '#7f1d1d')
  R(g, 145, 29, 26, 15, '#b91c1c')
  R(g, 152, 32, 12, 2, '#ffffff')
  for (let k = 0; k < 6; k++) R(g, 161 - k * 1.5, 34 + k, 2, 1, '#ffffff')
  R(g, 152, 40, 12, 2, '#ffffff')
}

function drawWarehouse(g: Graphics) {
  R(g, 188, 8, 98, 7, '#7f1d1d')
  for (let k = 0; k < 25; k++) R(g, 188 + k * 4, 8, 2, 7, '#991b1b')
  R(g, 188, 15, 98, 1, '#450a0a')
  R(g, 190, 16, 94, 50, '#e5e7eb')
  for (let k = 1; k < 12; k++) R(g, 190 + k * 8, 16, 1, 50, '#d1d5db')
  R(g, 211, 18, 52, 10, '#b91c1c')
  R(g, 211, 18, 52, 1, '#ef4444')
  R(g, 211, 27, 52, 1, '#7f1d1d')
  // door 1 half open with crates inside
  R(g, 197, 33, 32, 33, '#6b7280')
  R(g, 198, 34, 30, 22, '#9ca3af')
  for (let k = 0; k < 7; k++) R(g, 198, 35 + k * 3, 30, 1, '#7c828c')
  R(g, 198, 56, 30, 10, '#1f2937')
  R(g, 201, 59, 6, 7, '#b45309')
  R(g, 209, 61, 5, 5, '#92400e')
  R(g, 219, 59, 6, 7, '#b45309')
  // door 2 closed
  R(g, 239, 33, 32, 33, '#6b7280')
  R(g, 240, 34, 30, 32, '#9ca3af')
  for (let k = 0; k < 10; k++) R(g, 240, 35 + k * 3, 30, 1, '#7c828c')
  // apron, driveway, pallets
  R(g, 188, 66, 98, 4, '#9ca3af')
  R(g, 222, 70, 22, 18, '#4b5563')
  R(g, 222, 70, 1, 18, '#374151')
  R(g, 243, 70, 1, 18, '#374151')
  R(g, 274, 58, 8, 8, '#b45309')
  R(g, 274, 58, 8, 1, '#d97706')
  R(g, 276, 52, 6, 6, '#92400e')
  R(g, 192, 58, 4, 8, '#0284c7')
  R(g, 192, 58, 4, 1, '#38bdf8')
}

function drawRoad(g: Graphics) {
  R(g, 0, 87, 288, 1, '#d6d3d1')
  R(g, 0, 88, 288, 16, '#4b5563')
  R(g, 0, 88, 288, 1, '#374151')
  R(g, 0, 103, 288, 1, '#374151')
  R(g, 0, 104, 288, 1, '#d6d3d1')
  for (let x = 0; x < 288; x += 12) R(g, x + 3, 95, 6, 1, '#fcd34d')
  // alley down to the lane
  R(g, 122, 105, 12, 73, '#d6d3d1')
  R(g, 127, 105, 2, 73, '#cbc5c1')
  // lane in front of the shop and houses
  R(g, 0, 177, 288, 1, '#a8a29e')
  R(g, 0, 178, 288, 14, '#e7e5e4')
  for (let x = 0; x < 288; x += 6) R(g, x, 178, 1, 14, '#d6d3d1')
  R(g, 0, 185, 288, 1, '#d6d3d1')
}

function drawShop(g: Graphics) {
  R(g, 6, 108, 114, 3, '#7f1d1d')
  // signs
  R(g, 8, 111, 59, 10, '#ff7b00')
  R(g, 8, 111, 59, 1, '#fdba74')
  R(g, 8, 120, 59, 1, '#c2410c')
  R(g, 70, 111, 48, 10, '#b91c1c')
  R(g, 70, 111, 48, 1, '#ef4444')
  R(g, 70, 120, 48, 1, '#7f1d1d')
  // awnings
  for (let x = 8; x < 67; x += 4) {
    R(g, x, 121, 2, 6, '#b91c1c')
    R(g, x + 2, 121, 2, 6, '#fff7ed')
    R(g, x + 1, 127, 2, 1, '#b91c1c')
  }
  R(g, 70, 121, 48, 6, '#991b1b')
  R(g, 70, 121, 48, 1, '#b91c1c')
  // walls
  R(g, 8, 128, 110, 48, '#fff7ed')
  R(g, 8, 174, 110, 2, '#d6d3d1')
  // grocery window with shelves of goods
  R(g, 11, 131, 37, 32, '#92400e')
  R(g, 12, 132, 35, 30, '#e0f2fe')
  const r = rng(11)
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#eab308', '#14b8a6']
  for (const shelfY of [141, 151, 161]) {
    R(g, 12, shelfY, 35, 1, '#b45309')
    for (let x = 13; x < 45; x += 3) {
      const h = 2 + Math.floor(r() * 3)
      R(g, x, shelfY - h, 2, h, colors[Math.floor(r() * colors.length)])
    }
  }
  // door
  R(g, 50, 139, 15, 35, '#78350f')
  R(g, 51, 140, 13, 34, '#92400e')
  R(g, 53, 142, 9, 14, '#bae6fd')
  R(g, 61, 158, 1, 3, '#fcd34d')
  R(g, 67, 128, 3, 48, '#7f1d1d')
  // Trạm Z corner: Z badge, pick-up shelf for Giỏ bags
  R(g, 70, 128, 48, 46, '#fff1f2')
  R(g, 70, 128, 48, 2, '#b91c1c')
  R(g, 73, 132, 12, 12, '#b91c1c')
  R(g, 75, 134, 8, 1, '#ffffff')
  for (let k = 0; k < 6; k++) R(g, 81 - k, 135 + k, 1, 1, '#ffffff')
  R(g, 75, 141, 8, 1, '#ffffff')
  R(g, 87, 130, 30, 27, '#7f1d1d')
  R(g, 88, 131, 28, 25, '#fecaca')
  R(g, 88, 139, 28, 1, '#7f1d1d')
  R(g, 88, 147, 28, 1, '#7f1d1d')
  R(g, 73, 148, 12, 9, '#ffffff')
  R(g, 74, 149, 10, 1, '#b91c1c')
  R(g, 74, 151, 7, 1, '#9ca3af')
  R(g, 74, 153, 8, 1, '#9ca3af')
  R(g, 70, 169, 48, 5, '#fecdd3')
}

/** Drawn above hu_tram so he stands behind it. */
function drawCounter(g: Graphics) {
  R(g, 71, 162, 46, 2, '#7f1d1d')
  R(g, 72, 164, 44, 5, '#b91c1c')
  R(g, 72, 166, 44, 1, '#ef4444')
  R(g, 107, 157, 6, 5, '#111827')
  R(g, 108, 158, 1, 1, '#ffffff')
  R(g, 110, 158, 2, 1, '#ffffff')
  R(g, 109, 160, 1, 1, '#ffffff')
  R(g, 111, 160, 1, 1, '#ffffff')
}

const ROOFS = ['#b91c1c', '#0284c7', '#ff7b00', '#991b1b', '#4b5563']
const ROOFS_DARK = ['#7f1d1d', '#075985', '#c2410c', '#7f1d1d', '#374151']

function drawHouses(g: Graphics) {
  HOUSE_X.forEach((hx, k) => {
    const roof = ROOFS[k]
    const dark = ROOFS_DARK[k]
    R(g, hx - 1, 176, 26, 1, '#000000', 0.12)
    if (k % 2 === 0) R(g, hx + 17, 117, 3, 7, '#78350f')
    R(g, hx + 7, 120, 10, 4, roof)
    R(g, hx + 3, 124, 18, 4, roof)
    R(g, hx, 128, 24, 4, roof)
    R(g, hx - 2, 132, 28, 4, roof)
    R(g, hx + 3, 127, 18, 1, dark)
    R(g, hx, 131, 24, 1, dark)
    R(g, hx - 2, 135, 28, 1, dark)
    R(g, hx, 136, 24, 40, '#fff7ed')
    R(g, hx + 22, 136, 2, 40, '#fde7d3')
    for (const wx of [hx + 3, hx + 13]) {
      R(g, wx, 141, 8, 8, '#78350f')
      R(g, wx + 1, 142, 6, 6, '#bae6fd')
      R(g, wx + 3, 142, 1, 6, '#78350f')
      R(g, wx + 1, 144, 6, 1, '#78350f')
    }
    R(g, hx + 9, 160, 6, 16, '#92400e')
    R(g, hx + 10, 161, 4, 6, '#b45309')
    R(g, hx + 13, 168, 1, 1, '#fcd34d')
    R(g, hx + 1, 170, 3, 4, '#16a34a')
    R(g, hx + 1, 174, 3, 2, '#b45309')
    R(g, hx + 20, 171, 3, 3, '#22c55e')
    R(g, hx + 20, 174, 3, 2, '#b45309')
  })
}

function drawLights(g: Graphics) {
  HOUSE_X.forEach((hx) => {
    for (const wx of [hx + 3, hx + 13]) {
      R(g, wx - 1, 140, 10, 10, '#fde68a', 0.25)
      R(g, wx + 1, 142, 6, 6, '#fde68a')
    }
  })
  R(g, 10, 130, 39, 34, '#fde68a', 0.25)
  R(g, 12, 132, 35, 30, '#fef3c7', 0.55)
  R(g, 70, 130, 48, 44, '#fecaca', 0.3)
  R(g, 198, 56, 30, 10, '#fde68a', 0.5)
  for (let x = 20; x < 288; x += 48) R(g, x, 104, 2, 2, '#fef08a')
}

/* ------------------------------------------------------------------ sprites */

const HEAD_HAIR = ['...hhhh...', '..hhhhhh..', '.hhhhhhhh.', '.hssssssh.', '..sesses..', '..ssssss..', '...ssss...']
const HEAD_HAT = ['....aa....', '..aaaaaa..', 'aaaaaaaaaa', '.hssssssh.', '..sesses..', '..ssssss..', '...ssss...']
const HEAD_CAP = ['...aaaa...', '..aaaaaa..', '.aaaaaaaaa', '.hssssssh.', '..sesses..', '..ssssss..', '...ssss...']
const BODY = ['..cccccc..', '.cccccccc.', '.sccddccs.', '.sccccccs.', '..cccccc..', '..pppppp..']
const LEGS_A = ['..pp..pp..', '..pp..pp..', '..kk..kk..']
const LEGS_B = ['.pp....pp.', '.pp....pp.', '.kk....kk.']
const P = 3

interface Look {
  head: string[]
  pal: Record<string, string>
}

function look(sprite: string): Look {
  const base = { s: '#f1c27d', e: '#111827', k: '#1f2937' }
  if (sprite.startsWith('ncc')) {
    const i = parseInt(sprite.slice(3), 10) - 1
    const shirts = ['#ff7b00', '#65a30d', '#b91c1c', '#0284c7', '#ca8a04']
    return {
      head: HEAD_HAT,
      pal: { ...base, a: '#fef3c7', h: '#1f2937', c: shirts[i], d: '#00000033', p: '#374151' },
    }
  }
  if (sprite === 'hu_tram')
    return { head: HEAD_CAP, pal: { ...base, a: '#b91c1c', h: '#111827', c: '#b91c1c', d: '#7f1d1d', p: '#1f2937' } }
  if (sprite === 'hu_kho')
    return { head: HEAD_HAIR, pal: { ...base, h: '#111827', c: '#0284c7', d: '#075985', p: '#374151' } }
  const k = Math.max(0, parseInt(sprite.slice(1), 10) - 1) % 5
  const hair = ['#111827', '#4b2e1e', '#1f2937', '#6b4423', '#111827']
  const shirt = ['#f472b6', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24']
  const pants = ['#1e3a8a', '#374151', '#4b5563', '#1f2937', '#7c2d12']
  return { head: HEAD_HAIR, pal: { ...base, h: hair[k], c: shirt[k], d: '#00000026', p: pants[k] } }
}

function pix(g: Graphics, rows: string[], pal: Record<string, string>, ox: number, oy: number) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]]
      if (!c) continue
      if (c.length === 9) g.rect(ox + x * P, oy + y * P, P, P).fill({ color: c.slice(0, 7), alpha: parseInt(c.slice(7), 16) / 255 })
      else g.rect(ox + x * P, oy + y * P, P, P).fill(c)
    }
  })
}

interface Mover {
  sprite: string
  c: Container
  frames: [Graphics, Graphics] | null
  bag: Graphics | null
  cargo: Graphics | null
  laundry: Graphics | null
  node: string
  loc: string | null
  pos: Pt
  path: Pt[] | null
  lens: number[]
  total: number
  elapsed: number
  dur: number
  anim: number
  onArrive: (() => void) | null
  laundryBags: number
  bags: number
}

function makePerson(sprite: string): Mover {
  const c = new Container()
  const { head, pal } = look(sprite)
  const shadow = new Graphics().rect(-12, -3, 24, 4).fill({ color: '#000000', alpha: 0.18 })
  const a = new Graphics()
  const b = new Graphics()
  pix(a, [...head, ...BODY, ...LEGS_A], pal, -15, -48)
  pix(b, [...head, ...BODY, ...LEGS_B], pal, -15, -48)
  b.visible = false
  const bag = new Graphics()
  bag.rect(10, -24, 9, 10).fill('#b91c1c').rect(12, -27, 5, 3).fill('#7f1d1d').rect(12, -21, 5, 2).fill('#ffffff')
  bag.visible = false
  c.addChild(shadow, a, b, bag)
  const home = homeSpot(sprite)
  return {
    sprite,
    c,
    frames: [a, b],
    bag,
    cargo: null,
    laundry: null,
    node: home.node,
    loc: null,
    pos: { ...home.at },
    path: null,
    lens: [],
    total: 0,
    elapsed: 0,
    dur: 0,
    anim: 0,
    onArrive: null,
    laundryBags: 0,
    bags: 0,
  }
}

function makeVan(): Mover {
  const c = new Container()
  const body = new Graphics()
  const V = (x: number, y: number, w: number, h: number, col: string, alpha = 1) =>
    body.rect(-45 + x * P, -45 + y * P, w * P, h * P).fill({ color: col, alpha })
  V(1, 14, 29, 1, '#000000', 0.2)
  V(0, 3, 24, 10, '#f9fafb')
  V(0, 2, 23, 1, '#e5e7eb')
  V(24, 5, 6, 8, '#f9fafb')
  V(25, 6, 4, 3, '#93c5fd')
  V(2, 5, 6, 3, '#bfdbfe')
  V(0, 9, 30, 2, '#b91c1c')
  V(11, 4, 6, 5, '#b91c1c')
  V(12, 5, 4, 1, '#ffffff')
  V(14, 6, 1, 1, '#ffffff')
  V(13, 7, 1, 1, '#ffffff')
  V(12, 8, 4, 1, '#ffffff')
  V(0, 12, 30, 1, '#9ca3af')
  V(4, 11, 5, 4, '#111827')
  V(20, 11, 5, 4, '#111827')
  V(6, 12, 1, 1, '#9ca3af')
  V(22, 12, 1, 1, '#9ca3af')
  V(29, 9, 1, 1, '#fde047')
  const cargo = new Graphics()
  for (let k = 0; k < 4; k++) {
    cargo.rect(-45 + (2 + k * 5) * P, -45 - 1 * P, 4 * P, 3 * P).fill('#b91c1c')
    cargo.rect(-45 + (3 + k * 5) * P, -45 - 2 * P, 2 * P, 1 * P).fill('#7f1d1d')
  }
  cargo.visible = false
  const laundry = new Graphics()
  for (let k = 0; k < 3; k++) {
    laundry.rect(-45 + (3 + k * 6) * P, -45 - 2 * P, 5 * P, 4 * P).fill('#0284c7')
    laundry.rect(-45 + (4 + k * 6) * P, -45 - 2 * P, 3 * P, 1 * P).fill('#7dd3fc')
  }
  laundry.visible = false
  c.addChild(body, cargo, laundry)
  const home = homeSpot('xe1')
  return {
    sprite: 'xe1',
    c,
    frames: null,
    bag: null,
    cargo,
    laundry,
    node: home.node,
    loc: 'loc_kho',
    pos: { ...home.at },
    path: null,
    lens: [],
    total: 0,
    elapsed: 0,
    dur: 0,
    anim: 0,
    onArrive: null,
    laundryBags: 0,
    bags: 0,
  }
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

/* ------------------------------------------------------------------ map */

export async function createTramMap(host: HTMLElement, resolution = 1): Promise<TramMap> {
  const app = new Application()
  await app.init({
    width: MAP_W,
    height: MAP_H,
    background: '#cfe3ae',
    antialias: false,
    resolution,
    autoDensity: true,
  })
  const canvas = app.canvas as HTMLCanvasElement
  canvas.style.width = `${MAP_W}px`
  canvas.style.height = `${MAP_H}px`
  canvas.style.display = 'block'
  host.appendChild(canvas)

  const world = new Graphics()
  drawGround(world)
  drawSuppliers(world)
  drawMiddle(world)
  drawWarehouse(world)
  drawRoad(world)
  drawShop(world)
  drawHouses(world)
  app.stage.addChild(world)

  const shelf = new Graphics()
  app.stage.addChild(shelf)

  const chars = new Container()
  chars.sortableChildren = true
  app.stage.addChild(chars)
  const counter = new Graphics()
  drawCounter(counter)
  counter.zIndex = HU_TRAM_AT.y + 4
  chars.addChild(counter)

  const night = new Graphics().rect(0, 0, MAP_W, MAP_H).fill('#0b1b3f')
  night.alpha = 0
  const lights = new Graphics()
  drawLights(lights)
  lights.alpha = 0
  app.stage.addChild(night, lights)

  const movers: Record<string, Mover> = {}
  const add = (m: Mover) => {
    movers[m.sprite] = m
    chars.addChild(m.c)
  }
  ;['ncc1', 'ncc2', 'ncc3', 'ncc4', 'ncc5', 'v1', 'v2', 'v3', 'v4', 'v5', 'hu_tram', 'hu_kho'].forEach((s) =>
    add(makePerson(s)),
  )
  add(makeVan())

  let tramBags = 0
  /** after the van is back at the warehouse its laundry tag stays this long (ms of playback) */
  let laundryHold = 0
  const drawShelf = () => {
    shelf.clear()
    const n = Math.min(15, tramBags > 0 ? Math.max(1, Math.round(tramBags / 2)) : 0)
    for (let i = 0; i < n; i++) {
      const col = i % 5
      const row = Math.floor(i / 5)
      const x = 89 + col * 5.4
      const y = 133 + row * 8
      R(shelf, x, y + 1, 4, 5, '#b91c1c')
      R(shelf, x + 1, y, 2, 1, '#7f1d1d')
      R(shelf, x + 1, y + 3, 2, 1, '#ffffff')
    }
  }

  const place = (m: Mover) => {
    m.c.position.set(Math.round(m.pos.x), Math.round(m.pos.y))
    m.c.zIndex = m.pos.y
  }
  Object.values(movers).forEach(place)

  const finish = (m: Mover) => {
    if (m.path) {
      m.pos = { ...m.path[m.path.length - 1] }
      m.path = null
    }
    if (m.frames) {
      m.frames[0].visible = true
      m.frames[1].visible = false
    }
    const cb = m.onArrive
    m.onArrive = null
    place(m)
    cb?.()
  }

  const startMove = (m: Mover, spot: Spot, instant: boolean, onArrive: (() => void) | null) => {
    if (m.path || m.onArrive) finish(m)
    const nodes = route(m.node, spot.node)
    const raw = [m.pos, ...nodes.map((n) => NODES[n]), spot.at]
    const pts: Pt[] = []
    for (const p of raw) {
      const last = pts[pts.length - 1]
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) pts.push({ ...p })
    }
    m.node = spot.node
    m.onArrive = onArrive
    if (instant || pts.length < 2) {
      m.pos = { ...spot.at }
      m.path = null
      finish(m)
      return
    }
    const lens: number[] = []
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      lens.push(d)
      total += d
    }
    m.path = pts
    m.lens = lens
    m.total = total
    m.elapsed = 0
    m.anim = 0
    m.dur = Math.min(950, Math.max(380, total / (m.sprite === 'xe1' ? 1.0 : 1.15)))
  }

  const refreshVan = (m: Mover) => {
    if (m.cargo) m.cargo.visible = m.bags > 0
    if (m.laundry) m.laundry.visible = m.laundryBags > 0
  }

  const api: TramMap = {
    canvas,
    posOf(sprite) {
      const m = movers[sprite]
      if (!m) return null
      // a walking sprite is anchored where it is going, so a bubble that follows a move lands on the speaker
      return m.path ? { ...m.path[m.path.length - 1] } : { ...m.pos }
    },
    handle(ev, instant = false) {
      if (ev.type === 'move' && ev.loc) {
        const sprite = spriteOf(ev.from)
        if (!sprite) return
        const m = movers[sprite]
        const spot = m ? spotFor(sprite, ev.loc) : null
        if (!m || !spot) return
        const fromLoc = m.loc
        m.loc = ev.loc
        let onArrive: (() => void) | null = null
        if (sprite === 'xe1') {
          const bags = Number(ev.detail?.bags ?? 0)
          const laundry = Number(ev.detail?.laundry_bags ?? 0)
          if (bags > 0) m.bags = bags
          if (laundry > 0) m.laundryBags = laundry
          if (bags > 0 && ev.loc === 'loc_tram')
            onArrive = () => {
              tramBags += m.bags
              m.bags = 0
              refreshVan(m)
              drawShelf()
            }
          if (ev.loc === 'loc_kho' && m.laundryBags > 0)
            onArrive = () => {
              if (instant) {
                m.laundryBags = 0
                refreshVan(m)
              } else laundryHold = 1500
            }
          refreshVan(m)
        } else if (m.bag) {
          const goingHome = /^loc_nha/.test(ev.loc)
          m.bag.visible = goingHome && fromLoc === 'loc_tram'
          if (goingHome) {
            const bag = m.bag
            onArrive = () => {
              bag.visible = false
            }
          }
        }
        startMove(m, spot, instant, onArrive)
        return
      }
      if (ev.type === 'say' && ev.detail?.payment && Array.isArray(ev.detail?.orders)) {
        tramBags = Math.max(0, tramBags - ev.detail.orders.length)
        drawShelf()
      }
    },
    update(dt) {
      if (laundryHold > 0) {
        laundryHold -= dt
        if (laundryHold <= 0) {
          movers.xe1.laundryBags = 0
          refreshVan(movers.xe1)
        }
      }
      for (const m of Object.values(movers)) {
        if (!m.path) continue
        m.elapsed += dt
        m.anim += dt
        const k = Math.min(1, m.elapsed / m.dur)
        let d = ease(k) * m.total
        let i = 0
        while (i < m.lens.length - 1 && d > m.lens[i]) {
          d -= m.lens[i]
          i++
        }
        const a = m.path[i]
        const b = m.path[i + 1]
        const f = m.lens[i] ? Math.min(1, d / m.lens[i]) : 1
        m.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
        if (m.sprite === 'xe1' && Math.abs(b.x - a.x) > 1) m.c.scale.x = b.x < a.x ? -1 : 1
        if (m.frames) {
          const alt = Math.floor(m.anim / 110) % 2 === 1
          m.frames[0].visible = !alt
          m.frames[1].visible = alt
        }
        place(m)
        if (k >= 1) finish(m)
      }
    },
    setTime(t) {
      const n = nightOf(t)
      night.alpha = n
      lights.alpha = Math.min(1, n / 0.4)
    },
    vanTag() {
      const m = movers.xe1
      if (!m || m.laundryBags <= 0) return null
      return { x: m.pos.x, y: m.pos.y - 58, text: `${m.laundryBags} túi đồ giặt` }
    },
    reset() {
      for (const m of Object.values(movers)) {
        const home = homeSpot(m.sprite)
        m.path = null
        m.onArrive = null
        m.node = home.node
        m.loc = m.sprite === 'xe1' ? 'loc_kho' : null
        m.pos = { ...home.at }
        m.bags = 0
        m.laundryBags = 0
        if (m.bag) m.bag.visible = false
        if (m.frames) {
          m.frames[0].visible = true
          m.frames[1].visible = false
        }
        m.c.scale.x = 1
        refreshVan(m)
        place(m)
      }
      tramBags = 0
      laundryHold = 0
      drawShelf()
    },
    destroy() {
      app.destroy({ removeView: true }, { children: true })
    },
  }
  return api
}
