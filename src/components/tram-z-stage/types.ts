/** Shapes of the files the stage reads. Mirrors choz-listing-agent/sim/schema.py and sim/workload.py (do not rename fields). */

export type EventType =
  | 'scene'
  | 'say'
  | 'handoff'
  | 'tool'
  | 'approve_request'
  | 'approve'
  | 'move'
  | 'metric'
  | 'error'

export interface Usage {
  provider: 'claude' | 'meta'
  model: string
  endpoint?: string
  ms?: number
  cost_usd?: number
  [key: string]: unknown
}

export interface ToolInfo {
  name: string
  input_summary: string
  output_summary: string
  ok: boolean
}

export type MetricKey =
  | 'orders'
  | 'gmv_vnd'
  | 'agent_actions'
  | 'agent_cost_usd'
  | 'agent_cost_vnd'
  | 'human_approvals'
  | 'human_minutes'
  | 'blocked'

export type Metrics = Record<MetricKey, number>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Detail = Record<string, any>

export interface StageEvent {
  id: string
  /** simulated seconds from 00:00; the evening before is negative */
  t: number
  clock: string
  wall?: string
  type: EventType
  mode: 'mock' | 'live'
  from?: string
  to?: string
  text?: string
  detail?: Detail
  tool?: ToolInfo
  usage?: Usage
  loc?: string
  metrics?: Partial<Metrics>
  scene?: string
}

/** One role in the headcount table (sim/workload.py `roles()`). */
export interface RoleRow {
  role: string
  minutes_day: number
  people: number
  people_whole: number
  wage_vnd_month: number
  cost_vnd_month: number
}

export interface HeadcountBlock {
  stations: number
  orders_per_day: number
  manual_people: number
  with_agents_people: number
  agents: number
  agent_cost_vnd_month: number
  agent_cost_vnd_per_order: number
  human_minutes_saved_pct: number
  roles_manual?: RoleRow[]
  roles_with_agents?: RoleRow[]
  people_cost_vnd_month_manual?: number
  people_cost_vnd_month_with_agents?: number
  total_cost_vnd_month_manual?: number
  total_cost_vnd_month_with_agents?: number
  saving_vnd_month?: number
  wage_source?: string
  [key: string]: unknown
}

export interface Headcount {
  mode?: string
  tram_1: HeadcountBlock
  tram_50: HeadcountBlock
  note?: string
  [key: string]: unknown
}

export interface Summary {
  mode?: string
  services?: Record<string, number | string>
  [key: string]: unknown
}
