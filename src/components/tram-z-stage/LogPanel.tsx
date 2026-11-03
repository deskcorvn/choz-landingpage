'use client'

import { useEffect, useRef } from 'react'

import type { LogLine } from './state'

/** "Xem log": the running event lines (id, clock, type, from→to, text/tool), newest at the bottom. */
export function LogPanel({ lines, total, onClose }: { lines: LogLine[]; total: number; onClose: () => void }) {
  const body = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = body.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  return (
    <div className="tzs-log">
      <div className="tzs-log-head">
        <span>
          Nhật ký sự kiện · {lines.length}/{total} dòng
        </span>
        <button type="button" className="tzs-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
      <div className="tzs-log-body" ref={body}>
        {lines.map((l) => (
          <div key={l.id} className="tzs-log-line">
            <span className="id">{l.id}</span>
            <span>{l.clock}</span>
            <span className={`ty ${l.type}`}>{l.type}</span>
            <span className="tx">
              {l.who && <span className="who">{l.who} </span>}
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
