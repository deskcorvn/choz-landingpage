'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { fmtDec, fmtInt, fmtPct, fmtVnd } from './format'
import { AGENTS } from './roster'
import type { Headcount, HeadcountBlock, HeadcountView, RoleRow } from './types'

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

/**
 * The two kinds of work, side by side: paperwork (what agents take over) and physical work (the same minutes on
 * both sides). One station is shown in minutes per day, because "1 person vs 1 person" says nothing.
 */
export function BlockStrip({ b }: { b: HeadcountBlock }) {
  const o = b.office
  const p = b.physical
  if (!o || !p) return null
  const one = b.stations === 1
  const f = one ? (n: number) => `${fmtDec(n)} phút/ngày` : (n: number) => `${fmtDec(n)} người`
  const rows = [
    {
      key: 'office',
      k: 'Việc giấy tờ, tính toán',
      m: f(one ? o.manual_minutes : o.manual_people),
      arrow: '→',
      a: `${f(one ? o.with_agents_minutes : o.with_agents_people)} + ${fmtInt(b.agents)} agent`,
      s: 'nhận đặt Giỏ, gom nhu cầu, đăng bán, kiểm tin, lịch xe, trả lời khách, đối soát, báo cáo',
    },
    {
      key: 'physical',
      k: 'Việc tay chân',
      m: f(one ? p.minutes : p.people),
      arrow: '=',
      a: f(one ? p.minutes : p.people),
      s: 'chia hàng ở kho, nhận hàng, giao túi cho khách · agent không thay',
    },
    {
      key: 'total',
      k: 'Cả ngày',
      m: f(one ? (b.manual_minutes ?? o.manual_minutes + p.minutes) : b.manual_people),
      arrow: '→',
      a: f(one ? (b.with_agents_minutes ?? o.with_agents_minutes + p.minutes) : b.with_agents_people),
      s: one ? 'tính bằng phút mỗi ngày: một trạm chưa tới một người' : 'quy ra người theo giờ công: 480 phút một ngày, hệ số dự phòng 1,2',
    },
  ]
  return (
    <motion.div className="tzs-final-blocks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} data-blocks={one ? 'minutes' : 'people'}>
      {rows.map((r) => (
        <div key={r.key} className={`tzs-block ${r.key}`}>
          <div className="k">{r.k}</div>
          <div className="v">
            <span className="m">{r.m}</span>
            <span className="arr">{r.arrow}</span>
            <span className="a">{r.a}</span>
          </div>
          <div className="s">{r.s}</div>
        </div>
      ))}
    </motion.div>
  )
}

function Page({ block, label }: { block: HeadcountBlock; label: string }) {
  const { manual, agents, saving } = finalColumns(block)
  const o = block.office
  const one = block.stations === 1
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
      <BlockStrip b={block} />
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
            {o ? (one ? `${fmtDec(o.manual_minutes)} → ${fmtDec(o.with_agents_minutes)}` : `${fmtDec(o.manual_people)} → ${fmtDec(o.with_agents_people)}`) : `${fmtDec(manual.people)} → ${fmtDec(agents.people)}`}
          </div>
          <div className="lbl">{o ? (one ? 'phút giấy tờ mỗi ngày, làm tay → với agent' : 'người cho việc giấy tờ, làm tay → với agent') : 'người cần có (quy ra giờ công)'}</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Every number of the comparison page, from headcount.json `view.central_50.people_summary` only: whole people,
 * money in triệu as the file gives it, the cost line and the headline verbatim. */
export function peopleNumbers(v: HeadcountView) {
  const ps = v.central_50.people_summary!
  return {
    manual: `khoảng ${fmtInt(ps.manual_people)} người`,
    agent: `khoảng ${fmtInt(ps.with_agents_people)} người + ${fmtInt(ps.agents)} agent`,
    costFrom: `khoảng ${fmtInt(ps.manual_cost_trieu)} triệu`,
    costTo: `khoảng ${fmtInt(ps.with_agents_cost_trieu)} triệu`,
    fee: `${fmtInt(ps.fee_pool_trieu)} triệu`,
    within: ps.within_fee_pool,
    costLine: ps.cost_line,
    groups: ps.groups.map((g) => ({
      key: g.key,
      label: g.label,
      manual: fmtInt(g.manual),
      agent: fmtInt(g.with_agents),
      same: g.same_both_sides,
    })),
    totalManual: fmtInt(ps.manual_people),
    totalAgent: `${fmtInt(ps.with_agents_people)} + ${fmtInt(ps.agents)} agent`,
    transport: ps.transport_note,
    headline: ps.headline,
  }
}

/** The cost line exactly as the file gives it: the "khoảng N triệu" amounts large on one line, the rest of the
 * sentence below it, with ✓ when the agent side fits in the fee. */
function CostLine({ text, within }: { text: string; within: boolean }) {
  const amount = /khoảng \d+ triệu/g
  let end = 0
  for (const m of text.matchAll(amount)) end = m.index + m[0].length
  const parts = text.slice(0, end).split(/(khoảng \d+ triệu)/)
  let k = 0
  return (
    <>
      <div className="tzs-pp-line money">
        {parts.map((t, i) =>
          /^khoảng \d+ triệu$/.test(t) ? (
            <span key={i} className={`big ${k++ === 0 ? 'manual' : 'agent'}`}>{t}</span>
          ) : (
            t.trim() && <span key={i} className="lbl">{t.trim()}</span>
          ),
        )}
      </div>
      <div className="tzs-pp-tail">
        {text.slice(end).trim()}
        {within && <span className="ok"> ✓</span>}
      </div>
    </>
  )
}

/** The comparison for 50 stations: people and money only (no minutes, no formulas). */
function PeoplePage({ v }: { v: HeadcountView }) {
  const n = peopleNumbers(v)
  const appear = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.3 + i * 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  })
  return (
    <motion.div className="tzs-v-page tzs-pp" data-page="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
      <div className="tzs-pp-lines">
        <motion.div className="tzs-pp-line" {...appear(0)}>
          <span className="lbl">Làm thủ công:</span> <span className="big manual">{n.manual}</span>
        </motion.div>
        <motion.div className="tzs-pp-line" {...appear(1)}>
          <span className="lbl">Có đội agent:</span> <span className="big agent">{n.agent}</span>
        </motion.div>
        <motion.div {...appear(2)}>
          <CostLine text={n.costLine} within={n.within} />
        </motion.div>
      </div>
      <motion.div className="tzs-pp-table" {...appear(3)}>
        <div className="h" />
        <div className="h">Thủ công</div>
        <div className="h" />
        <div className="h agent">Có agent</div>
        {n.groups.map((g) => (
          <div key={g.key} className="tzs-pp-row" style={{ display: 'contents' }}>
            <div className="r">
              {g.label}
              {g.same && <span className="same">giống nhau ở hai bên</span>}
            </div>
            <div className="m">{g.manual}</div>
            <div className="eq">{g.same ? '=' : '→'}</div>
            <div className="a">{g.agent}</div>
          </div>
        ))}
        <div className="r tot">Tổng</div>
        <div className="m tot">{n.totalManual}</div>
        <div className="eq tot">→</div>
        <div className="a tot">{n.totalAgent}</div>
      </motion.div>
      <motion.div className="tzs-pp-note" {...appear(4)}>{n.transport}</motion.div>
    </motion.div>
  )
}

/** "12.5 tr", "1.20", "× 1.318" (Python decimals) → Vietnamese decimal comma. */
/** "ASSUMED" / "ASSUMED, chờ Chợ Z" (sim/staffing.py) → plain words for the jury. */
export const sourceLabel = (t: string) =>
  t.startsWith('ASSUMED') ? 'giả định, chờ Chợ Z xác nhận' : t

export const viDecimal = (t: string) => t.replace(/(\d)\.(\d)/g, '$1,$2')

function SourcesPage({ v }: { v: HeadcountView }) {
  const rows = v.assumptions ?? []
  const m = v.central_50.agent_cost_model
  return (
    <motion.div className="tzs-v-page tzs-src" data-page="sources" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="tzs-v-sub">
        <b>Nguồn số liệu</b> · mỗi con số trên trang trước lấy từ đây; đổi một dòng, cả hai cột đổi theo
      </div>
      <div className="tzs-src-list">
        {rows.map((a) => (
          <div key={a.what} className="tzs-src-row">
            <span className="what">{a.what}</span>
            <span className="value">{viDecimal(a.value)}</span>
            <span className="source">{sourceLabel(a.source)}</span>
          </div>
        ))}
        {v.central_50.fee_pool && (
          <div className="tzs-src-row">
            <span className="what">Phí nuôi bộ máy</span>
            <span className="value">{fmtVnd(v.central_50.fee_pool.vnd_month)}/tháng</span>
            <span className="source">{v.central_50.fee_pool.source}</span>
          </div>
        )}
        {v.central_50.same_flow_note && (
          <div className="tzs-src-row">
            <span className="what">Hai cột</span>
            <span className="value">{v.central_50.same_flow_note}</span>
            <span className="source">{viDecimal(v.central_50.rounding)}. Không gồm: {v.excluded.join('; ')}</span>
          </div>
        )}
        {m && (
          <div className="tzs-src-row">
            <span className="what">Chi phí agent ở 50 trạm</span>
            <span className="value">≈ {fmtVnd(m.cost_vnd_per_order_1500)}/đơn</span>
            <span className="source">
              {m.method}: {m.fit_points.map((p) => `${fmtInt(p.orders)} đơn ${fmtVnd(p.cost_vnd_day)}/ngày`).join(' · ')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Final screen: the same work done by people only vs people plus the agent team, for 1 station then 50.
 * People view: one page that holds FINAL_PAGE_MS, then waits for a click (a click opens the sources page).
 * Older files: 1 trạm then 50 trạm. Numbers only from headcount.json.
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
  const view = headcount?.view
  const people = !!view?.central_50?.people_summary
  const t1 = headcount?.tram_1
  const t50 = headcount?.tram_50
  const hasSources = !!view?.assumptions?.length
  // With the people view the timed flow is one page; the sources page is only reachable by click.
  const pages = people ? 1 : 2
  const [page, setPage] = useState<0 | 1 | 2>(0)
  const [closable, setClosable] = useState(!!immediate)
  useEffect(() => {
    if (immediate) return
    const a = pages > 1 ? window.setTimeout(() => setPage(1), FINAL_PAGE_MS) : 0
    const b = window.setTimeout(() => setClosable(true), FINAL_PAGE_MS * pages)
    return () => {
      if (a) window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [immediate, pages])

  const onClick = () => {
    if (people) {
      if (page === 0 && hasSources && closable) setPage(1)
      else if (closable) onClose()
      return
    }
    if (page === 0) setPage(1)
    else if (closable) onClose()
  }
  return (
    <motion.div
      className={`tzs-final ${closable ? 'closable' : ''} ${people ? 'tzs-final-people' : ''}`}
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
          <h2>{people ? '50 trạm, 1.500 đơn mỗi ngày: cùng khối lượng việc' : 'Cùng khối việc: chỉ con người, hay con người cộng đội agent'}</h2>
          <div className="sub">{people ? 'Bao nhiêu người, hết bao nhiêu tiền mỗi tháng' : 'Bao nhiêu người, bao nhiêu agent, hết bao nhiêu tiền mỗi tháng'}</div>
        </div>
      </div>
      {people && view ? (
        <AnimatePresence mode="wait">
          {page === 0 ? <PeoplePage key="pp" v={view} /> : <SourcesPage key="src" v={view} />}
        </AnimatePresence>
      ) : t1 && t50 ? (
        <AnimatePresence mode="wait">
          {page === 0 ? <Page key="p1" block={t1} label="1 trạm" /> : <Page key="p50" block={t50} label="50 trạm" />}
        </AnimatePresence>
      ) : (
        <div className="tzs-msg">Chưa đọc được headcount.json</div>
      )}
      <div className="tzs-final-foot">
        {people && view ? (
          <motion.div className="tzs-final-close" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.4, duration: 0.6 }}>
            {view.central_50.people_summary!.headline}
          </motion.div>
        ) : (
          <>
            <div className="tzs-final-note">{FOOTNOTE}</div>
            <motion.div className="tzs-final-close" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6 }}>
              {CLOSING}
            </motion.div>
          </>
        )}
      </div>
      {mode === 'mock' && <div className="tzs-final-mode mock">DỮ LIỆU MẪU</div>}
      {mode === 'live' && <div className="tzs-final-mode live">Chạy thật · Claude + Meta</div>}
      <div className="tzs-final-hint">
        {people
          ? closable
            ? page === 0 && hasSources
              ? 'Bấm để xem nguồn số liệu'
              : 'Bấm để đóng'
            : ''
          : page === 0
            ? 'Bấm để xem 50 trạm'
            : closable
              ? 'Bấm để đóng'
              : ''}
      </div>
    </motion.div>
  )
}
