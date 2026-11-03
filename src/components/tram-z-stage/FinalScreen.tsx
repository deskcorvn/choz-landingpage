'use client'

import { motion } from 'framer-motion'
import { Fragment, useEffect, useState } from 'react'

import { fmtDec, fmtInt, fmtPct, fmtVnd } from './format'
import type { Headcount, HeadcountBlock } from './types'

export const FINAL_HOLD_MS = 8000
export const FOOTNOTE = 'định mức thủ công là giả định, số có agent đo từ ngày mô phỏng'
export const CLOSING = 'Agent làm phần lặp, con người duyệt và chịu trách nhiệm.'

interface Row {
  label: string
  manual: string
  agent: string
  unit?: string
}

function rowsOf(b: HeadcountBlock): Row[] {
  return [
    { label: 'Người cần', manual: fmtDec(b.manual_people), agent: fmtDec(b.with_agents_people), unit: 'người' },
    { label: 'Agent', manual: '0', agent: fmtInt(b.agents) },
    { label: 'Chi phí agent / tháng', manual: '—', agent: fmtVnd(b.agent_cost_vnd_month) },
    { label: 'Phút người tiết kiệm', manual: '—', agent: fmtPct(b.human_minutes_saved_pct) },
    { label: 'Chi phí agent / đơn', manual: '—', agent: fmtVnd(b.agent_cost_vnd_per_order) },
  ]
}

function Table({ title, sub, block, delay }: { title: string; sub: string; block: HeadcountBlock; delay: number }) {
  const rows = rowsOf(block)
  return (
    <motion.div
      className="tzs-table"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="tzs-table-title">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <div className="tzs-table-grid">
        <div className="h" />
        <div className="h">Làm tay</div>
        <div className="h agent">Với agent</div>
        {rows.map((r, i) => (
          <Fragment key={r.label}>
            <motion.div className="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5 + i * 0.55 }}>
              {r.label}
            </motion.div>
            <motion.div className="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.6 + i * 0.55 }}>
              {r.manual}
              {r.unit && r.manual !== '—' && <span className="unit">{r.unit}</span>}
            </motion.div>
            <motion.div
              className={r.agent.length > 9 ? 'a long' : 'a'}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.75 + i * 0.55 }}
            >
              {r.agent}
              {r.unit && <span className="unit">{r.unit}</span>}
            </motion.div>
          </Fragment>
        ))}
      </div>
    </motion.div>
  )
}

/** Final screen: 1 trạm vs 50 trạm, numbers only from headcount.json. Holds 8 s, then waits for a click. */
export function FinalScreen({
  headcount,
  logoSrc,
  onClose,
  immediate,
  mode,
}: {
  headcount: Headcount | null
  logoSrc: string
  onClose: () => void
  immediate?: boolean
  mode: string | null
}) {
  const [closable, setClosable] = useState(!!immediate)
  useEffect(() => {
    if (immediate) return
    const id = window.setTimeout(() => setClosable(true), FINAL_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [immediate])

  const t1 = headcount?.tram_1
  const t50 = headcount?.tram_50
  return (
    <motion.div
      className={`tzs-final ${closable ? 'closable' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onClick={() => closable && onClose()}
    >
      <div className="tzs-final-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" />
        <div>
          <h2>Cùng khối việc: 1 trạm và 50 trạm</h2>
          <div className="sub">Số người và chi phí cho cùng khối việc, làm tay so với có agent</div>
        </div>
      </div>
      {t1 && t50 ? (
        <div className="tzs-final-tables">
          <Table title="1 trạm" sub={`${fmtInt(t1.orders_per_day)} đơn/ngày`} block={t1} delay={0.4} />
          <Table title="50 trạm" sub={`${fmtInt(t50.orders_per_day)} đơn/ngày`} block={t50} delay={0.9} />
        </div>
      ) : (
        <div className="tzs-msg">Chưa đọc được headcount.json</div>
      )}
      <div className="tzs-final-foot">
        <motion.div className="tzs-final-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.6 }}>
          {FOOTNOTE}
        </motion.div>
        <motion.div
          className="tzs-final-close"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5.6, duration: 0.6 }}
        >
          {CLOSING}
        </motion.div>
      </div>
      {mode === 'mock' && <div className="tzs-final-mode mock">DỮ LIỆU MOCK</div>}
      {mode === 'live' && <div className="tzs-final-mode live">Chạy thật · Claude + Meta</div>}
      {closable && <div className="tzs-final-hint">Bấm để đóng</div>}
    </motion.div>
  )
}
