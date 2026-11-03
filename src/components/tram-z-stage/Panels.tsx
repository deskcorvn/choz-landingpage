'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { fmtPct, fmtVnd } from './format'
import type { Listing, Settlement } from './state'

const verdictLabel = (l: Listing) => {
  if (!l.verdict) return { cls: '', text: 'Đang kiểm chứng…' }
  const detail = l.verdictText?.replace(/^(pass|warn|block)\s*:\s*/i, '') ?? ''
  if (l.verdict === 'pass') return { cls: 'pass', text: `Đạt · ${detail}` }
  if (l.verdict === 'warn') return { cls: 'warn', text: `Lệch · ${detail}` }
  return { cls: 'block', text: `Chặn · ${detail}` }
}

/** dang_ban: the listings the Meta agents wrote and checked this morning, with the CHẶN stamp on a banned item. */
export function ListingPanel({ listings, slow }: { listings: Listing[]; slow: number }) {
  const shown = listings.slice(-3)
  return (
    <motion.div
      className="tzs-panel"
      style={{ left: 24, top: 428, width: 1104 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35 * slow }}
    >
      <div className="tzs-panel-head">
        <div className="tzs-panel-title">Tin đăng sáng nay</div>
        <div className="tzs-panel-sub">Đăng bán viết tin · Kiểm chứng đối chiếu ảnh, nhãn, luật hàng cấm</div>
      </div>
      <div className="tzs-listings">
        <AnimatePresence>
          {shown.map((l) => {
            const v = verdictLabel(l)
            return (
              <motion.div
                key={l.key}
                className={`tzs-listing ${l.blocked ? 'block' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 * slow }}
              >
                <div className="tzs-listing-title">{l.title}</div>
                <div className="tzs-chips">
                  <span className={`tzs-chip ${v.cls}`}>{v.text}</span>
                  {l.waiting && <span className="tzs-chip wait">Chờ người duyệt</span>}
                  {l.live && <span className="tzs-chip ok">Đã lên tin</span>}
                </div>
                {l.note && !l.blocked && <div className="tzs-note">{l.note}</div>}
                {l.approvedText && <div className="tzs-note ok">Người duyệt: {l.approvedText}</div>}
                {l.blocked && l.reason && <div className="tzs-note block">{l.reason}</div>}
                {l.blocked && (
                  <div className="tzs-stamp">
                    <motion.div
                      initial={{ scale: 2.4, opacity: 0, rotate: -14, x: '-50%', y: '-50%' }}
                      animate={{ scale: 1, opacity: 1, rotate: -14, x: '-50%', y: '-50%' }}
                      transition={{ duration: 0.35 * slow, ease: [0.3, 1.4, 0.5, 1] }}
                    >
                      CHẶN
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const SPLIT_COLORS: Record<string, string> = {
  tram: '#b91c1c',
  kho_giao: '#ff7b00',
  gioi_thieu: '#0284c7',
  cho_z: '#7f1d1d',
}

/** doi_soat: the 10% fee and how it splits 5/2/1/2 (from the settlement tool / approve_request totals). */
export function SettlementPanel({ s, slow }: { s: Settlement; slow: number }) {
  const sum = s.parts.reduce((a, p) => a + p.vnd, 0) || 1
  return (
    <motion.div
      className="tzs-panel"
      style={{ left: 40, top: 382, width: 900 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35 * slow }}
    >
      <div className="tzs-panel-head">
        <div className="tzs-panel-title">Phí {fmtPct(s.feePct)} chia cho 4 bên</div>
        <div className="tzs-panel-sub">agent Đối soát tính, chủ kho duyệt</div>
      </div>
      <div className="tzs-split-line">
        Tiền hàng <b>{fmtVnd(s.amount)}</b> · phí <b>{fmtVnd(s.fee)}</b> · nhà cung cấp nhận <b>{fmtVnd(s.supplierReceives)}</b>
      </div>
      <div className="tzs-split-bar">
        {s.parts.map((p, i) => (
          <motion.div
            key={p.key}
            style={{ width: `${(p.vnd / sum) * 100}%`, background: SPLIT_COLORS[p.key] ?? '#4b5563' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: (0.1 + i * 0.12) * slow, duration: 0.4 * slow }}
          >
            {fmtPct(p.pct)}
          </motion.div>
        ))}
      </div>
      <div className="tzs-split-legend">
        {s.parts.map((p) => (
          <div key={p.key} style={{ borderColor: SPLIT_COLORS[p.key] ?? '#4b5563' }}>
            <div className="lbl">
              {p.label} · {fmtPct(p.pct)}
            </div>
            <div className="val">{fmtVnd(p.vnd)}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
