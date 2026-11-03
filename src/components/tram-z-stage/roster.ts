/** Who is who on the stage: agents (cards), people and places (map), scenes and their on-stage durations. */

export interface AgentInfo {
  code: string
  name: string
  provider: 'claude' | 'meta'
  role: string
}

export const AGENTS: AgentInfo[] = [
  { code: 'ag_dang_ban', name: 'Đăng bán', provider: 'meta', role: 'Giọng nói + ảnh thành tin bán' },
  { code: 'ag_kiem_chung', name: 'Kiểm chứng', provider: 'meta', role: 'Đối chiếu tin, nhãn, lô hàng' },
  { code: 'ag_chia_don', name: 'Chia đơn', provider: 'claude', role: 'Gom Giỏ thành phiếu gom' },
  { code: 'ag_giao_nhan', name: 'Giao nhận', provider: 'claude', role: 'Lịch xe, chuyến gom, đồ giặt' },
  { code: 'ag_cham_khach', name: 'Chăm khách', provider: 'claude', role: 'Trả lời khách, đổi trả' },
  { code: 'ag_doi_soat', name: 'Đối soát', provider: 'claude', role: 'Tính phí, chia tiền, báo NCC' },
]

export const AGENT_CODES = AGENTS.map((a) => a.code)
export const isAgent = (code?: string) => !!code && code.startsWith('ag_')

const SUPPLIER_NAMES: Record<string, string> = {
  ncc1: 'NCC 1 · đặc sản',
  ncc2: 'HTX rau 2',
  ncc3: 'Vựa thịt 3',
  ncc4: 'Vựa cá 4',
  ncc5: 'HTX trứng 5',
}

/** House number 1..5 for a household code ho01..ho50 (ho01-ho10 → 1, ho11-ho20 → 2, ...). */
export function houseOf(code: string): number {
  const n = parseInt(code.slice(2), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(5, Math.ceil(n / 10))
}

export function actorName(code?: string): string {
  if (!code) return ''
  const agent = AGENTS.find((a) => a.code === code)
  if (agent) return agent.name
  if (code === 'hu_tram') return 'Bạn trực Trạm Z'
  if (code === 'hu_kho') return 'Chủ kho'
  if (code === 'xe1') return 'Xe 1'
  if (SUPPLIER_NAMES[code]) return SUPPLIER_NAMES[code]
  if (/^ho\d+$/.test(code)) return `Hộ ${code.slice(2)} · nhà ${houseOf(code)}`
  return code
}

export interface SceneInfo {
  code: string
  short: string
  title: string
  ms: number
}

/** 26 simulated hours in 30 s: each scene has its own share (brief 7b). */
export const SCENES: SceneInfo[] = [
  { code: 'dat_gio', short: 'Đặt Giỏ', title: 'Khách đặt Giỏ cho sáng mai', ms: 4000 },
  { code: 'dang_ban', short: 'Đăng bán', title: 'Đăng bán bằng giọng nói và ảnh', ms: 7000 },
  { code: 'gom_kho', short: 'Gom kho', title: 'Gom hàng về kho, kiểm từng lô', ms: 4000 },
  { code: 'ra_tram', short: 'Ra trạm', title: 'Xe ra Trạm Z, chuyến về chở đồ giặt', ms: 4000 },
  { code: 'nhan_hang', short: 'Nhận hàng', title: 'Nhận Giỏ tại Trạm Z, góc tiệm tạp hóa', ms: 5000 },
  { code: 'doi_soat', short: 'Đối soát', title: 'Đối soát, chia phí 10% cho 4 bên', ms: 4000 },
  { code: 'tong_ket', short: 'Tổng kết', title: 'Tổng kết ngày', ms: 2000 },
]

export const sceneIndex = (code?: string | null) => SCENES.findIndex((s) => s.code === code)

export const APPROVAL_KIND: Record<string, string> = {
  thay_hang: 'Thay hàng',
  duyet_listing: 'Duyệt tin đăng',
  nhan_hang_kho: 'Nhận hàng vào kho',
  nhan_hang_tram: 'Nhận hàng tại trạm',
  doi_tra: 'Đổi trả',
  doi_soat: 'Đối soát',
}

/** Names of the services counters in summary.json → short Vietnamese label. */
export const SERVICE_LABELS: Record<string, (n: number) => string> = {
  suat_an_sang: (n) => `${n} suất ăn sáng`,
  giat_la_ho: (n) => `${n} hộ giặt là`,
}
