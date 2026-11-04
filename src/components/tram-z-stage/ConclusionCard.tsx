'use client'

import { motion } from 'framer-motion'

import { stepTone, type Conclusion } from './conclusion'
import { actorName, isAgent } from './roster'

/** The pause after a scene: what happened, who did what and handed to whom, what a person approved, the numbers. */
export function ConclusionCard({ c, slow, brief }: { c: Conclusion; slow: number; brief?: boolean }) {
  const d = (x: number) => x * slow
  return (
    <motion.div
      className={`tzs-conclusion ${c.scene === 'tong_ket' ? 'day' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: d(0.35), ease: [0.16, 1, 0.3, 1] }}
      data-conclusion={c.scene}
    >
      <div className="tzs-conclusion-left">
        <div className="tzs-conclusion-kicker">{c.kicker}</div>
        <h2 className="tzs-conclusion-title">{c.title}</h2>
        {c.summary && <p className="tzs-conclusion-summary">{c.summary}</p>}
        <div className="tzs-conclusion-numbers">
          {c.numbers.map((n, i) => (
            <motion.div
              key={n.label}
              className="tzs-conclusion-number"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(0.25 + i * 0.12), duration: d(0.35) }}
            >
              <div className="val">{n.value}</div>
              <div className="lbl">{n.label}</div>
            </motion.div>
          ))}
        </div>
        {c.models.length > 0 && (
          <div className="tzs-conclusion-models">
            Model đã chạy: {c.models.join(' · ')}
          </div>
        )}
      </div>
      <div className="tzs-conclusion-right">
        <div className="tzs-conclusion-h">{c.scene === 'tong_ket' ? 'Mỗi agent đã làm' : 'Ai làm gì, theo thứ tự'}</div>
        <ol className={`tzs-steps-list ${c.scene === 'tong_ket' ? 'grid' : ''}`}>
          {c.steps.map((s, i) => (
            <motion.li
              key={`${s.who}-${i}`}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: d(0.2 + i * 0.16), duration: d(0.3) }}
            >
              <span className={`tzs-who ${stepTone(s.who)}`}>
                {isAgent(s.who) ? 'Agent ' : ''}
                {actorName(s.who)}
              </span>
              <span className="tzs-did">{s.did}</span>
            </motion.li>
          ))}
        </ol>
        {c.handoffs.length > 0 && c.scene !== 'tong_ket' && (
          <div className="tzs-conclusion-block">
            <div className="tzs-conclusion-h">Agent bàn giao cho nhau</div>
            {c.handoffs.map((h, i) => (
              <div key={i} className="tzs-handoff-line">
                <span className="tzs-who agent">{actorName(h.from)}</span>
                <span className="tzs-flow-arrow">→</span>
                <span className="tzs-who agent">{actorName(h.to)}</span>
                <span className="tzs-did">“{h.text}”</span>
              </div>
            ))}
          </div>
        )}
        {c.approvals.length > 0 && (
          <div className="tzs-conclusion-block">
            <div className="tzs-conclusion-h">Người duyệt</div>
            {c.approvals.map((a, i) => (
              <div key={i} className="tzs-approval-line">
                <span className="tzs-who person">{actorName(a.by)}</span>
                <span className="tzs-did">
                  {a.request}
                  {a.answer && <b> → {a.answer}</b>}
                </span>
              </div>
            ))}
          </div>
        )}
        {c.scene === 'tong_ket' && c.handoffs.length > 0 && (
          <div className="tzs-conclusion-block">
            <div className="tzs-conclusion-h">{c.handoffs.length} lần agent bàn giao cho nhau trong ngày</div>
            <div className="tzs-handoff-chips">
              {c.handoffs.map((h, i) => (
                <span key={i} className="tzs-handoff-chip">
                  {actorName(h.from)} → {actorName(h.to)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {!brief && <div className="tzs-conclusion-hint">Tự chạy tiếp · Enter: bước sau · Space: dừng</div>}
    </motion.div>
  )
}
