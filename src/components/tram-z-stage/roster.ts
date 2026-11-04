/** Who is who on the stage: agents (cards), people and places (map), scenes and their on-stage durations. */

export interface AgentInfo {
  code: string
  name: string
  provider: 'claude' | 'meta'
  role: string
}

export const AGENTS: AgentInfo[] = [
  { code: 'ag_dang_ban', name: 'Đăng bán', provider: 'meta', role: 'Nghe người bán nói, nhìn ảnh, viết tin bán' },
  { code: 'ag_kiem_chung', name: 'Kiểm chứng', provider: 'meta', role: 'Đối chiếu tin với ảnh, kiểm lô hàng' },
  { code: 'ag_chia_don', name: 'Chia đơn', provider: 'claude', role: 'Gom Giỏ khách đặt thành phiếu gom' },
  { code: 'ag_giao_nhan', name: 'Giao nhận', provider: 'claude', role: 'Lên lộ trình xe, gom đồ giặt' },
  { code: 'ag_cham_khach', name: 'Chăm khách', provider: 'claude', role: 'Trả lời khách, đề xuất đổi trả' },
  { code: 'ag_doi_soat', name: 'Đối soát', provider: 'claude', role: 'Khớp đơn, tính phí, báo tiền cho nhà cung cấp' },
]

export const AGENT_CODES = AGENTS.map((a) => a.code)
export const isAgent = (code?: string) => !!code && code.startsWith('ag_')
export const agentInfo = (code: string) => AGENTS.find((a) => a.code === code)

/** What each tool does, in words a jury understands. The raw tool name stays as a small caption. */
export const TOOL_LABELS: Record<string, string> = {
  list_baskets: 'đọc Giỏ đã đặt',
  stock: 'xem tồn nhà cung cấp',
  make_picklist: 'lập phiếu gom',
  apply_substitution: 'thay hàng thiếu',
  plan_route: 'lên lộ trình xe',
  laundry_pickups: 'gom đồ giặt',
  check_lot: 'kiểm lô hàng',
  order_of: 'tra đơn của hộ',
  return_policy: 'đọc chính sách đổi trả',
  completed_orders: 'khớp đơn hoàn thành',
  settlement: 'lập bảng đối soát',
  fee_split: 'tính phí 10 %',
  voice_to_text: 'nghe lời người bán',
  choz_listing: 'viết tin đăng',
  verify_listing: 'đối chiếu ảnh và lời nói',
  catalog_match: 'khớp danh mục',
  cut_out: 'tách nền',
  studio_room: 'phòng chụp',
  studio_photo: 'ghép ảnh studio',
}
export const toolLabel = (name: string) => TOOL_LABELS[name] ?? name

/** The app's own step titles are English (app/pipeline.py); the card shows them in Vietnamese. Agent-written text
 *  is never rewritten here. */
const SUMMARY_LABELS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Studio room from cache.*$/i, () => 'dùng phòng chụp có sẵn (Muse Image vẽ từ trước)'],
  [/^Paint empty studio.*$/i, () => 'vẽ phòng chụp trống (Muse Image)'],
  [/^Cut out [“"](.+)[”"]$/i, (m) => `tách nền: ${m[1]}`],
  [/^Compose studio photo.*$/i, () => 'ghép ảnh sản phẩm vào phòng chụp (máy cục bộ)'],
]
export function summaryLabel(text: string | null | undefined): string {
  if (!text) return ''
  for (const [re, fn] of SUMMARY_LABELS) {
    const m = text.match(re)
    if (m) return fn(m)
  }
  return text
}

const SUPPLIER_NAMES: Record<string, string> = {
  ncc1: 'Nhà cung cấp đặc sản 1',
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
  if (code === 'ho') return 'Hộ gia đình'
  if (code === 'ncc') return 'Nhà cung cấp'
  if (SUPPLIER_NAMES[code]) return SUPPLIER_NAMES[code]
  if (/^ho\d+$/.test(code)) return `Hộ ${code.slice(2)} · nhà ${houseOf(code)}`
  return code
}

/** Group code of an actor for the flow strip: ho01 → ho, ncc3 → ncc, agents and people as they are. */
export function flowCode(code?: string | null): string | null {
  if (!code) return null
  if (/^ho\d+$/.test(code)) return 'ho'
  if (/^ncc\d+$/.test(code)) return 'ncc'
  return code
}

export interface SceneInfo {
  code: string
  short: string
  title: string
  /** on-stage ms for the events of the scene (default pacing) */
  ms: number
  /** on-stage ms for the 30-second version (?brief=1), no conclusion cards */
  briefMs: number
  /** the actors of the scene, in the order the work flows (flow strip); 'ho' and 'ncc' are groups */
  flow: string[]
}

/** Each scene plays its events over `ms`, then its conclusion card holds for CARD_MS (timeline.ts). */
export const SCENES: SceneInfo[] = [
  {
    code: 'dat_gio',
    short: 'Đặt Giỏ',
    title: 'Tối hôm trước: khách đặt Giỏ, agent gom đơn',
    ms: 6000,
    briefMs: 4000,
    flow: ['ho', 'ag_chia_don', 'hu_tram', 'ag_giao_nhan'],
  },
  {
    code: 'dang_ban',
    short: 'Đăng bán',
    title: 'Sáng sớm: đăng bán bằng giọng nói và ảnh',
    ms: 10000,
    briefMs: 7000,
    flow: ['ncc', 'ag_dang_ban', 'ag_kiem_chung', 'hu_tram'],
  },
  {
    code: 'gom_kho',
    short: 'Về kho',
    title: 'Hàng về kho: agent kiểm từng lô',
    ms: 6000,
    briefMs: 4000,
    flow: ['ag_giao_nhan', 'ncc', 'ag_kiem_chung', 'hu_kho'],
  },
  {
    code: 'ra_tram',
    short: 'Ra trạm',
    title: 'Xe ra Trạm Z, chuyến về gom đồ giặt',
    ms: 7000,
    briefMs: 4000,
    flow: ['ag_giao_nhan', 'xe1', 'hu_tram'],
  },
  {
    code: 'nhan_hang',
    short: 'Nhận Giỏ',
    title: 'Chiều: khách nhận Giỏ tại Trạm Z',
    ms: 7000,
    briefMs: 5000,
    flow: ['ho', 'hu_tram', 'ag_cham_khach'],
  },
  {
    code: 'doi_soat',
    short: 'Đối soát',
    title: 'Tối: đối soát, phí 10 % chia cho 4 bên',
    ms: 6000,
    briefMs: 4000,
    flow: ['ag_doi_soat', 'hu_kho', 'ncc'],
  },
  { code: 'tong_ket', short: 'Tổng kết', title: 'Tổng kết ngày', ms: 3000, briefMs: 2000, flow: ['ag_doi_soat', 'hu_tram'] },
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

/** Names of the goods in picklists and lots (sku → Vietnamese), for boards that only get a code. */
export const LOT_NAMES: Record<string, string> = {
  rau: 'rau',
  thit: 'thịt',
  tom: 'tôm',
  ca: 'cá rô phi',
  trung: 'trứng',
  chao_hau: 'cháo hàu',
}
