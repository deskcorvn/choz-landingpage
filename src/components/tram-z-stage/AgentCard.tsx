'use client'

import { memo } from 'react'

import { fmtMs } from './format'
import { summaryLabel, toolLabel, type AgentInfo } from './roster'
import type { AgentState } from './state'

function AgentCardBase({ info, s, active, top, height }: { info: AgentInfo; s: AgentState; active: boolean; top: number; height: number }) {
  const provider = s.provider === 'meta' ? 'Meta' : 'Claude'
  return (
    <div className={`tzs-card ${active ? 'active' : ''}`} style={{ top, height }}>
      <div className="tzs-light" />
      <div className="tzs-card-main">
        <div className="tzs-card-row">
          <span className="tzs-card-name">{info.name}</span>
          <span className={`tzs-provider ${s.provider}`}>
            <span>{provider}</span>
            {s.model && <span className="model">{s.model}</span>}
            {s.ms != null && <span className="ms">· {fmtMs(s.ms)}</span>}
          </span>
          <span className="tzs-card-count">{s.actions} việc</span>
        </div>
        {s.tool ? (
          <div className={`tzs-card-task ${s.ok ? '' : 'fail'}`}>
            <b className="tzs-card-doing">{toolLabel(s.tool)}</b>
            <span className="tzs-card-out">{summaryLabel(s.summary)}</span>
            <code>{s.tool}</code>
          </div>
        ) : (
          <div className="tzs-card-task idle">{info.role}</div>
        )}
      </div>
    </div>
  )
}

export const AgentCard = memo(AgentCardBase)
