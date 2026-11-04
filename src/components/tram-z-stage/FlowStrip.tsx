'use client'

import { memo } from 'react'

import { actorName, flowCode, isAgent, type SceneInfo } from './roster'

/** Who does what in this scene, in order, with the actor that acted last lit up. */
function FlowStripBase({ scene, lastActor, activeAgents }: { scene: SceneInfo; lastActor: string | null; activeAgents: Set<string> }) {
  const last = flowCode(lastActor)
  return (
    <div className="tzs-flow" aria-label="Chuỗi việc trong bước này">
      <span className="tzs-flow-label">Ai làm gì</span>
      {scene.flow.map((code, i) => {
        const agent = isAgent(code)
        const person = code.startsWith('hu_')
        const on = last === code || (agent && activeAgents.has(code))
        return (
          <span key={`${code}-${i}`} className="tzs-flow-item">
            {i > 0 && <span className="tzs-flow-arrow">→</span>}
            <span className={`tzs-flow-pill ${agent ? 'agent' : person ? 'person' : 'outside'} ${on ? 'on' : ''}`}>
              {agent ? 'Agent ' : ''}
              {actorName(code)}
            </span>
          </span>
        )
      })}
    </div>
  )
}

export const FlowStrip = memo(FlowStripBase)
