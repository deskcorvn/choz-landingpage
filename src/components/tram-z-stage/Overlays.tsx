'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { IconCheck } from './icons'
import { CARDS_X, cardAnchor } from './layout'
import { APPROVAL_KIND } from './roster'
import { speakerLabel, type Beam, type Bubble, type Flight, type Tick } from './state'

const MAP_MIN_X = 250
const MAP_MAX_X = 1152 - 250
const HEAD = 58
/** stage y below which a stacked bubble must stay (top of the map band) */
const MAP_TOP = 96

/** Rough rendered height of a bubble (max 460 px wide, 24 px text) so nearby map bubbles can stack. */
const bubbleH = (text: string) => 50 + Math.ceil(text.length / 32) * 30

/** Map bubbles near each other stack upwards, newest closest to the speaker. */
function layoutMap(bubbles: Bubble[]): Record<string, { x: number; y: number } | null> {
  const out: Record<string, { x: number; y: number } | null> = {}
  const placed: { x: number; top: number; bottom: number }[] = []
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]
    if (b.side !== 'map') continue
    const x = Math.min(MAP_MAX_X, Math.max(MAP_MIN_X, b.x))
    const h = bubbleH(b.text)
    let bottom = b.y - HEAD
    for (let guard = 0; guard < 8; guard++) {
      const hit = placed.find((p) => Math.abs(p.x - x) < 440 && bottom > p.top && bottom - h < p.bottom)
      if (!hit) break
      bottom = hit.top - 8
    }
    if (bottom - h < MAP_TOP) {
      out[b.id] = null // no room above: the older bubble gives way
      continue
    }
    placed.push({ x, top: bottom - h, bottom })
    out[b.id] = { x, y: bottom }
  }
  return out
}

/** Speech bubbles: agents' next to their card, everyone else's above their head on the map. */
export function Bubbles({ bubbles, slow }: { bubbles: Bubble[]; slow: number }) {
  const mapPos = layoutMap(bubbles)
  return (
    <div className="tzs-overlay">
      <AnimatePresence>
        {bubbles.map((b) => {
          const card = b.side === 'card'
          const pos = card ? { x: b.x - 18, y: b.y } : mapPos[b.id]
          if (!pos) return null
          const { x, y } = pos
          return (
            <div key={b.id} className="tzs-anchor" style={{ left: x, top: y }}>
              <div className={card ? 'tzs-bubble-pos-card' : 'tzs-bubble-pos-map'}>
                <motion.div
                  className={`tzs-bubble ${b.kind} ${card ? 'card' : 'map'}`}
                  style={{ transformOrigin: card ? 'right center' : 'center bottom' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.22 * slow, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="tzs-bubble-who">{speakerLabel(b.who, b.to)}</div>
                  <div className="tzs-bubble-text">{b.text}</div>
                </motion.div>
              </div>
            </div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/** Handoff: a beam of light arcing from one agent card to another. */
export function Beams({ beams, slow }: { beams: Beam[]; slow: number }) {
  return (
    <svg className="tzs-beams" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="tzs-beam-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7b00" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <filter id="tzs-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <AnimatePresence>
        {beams.map((b) => {
          const a = cardAnchor(b.from)
          const c = cardAnchor(b.to)
          const x = CARDS_X + 2
          const bow = 70 + Math.abs(c.y - a.y) * 0.35
          const d = `M ${x} ${a.y} C ${x - bow} ${a.y}, ${x - bow} ${c.y}, ${x} ${c.y}`
          return (
            <motion.g key={b.id} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 * slow }}>
              <motion.path
                d={d}
                fill="none"
                stroke="url(#tzs-beam-grad)"
                strokeWidth={7}
                strokeLinecap="round"
                filter="url(#tzs-glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 * slow, ease: 'easeOut' }}
              />
              <motion.circle
                r={10}
                fill="#ff7b00"
                filter="url(#tzs-glow)"
                cx={x}
                cy={c.y}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 * slow, duration: 0.2 * slow }}
              />
            </motion.g>
          )
        })}
      </AnimatePresence>
    </svg>
  )
}

/** approve_request: a yellow card flies from the agent to the person who must approve. */
export function Flights({ flights, slow }: { flights: Flight[]; slow: number }) {
  return (
    <div className="tzs-overlay">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="tzs-flight"
            initial={{ x: f.from.x - 60, y: f.from.y, opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ x: f.to.x - 150, y: f.to.y - 40, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.75 * slow, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tzs-flight-card">
              <div className="k">CẦN DUYỆT</div>
              <div className="v">{APPROVAL_KIND[f.label] ?? 'Duyệt'}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** approve: a green tick on the person who approved. */
export function Ticks({ ticks, slow }: { ticks: Tick[]; slow: number }) {
  return (
    <div className="tzs-overlay">
      <AnimatePresence>
        {ticks.map((t) => (
          <div key={t.id} className="tzs-tick" style={{ left: t.x + 40, top: t.y - 40 }}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.4 * slow }}
            >
              <IconCheck />
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
