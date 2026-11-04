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

const dec1 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

/** "119 phút" → "khoảng 2 giờ"; "42,5" → "43 phút": what a listener can picture. */
export function aboutTime(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  const r = m % 60
  if (r <= 5) return `khoảng ${h} giờ`
  if (r >= 55) return `khoảng ${h + 1} giờ`
  return `${h} giờ ${r} phút`
}

/** Every number of the two pages, from headcount.json `view` only (a test checks there are no fractional people). */
export function viewNumbers(v: HeadcountView) {
  const st = v.station
  const c = v.central_50
  return {
    stationManual: `${fmtInt(st.manual_minutes_day)} phút/ngày`,
    stationAgent: `${fmtInt(st.with_agents_minutes_day)} phút/ngày`,
    stationAbout: `${aboutTime(st.manual_minutes_day)} → ${aboutTime(st.with_agents_minutes_day)}`,
    share: `Trạm nhận ${fmtInt(st.share_pct)} % phí: ${fmtVnd(st.share_vnd_day)}/ngày ≈ ${fmtVnd(st.share_vnd_month)}/tháng`,
    manualPeople: `${fmtInt(c.manual_people)} người`,
    agentPeople: `${fmtInt(c.with_agents_people)} người + ${fmtInt(c.agents)} agent`,
    manualCost: fmtVnd(c.manual_cost_vnd_month),
    agentCost: fmtVnd(c.with_agents_cost_vnd_month),
    saving: fmtVnd(c.saving_vnd_month),
    perOrder: fmtVnd(c.agent_cost_model?.cost_vnd_per_order_1500 ?? v.agent_cost_vnd_per_order),
    officeManual: `${fmtInt(c.office_people_manual ?? 0)} người`,
    officeAgent: `${fmtInt(c.office_people_with_agents ?? 0)} người + ${fmtInt(c.agents)} agent`,
    agentNote: `≈ ${fmtVnd(c.agent_cost_model?.cost_vnd_per_order_1500 ?? v.agent_cost_vnd_per_order)}/đơn, đo từ các lượt chạy thật 30, 150, 300 đơn`,
    people: [...c.manual, ...c.with_agents].map((r) => r.people),
  }
}

function StationPage({ v }: { v: HeadcountView }) {
  const st = v.station
  const c1 = v.central_1
  const n = viewNumbers(v)
  return (
    <motion.div className="tzs-v-page" data-page="station" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="tzs-v-sub">
        <b>Tại mỗi Trạm Z</b> · người trực trạm: chủ tiệm hoặc bạn trẻ, cùng một người ở cả hai cách
      </div>
      <div className="tzs-v-hero">
        <div className="side manual">
          <div className="k">Chỉ con người</div>
          <div className="big">{n.stationManual}</div>
        </div>
        <div className="arr">→</div>
        <div className="side agents">
          <div className="k">Con người + agent</div>
          <div className="big">{n.stationAgent}</div>
        </div>
        <div className="about">
          {n.stationAbout}
          <span>việc Chợ Z mỗi ngày của người trực trạm</span>
        </div>
      </div>
      <div className="tzs-v-grid">
        <div className="tzs-v-table">
          <div className="h">
            <span>Việc ở trạm</span>
            <span>Làm tay</span>
            <span>Có agent</span>
          </div>
          {st.rows.map((r, i) => (
            <motion.div key={r.task} className={`r ${r.kind === 'tay_chan' ? 'phys' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <span className="task">
                {r.task}
                {r.kind === 'tay_chan' && <em>tay chân, giữ nguyên</em>}
              </span>
              <span className="m">{r.manual_min ? `${dec1.format(r.manual_min)} phút` : '—'}</span>
              <span className="a">{r.with_agent_min ? `${dec1.format(r.with_agent_min)} phút` : '0'}</span>
            </motion.div>
          ))}
        </div>
        <div className="tzs-v-side">
          <div className="box money">
            <div className="t">{n.share}</div>
            <div className="s">Không tính lương ở cả hai bên: người trực trạm được trả bằng phần phí này.</div>
          </div>
          <div className="box pilot">
            <div className="k">Một trạm thử nghiệm: văn phòng và kho</div>
            <div className="t">
              Giấy tờ văn phòng: {fmtInt(c1.office_minutes_day_manual)} phút/ngày làm tay → agent làm, chủ kho duyệt {fmtInt(c1.approval_minutes_day_with_agents)} phút/ngày
            </div>
            <div className="t">Chia hàng ở kho: {fmtInt(c1.kho_minutes_day)} phút/ngày, giữ nguyên</div>
            <div className="s">Một trạm chưa đủ việc cho bộ máy riêng nên tính bằng phút.</div>
          </div>
        </div>
      </div>
      <motion.div className="tzs-v-msg" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.5 }}>
        Agent không thay người trực trạm; agent bớt giấy tờ cho người đó.
      </motion.div>
    </motion.div>
  )
}

type TeamRow = HeadcountView['central_50']['manual'][number]

const KIND_TITLE: Record<string, string> = {
  van_phong: 'Việc giấy tờ, tính toán',
  tay_chan: 'Việc tay chân — giữ nguyên ở cả hai bên',
  quan_ly: 'Quản lý',
}
const KIND_ORDER = ['van_phong', 'tay_chan', 'quan_ly']

export interface CentralLine {
  role: string
  kind: string
  manual: TeamRow | null
  agent: TeamRow | null
  same: boolean
}

/** One line per role, grouped by kind, manual and with-agent side by side (rows only from headcount.json). */
export function centralLines(c: HeadcountView['central_50']): { kind: string; title: string; lines: CentralLine[] }[] {
  const roles: string[] = []
  for (const r of [...c.manual, ...c.with_agents]) if (!roles.includes(r.role)) roles.push(r.role)
  const kindOf = (role: string) =>
    (c.manual.find((r) => r.role === role)?.kind ?? c.with_agents.find((r) => r.role === role)?.kind ?? 'van_phong') as string
  return KIND_ORDER.map((kind) => {
    const lines = roles
      .filter((role) => kindOf(role) === kind)
      .map((role) => {
        const manual = c.manual.find((r) => r.role === role) ?? null
        const agent = c.with_agents.find((r) => r.role === role) ?? null
        return { role, kind, manual, agent, same: kind === 'tay_chan' && !!manual && !!agent && manual.people === agent.people }
      })
    return { kind, title: KIND_TITLE[kind] ?? kind, lines }
  }).filter((g) => g.lines.length > 0)
}

function Cell({ r }: { r: TeamRow | null }) {
  if (!r) return <><span className="n dim">—</span><span className="vnd dim">agent làm</span></>
  return (
    <>
      <span className="n">{fmtInt(r.people)}</span>
      <span className="vnd">{fmtVnd(r.cost_vnd_month)}</span>
    </>
  )
}

function CentralPage({ v }: { v: HeadcountView }) {
  const c = v.central_50
  const n = viewNumbers(v)
  const groups = centralLines(c)
  return (
    <motion.div className="tzs-v-page tzs-c50" data-page="central" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="tzs-v-sub">
        <b>Bộ máy trung tâm (văn phòng + kho) cho 50 trạm</b>, 1.500 đơn/ngày · người nguyên, lương thật
      </div>
      <div className="tzs-c50-hero">
        <div className="cmp">
          <span className="m">{n.manualPeople} · {n.manualCost}/tháng</span>
          <span className="arr">→</span>
          <span className="a">{n.agentPeople} · {n.agentCost}/tháng</span>
        </div>
        <div className="line2">
          <div className="office">
            Việc giấy tờ: <b>{n.officeManual}</b> → <b>{n.officeAgent}</b>
          </div>
          <motion.div className="saving" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }}>
            <b>{n.saving}</b> mỗi tháng ít hơn
          </motion.div>
        </div>
      </div>
      <div className="tzs-c50-grid">
        <div className="tzs-c50-row head">
          <span className="role" />
          <span className="hcol manual">Chỉ con người</span>
          <span className="hcol agent">Con người + {fmtInt(c.agents)} agent</span>
        </div>
        {groups.map((g, gi) => (
          <div key={g.kind} className={`tzs-c50-group ${g.kind}`}>
            <div className="gtitle">{g.title}</div>
            {g.lines.map((l, i) => (
              <motion.div key={l.role} className={`tzs-c50-row ${l.same ? 'same' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + gi * 0.3 + i * 0.07 }}>
                <span className="role">{ucFirst(l.role)}</span>
                <span className="side manual"><Cell r={l.manual} /></span>
                <span className="eq">{l.same ? '=' : ''}</span>
                <span className="side agent"><Cell r={l.agent} /></span>
              </motion.div>
            ))}
          </div>
        ))}
        <div className="tzs-c50-row agents">
          <span className="role">
            {fmtInt(c.agents)} agent: {AGENTS.map((a) => a.name).join(' · ')}
          </span>
          <span className="side manual"><span className="n dim">—</span><span className="vnd dim" /></span>
          <span className="eq" />
          <span className="side agent">
            <span className="n">{fmtInt(c.agents)}</span>
            <span className="vnd">{fmtVnd(c.agents_cost_vnd_month)}</span>
          </span>
        </div>
        <div className="tzs-c50-row total">
          <span className="role">Tổng mỗi tháng</span>
          <span className="side manual"><span className="n">{fmtInt(c.manual_people)}</span><span className="vnd">{n.manualCost}</span></span>
          <span className="eq" />
          <span className="side agent"><span className="n">{fmtInt(c.with_agents_people)}</span><span className="vnd">{n.agentCost}</span></span>
        </div>
      </div>
      <div className="tzs-c50-small">
        <div>
          Agent {n.agentNote}. {RATES_LINE}.
        </div>
        <div>
          {ucFirst(c.rounding)}. Không gồm: {v.excluded.join('; ')}.
        </div>
      </div>
    </motion.div>
  )
}

export const RATES_LINE =
  'Lương: tin tuyển dụng Hải Phòng 2026 + 23,5 % bảo hiểm và công đoàn + lương tháng 13; soạn hàng 100 món/giờ; khách hỏi 10/100 đơn; 20 trạm/tuyến xe'

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
  const [page, setPage] = useState<0 | 1 | 2>(0)
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

  const view = headcount?.view
  const t1 = headcount?.tram_1
  const t50 = headcount?.tram_50
  const hasSources = !!view?.assumptions?.length
  const onClick = () => {
    if (page === 0) setPage(1)
    else if (page === 1 && hasSources) setPage(2)
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
          <div className="sub">
            {view
              ? 'Mỗi trạm tính bằng phút của người đang trực; bộ máy 50 trạm tính bằng người nguyên và tiền mỗi tháng'
              : 'Bao nhiêu người, bao nhiêu agent, hết bao nhiêu tiền mỗi tháng'}
          </div>
        </div>
        <div className="tzs-final-tabs" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={page === 0 ? 'on' : ''} onClick={() => setPage(0)}>
            {view ? 'Mỗi trạm' : '1 trạm'}
          </button>
          <button type="button" className={page === 1 ? 'on' : ''} onClick={() => setPage(1)}>
            50 trạm
          </button>
          {hasSources && (
            <button type="button" className={page === 2 ? 'on' : ''} onClick={() => setPage(2)}>
              Nguồn
            </button>
          )}
        </div>
      </div>
      {view ? (
        <AnimatePresence mode="wait">
          {page === 0 ? <StationPage key="v1" v={view} /> : page === 1 ? <CentralPage key="v50" v={view} /> : <SourcesPage key="src" v={view} />}
        </AnimatePresence>
      ) : t1 && t50 ? (
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
      <div className="tzs-final-hint">
        {page === 0 ? (view ? 'Bấm để xem bộ máy 50 trạm' : 'Bấm để xem 50 trạm') : page === 1 && hasSources ? 'Bấm để xem nguồn số liệu' : closable ? 'Bấm để đóng' : ''}
      </div>
    </motion.div>
  )
}
