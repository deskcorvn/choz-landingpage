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
  manual_minutes?: number
  with_agents_minutes?: number
  /** paperwork and coordination (what agents can do) */
  office?: { manual_minutes: number; with_agents_minutes: number; manual_people: number; with_agents_people: number }
  /** physical work, the same minutes on both sides */
  physical?: { minutes: number; people: number; note?: string }
  [key: string]: unknown
}

/** headcount.json `view`: the final screen's numbers in units people can picture (sim/workload.py honest_view). */
export interface ViewStationRow {
  task: string
  manual_min: number
  with_agent_min: number
  kind: 'van_phong' | 'tay_chan' | string
}

export interface ViewTeamRow {
  role: string
  people: number
  cost_vnd_month: number
  detail?: Record<string, number>
  minutes_day?: number
}

export interface HeadcountView {
  station: {
    who: string
    rows: ViewStationRow[]
    manual_minutes_day: number
    with_agents_minutes_day: number
    share_pct: number
    share_vnd_day: number
    share_vnd_month: number
    note: string
  }
  central_1: {
    office_minutes_day_manual: number
    office_minutes_day_with_agents: number
    kho_minutes_day: number
    approval_minutes_day_with_agents: number
    note: string
  }
  central_50: {
    manual: ViewTeamRow[]
    with_agents: ViewTeamRow[]
    manual_people: number
    with_agents_people: number
    manual_cost_vnd_month: number
    with_agents_staff_cost_vnd_month: number
    agents: number
    agents_cost_vnd_month: number
    with_agents_cost_vnd_month: number
    saving_vnd_month: number
    rounding: string
    min_office_with_agents: number
  }
  agent_cost_vnd_per_order: number
  excluded: string[]
}

export interface Headcount {
  mode?: string
  view?: HeadcountView
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
