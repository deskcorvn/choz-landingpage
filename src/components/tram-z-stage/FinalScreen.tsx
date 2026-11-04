'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { fmtDec, fmtInt, fmtPct, fmtVnd } from './format'
import { AGENTS } from './roster'
import type { Headcount, HeadcountBlock, RoleRow } from './types'

export const FINAL_PAGE_MS = 8000
export const FOOTNOTE = 'định mức thủ công và lương là giả định, số có agent đo từ ngày mô phỏng'
export const CLOSING = 'Agent làm phần lặp, con người duyệt và chịu trách nhiệm.'

export interface FinalColumn {
  title: string
  roles: RoleRow[]
  people: number
  peopleCost: number
  agents: number
  agentCost: number
  total: number
}

/** The two columns of one block, numbers only from headcount.json (missing fields → 0, shown as such). */
export function finalColumns(b: HeadcountBlock): { manual: FinalColumn; agents: FinalColumn; saving: number } {
  const rm = b.roles_manual ?? []
  const ra = b.roles_with_agents ?? []
  const pcm = b.people_cost_vnd_month_manual ?? rm.reduce((n, r) => n + r.cost_vnd_month, 0)
  const pca = b.people_cost_vnd_month_with_agents ?? ra.reduce((n, r) => n + r.cost_vnd_month, 0)
  const ac = b.agent_cost_vnd_month ?? 0
  const manual: FinalColumn = { title: 'Chỉ con người', roles: rm, people: b.manual_people, peopleCost: pcm, agents: 0, agentCost: 0, total: b.total_cost_vnd_month_manual ?? pcm }
  const agents: FinalColumn = {
    title: 'Con người + đội agent',
    roles: ra,
    people: b.with_agents_people,
    peopleCost: pca,
    agents: b.agents,
    agentCost: ac,
    total: b.total_cost_vnd_month_with_agents ?? pca + ac,
  }
  return { manual, agents, saving: b.saving_vnd_month ?? manual.total - agents.total }
}

const ucFirst = (t: string) => (t ? t[0].toLocaleUpperCase('vi') + t.slice(1) : t)

function Column({ c, side, delay }: { c: FinalColumn; side: 'manual' | 'agents'; delay: number }) {
  return (
    <motion.div className={`tzs-col ${side}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div className="tzs-col-title">{c.title}</div>
      <div className="tzs-col-h">
        <span>Người</span>
        <span>số người</span>
        <span>đ / tháng</span>
      </div>
      {c.roles.map((r, i) => (
        <motion.div key={r.role} className="tzs-col-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 + i * 0.12 }}>
          <span className="role">{ucFirst(r.role)}</span>
          <span className="n">{fmtDec(r.people)}</span>
          <span className="vnd">{fmtVnd(r.cost_vnd_month)}</span>
        </motion.div>
      ))}
      <div className="tzs-col-sum">
        <span className="role">Cộng người</span>
        <span className="n">{fmtDec(c.people)}</span>
        <span className="vnd">{fmtVnd(c.peopleCost)}</span>
      </div>
      {side === 'agents' ? (
        <>
          <div className="tzs-col-h">
            <span>Agent</span>
            <span />
            <span />
          </div>
          <div className="tzs-agent-grid">
            {AGENTS.map((a, i) => (
              <motion.div key={a.code} className="tzs-agent-cell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.9 + i * 0.1 }}>
                <span className="role">{a.name}</span>
                <span className="job">{a.role}</span>
              </motion.div>
            ))}
          </div>
          <div className="tzs-col-sum">
            <span className="role">{fmtInt(c.agents)} agent ({AGENTS.filter((a) => a.provider === 'claude').length} Claude, {AGENTS.filter((a) => a.provider === 'meta').length} Meta)</span>
            <span className="n" />
            <span className="vnd">{fmtVnd(c.agentCost)}</span>
          </div>
        </>
      ) : (
        <div className="tzs-col-none">Không có agent · mọi việc giấy tờ, tính toán làm tay</div>
      )}
      <div className="tzs-col-total">
        <span>Tổng mỗi tháng</span>
        <b>{fmtVnd(c.total)}</b>
      </div>
    </motion.div>
  )
}

function Page({ block, label }: { block: HeadcountBlock; label: string }) {
  const { manual, agents, saving } = finalColumns(block)
  return (
    <motion.div
      className="tzs-final-page"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="tzs-final-sub">
        <b>{label}</b> · {fmtInt(block.orders_per_day)} đơn mỗi ngày · cùng một khối việc, hai cách vận hành
      </div>
      <div className="tzs-final-cols">
        <Column c={manual} side="manual" delay={0.2} />
        <div className="tzs-final-vs">so với</div>
        <Column c={agents} side="agents" delay={0.5} />
      </div>
      <motion.div className="tzs-final-diff" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 0.5 }}>
        <div className="tzs-diff-item">
          <div className="val">{fmtVnd(saving)}</div>
          <div className="lbl">ít hơn mỗi tháng khi có đội agent (theo định mức và lương giả định)</div>
        </div>
        <div className="tzs-diff-item">
          <div className="val">{fmtPct(block.human_minutes_saved_pct)}</div>
          <div className="lbl">phút công người giảm</div>
        </div>
        <div className="tzs-diff-item">
          <div className="val">{fmtVnd(block.agent_cost_vnd_per_order)}</div>
          <div className="lbl">chi phí agent cho mỗi đơn</div>
        </div>
        <div className="tzs-diff-item">
          <div className="val">
            {fmtDec(manual.people)} → {fmtDec(agents.people)}
          </div>
          <div className="lbl">người cần có (quy ra giờ công)</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Final screen: the same work done by people only vs people plus the agent team, for 1 station then 50.
 * Each page holds FINAL_PAGE_MS; after the second it waits for a click. Numbers only from headcount.json.
 */
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
  const [page, setPage] = useState<0 | 1>(0)
  const [closable, setClosable] = useState(!!immediate)
  useEffect(() => {
    if (immediate) return
    const a = window.setTimeout(() => setPage(1), FINAL_PAGE_MS)
    const b = window.setTimeout(() => setClosable(true), FINAL_PAGE_MS * 2)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [immediate])

  const t1 = headcount?.tram_1
  const t50 = headcount?.tram_50
  const onClick = () => {
    if (page === 0) setPage(1)
    else if (closable) onClose()
  }
  return (
    <motion.div
      className={`tzs-final ${closable ? 'closable' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onClick={onClick}
      data-final-page={page + 1}
    >
      <div className="tzs-final-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" />
        <div>
          <h2>Cùng khối việc: chỉ con người, hay con người cộng đội agent</h2>
          <div className="sub">Bao nhiêu người, bao nhiêu agent, hết bao nhiêu tiền mỗi tháng</div>
        </div>
        <div className="tzs-final-tabs" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={page === 0 ? 'on' : ''} onClick={() => setPage(0)}>
            1 trạm
          </button>
          <button type="button" className={page === 1 ? 'on' : ''} onClick={() => setPage(1)}>
            50 trạm
          </button>
        </div>
      </div>
      {t1 && t50 ? (
        <AnimatePresence mode="wait">
          {page === 0 ? <Page key="p1" block={t1} label="1 trạm" /> : <Page key="p50" block={t50} label="50 trạm" />}
        </AnimatePresence>
      ) : (
        <div className="tzs-msg">Chưa đọc được headcount.json</div>
      )}
      <div className="tzs-final-foot">
        <div className="tzs-final-note">{FOOTNOTE}</div>
        <motion.div className="tzs-final-close" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6 }}>
          {CLOSING}
        </motion.div>
      </div>
      {mode === 'mock' && <div className="tzs-final-mode mock">DỮ LIỆU MẪU</div>}
      {mode === 'live' && <div className="tzs-final-mode live">Chạy thật · Claude + Meta</div>}
      <div className="tzs-final-hint">{closable ? 'Bấm để đóng' : page === 0 ? 'Bấm để xem 50 trạm' : ''}</div>
    </motion.div>
  )
}
