/**
 * The conclusion card shown after each scene: what happened, who did what, who handed over to whom, what a
 * person approved, and the key numbers. Everything is read from the scene's own events (pure functions), so a
 * live day and a mock day produce their own cards.
 */
import { fmtInt, fmtVnd } from './format'
import { AGENT_CODES, LOT_NAMES, actorName, isAgent, toolLabel } from './roster'
import type { StageEvent } from './types'

export interface ConclusionStep {
  /** actor code (agent, person, ho/ncc group) */
  who: string
  /** what they did, plain Vietnamese */
  did: string
}

export interface Conclusion {
  scene: string
  kicker: string
  title: string
  /** 1-2 sentences, the takeaway */
  summary: string
  steps: ConclusionStep[]
  handoffs: { from: string; to: string; text: string }[]
  approvals: { by: string; request: string; answer: string }[]
  numbers: { label: string; value: string }[]
  /** small caption: models that worked in this scene */
  models: string[]
}

/** The events of one scene: from its scene event up to the next scene event. */
export function sceneEvents(events: StageEvent[], scene: string): StageEvent[] {
  const i = events.findIndex((e) => e.type === 'scene' && e.scene === scene)
  if (i < 0) return []
  const out: StageEvent[] = []
  for (let k = i + 1; k < events.length && events[k].type !== 'scene'; k++) out.push(events[k])
  return out
}

const toolOut = (evs: StageEvent[], name: string, last = true) => {
  const xs = evs.filter((e) => e.type === 'tool' && e.tool?.name === name && e.detail?.output)
  const e = last ? xs[xs.length - 1] : xs[0]
  return e?.detail?.output
}

const approvalsOf = (evs: StageEvent[]) => {
  const out: { by: string; request: string; answer: string }[] = []
  for (const r of evs.filter((e) => e.type === 'approve_request')) {
    const a = evs.find((e) => e.type === 'approve' && e.detail?.request === r.id)
    out.push({ by: r.to ?? '', request: r.text ?? '', answer: a?.text ?? '' })
  }
  return out
}

const handoffsOf = (evs: StageEvent[]) =>
  evs.filter((e) => e.type === 'handoff' && e.from && e.to).map((e) => ({ from: e.from!, to: e.to!, text: e.text ?? '' }))

const modelsOf = (evs: StageEvent[]) =>
  Array.from(new Set(evs.map((e) => e.usage?.model).filter((m): m is string => !!m && m !== 'mock')))

const countTools = (evs: StageEvent[], agent: string) => evs.filter((e) => e.type === 'tool' && e.from === agent).length

const toolsUsed = (evs: StageEvent[], agent: string) =>
  Array.from(new Set(evs.filter((e) => e.type === 'tool' && e.from === agent).map((e) => toolLabel(e.tool?.name ?? ''))))

const andList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} và ${xs[xs.length - 1]}`)

const money = (n: number) => fmtVnd(n)

function datGio(evs: StageEvent[]): Conclusion {
  const baskets = toolOut(evs, 'list_baskets')
  const pick = toolOut(evs, 'make_picklist') ?? evs.find((e) => e.type === 'handoff')?.detail?.picklist
  const sub = toolOut(evs, 'apply_substitution')
  const booked = Number(baskets?.baskets ?? evs.filter((e) => e.type === 'say' && e.to === 'ag_chia_don').reduce((n, e) => n + (e.detail?.households?.length ?? 0), 0))
  const total = Number(baskets?.total_vnd ?? 0)
  const items = Number(pick?.items ?? 0)
  const suppliers = pick?.by_supplier ? Object.keys(pick.by_supplier).length : 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shortRows: any[] = pick?.short ?? []
  const shortText = shortRows.length
    ? andList(shortRows.map((x) => `thiếu ${x.missing} ${String(x.name).toLowerCase()}${x.suggest ? ` → thay ${String(x.suggest.name).toLowerCase()}` : ''}`))
    : 'không thiếu món nào'
  const changed = Array.isArray(sub?.orders) ? sub.orders.length : 0
  const steps: ConclusionStep[] = [
    { who: 'ho', did: `${fmtInt(booked)} hộ đặt Giỏ cho sáng mai qua Mini App` },
    { who: 'ag_chia_don', did: `gom ${fmtInt(booked)} Giỏ thành một phiếu ${fmtInt(items)} mặt hàng cho ${fmtInt(suppliers)} nhà cung cấp; ${shortText}` },
  ]
  if (changed) steps.push({ who: 'hu_tram', did: `duyệt phương án thay hàng; agent báo ${changed} hộ bị đổi và số tiền hoàn` })
  const h = handoffsOf(evs)
  if (h.length) steps.push({ who: 'ag_giao_nhan', did: 'nhận phiếu gom để lên lịch xe sáng mai' })
  return {
    scene: 'dat_gio',
    kicker: 'Kết luận bước 1',
    title: `Gom đơn: ${fmtInt(booked)} Giỏ của ${fmtInt(booked)} hộ thành một phiếu gom`,
    summary: `${fmtInt(booked)} Giỏ của ${fmtInt(booked)} hộ → 1 phiếu gom, ${fmtInt(items)} mặt hàng, ${fmtInt(suppliers)} nhà cung cấp; ${shortText}${changed ? `, bạn trực Trạm Z duyệt, ${fmtInt(changed)} hộ được báo` : ''}.`,
    steps,
    handoffs: h,
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Giỏ đặt', value: fmtInt(booked) },
      { label: 'Tiền hàng đặt', value: money(total) },
      { label: 'Mặt hàng cần gom', value: fmtInt(items) },
      { label: 'Việc agent làm', value: fmtInt(countTools(evs, 'ag_chia_don') + evs.filter((e) => e.type === 'say' && e.from === 'ag_chia_don').length) },
    ],
    models: modelsOf(evs),
  }
}

function dangBan(evs: StageEvent[]): Conclusion {
  const listings = evs.filter((e) => e.type === 'tool' && e.tool?.name === 'choz_listing')
  const blocked = evs.filter((e) => e.detail?.blocked).length
  const warned = evs.filter((e) => e.type === 'approve_request' && e.detail?.kind === 'duyet_listing').length
  const live = evs.filter((e) => e.type === 'say' && e.from === 'ag_dang_ban' && e.detail?.status === 'ready').length
  const secs = evs
    .filter((e) => e.type === 'say' && e.from === 'ag_dang_ban' && e.detail?.status === 'ready')
    .map((e) => e.text?.match(/(\d+(?:[.,]\d+)?)\s*giây/)?.[1])
    .filter((x): x is string => !!x)
  const warnSay = evs.find((e) => e.type === 'say' && e.from === 'ag_kiem_chung' && e.detail?.verdict === 'warn')
  const blockSay = evs.find((e) => e.type === 'say' && e.detail?.blocked)
  const steps: ConclusionStep[] = [
    { who: 'ncc', did: `gửi ${listings.length} tin: một câu nói hoặc một dòng chữ kèm ảnh sản phẩm` },
    { who: 'ag_dang_ban', did: `${andList(toolsUsed(evs, 'ag_dang_ban'))}` },
    { who: 'ag_kiem_chung', did: `${andList(toolsUsed(evs, 'ag_kiem_chung'))}${warnSay ? `; phát hiện lệch: “${warnSay.text}”` : ''}${blockSay ? `; từ chối một mặt hàng Chợ Z không bán` : ''}` },
  ]
  if (warned) steps.push({ who: 'hu_tram', did: `duyệt ${warned} tin có cảnh báo (agent không tự đăng tin lệch)` })
  return {
    scene: 'dang_ban',
    kicker: 'Kết luận bước 2',
    title: 'Đăng bán: nói một câu, có tin bán đã được kiểm',
    summary: `Agent viết tin từ ảnh và lời nói, rồi một agent khác đối chiếu từng ý với ảnh. Tin lệch phải có người duyệt; mặt hàng Chợ Z không bán bị từ chối ngay, không cần người xem.`,
    steps,
    handoffs: handoffsOf(evs),
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Tin đăng', value: fmtInt(listings.length) },
      { label: 'Đã lên tin', value: fmtInt(live + warned) },
      { label: 'Người phải duyệt', value: fmtInt(warned) },
      { label: 'Từ chối', value: fmtInt(blocked) },
      ...(secs.length ? [{ label: 'Giây mỗi tin', value: secs.join(' · ') }] : []),
    ],
    models: modelsOf(evs),
  }
}

function gomKho(evs: StageEvent[]): Conclusion {
  const checks = evs.filter((e) => e.type === 'tool' && e.tool?.name === 'check_lot' && e.detail?.output)
  const byKey = new Map<string, StageEvent>()
  for (const c of checks) byKey.set(`${c.detail!.output.supplier}:${c.detail!.output.item}`, c)
  const lots = Array.from(byKey.values())
  const rejectedFirst = checks.filter((c) => c.detail!.output.result === 'loại')
  const viNum = (t: string) => t.replace(/(\d)\.(\d)/g, '$1,$2')
  const rejected = rejectedFirst.map((c) => `${LOT_NAMES[c.detail!.output.item] ?? c.detail!.output.item} (${actorName(c.detail!.output.supplier)}: ${viNum(c.detail!.output.reasons?.[0] ?? '')})`)
  const passedNow = lots.filter((c) => c.detail!.output.result === 'đạt').length
  const steps: ConclusionStep[] = [
    { who: 'ag_giao_nhan', did: 'báo chủ kho hôm nay gom những gì, bao nhiêu' },
    { who: 'ncc', did: `${new Set(lots.map((c) => c.detail!.output.supplier)).size} nhà cung cấp mang ${lots.length} lô hàng về kho` },
    { who: 'ag_kiem_chung', did: `kiểm ${checks.length} lượt: nhãn, hạn dùng, nhiệt độ hàng lạnh${rejected.length ? `; loại ${andList(rejected)}, nhà cung cấp đổi lô mới` : ''}` },
    { who: 'hu_kho', did: `duyệt nhận ${passedNow} lô đạt vào kho` },
  ]
  return {
    scene: 'gom_kho',
    kicker: 'Kết luận bước 3',
    title: 'Hàng về kho: lô nào không đạt thì không vào kho',
    summary: `Agent kiểm từng lô theo quy tắc rõ ràng (hạn dùng, hàng lạnh dưới 4 °C). Lô không đạt bị trả lại ngay; chủ kho chỉ ký nhận khi mọi lô đạt.`,
    steps,
    handoffs: handoffsOf(evs),
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Lô hàng', value: fmtInt(lots.length) },
      { label: 'Lượt kiểm', value: fmtInt(checks.length) },
      { label: 'Loại rồi đổi lô', value: fmtInt(rejectedFirst.length) },
      { label: 'Vào kho', value: fmtInt(passedNow) },
    ],
    models: modelsOf(evs),
  }
}

function raTram(evs: StageEvent[]): Conclusion {
  const route = toolOut(evs, 'plan_route')
  const laundry = toolOut(evs, 'laundry_pickups')
  const legs: { to: string; arrive: string; drop_bags?: number; bring_back_laundry?: number }[] = route?.legs ?? []
  const tram = legs.find((l) => l.to === 'loc_tram')
  const back = legs[legs.length - 1]
  const bags = Number(route?.bags ?? tram?.drop_bags ?? 0)
  const stations = Number(route?.stations ?? 1)
  const nLaundry = Number(laundry?.count ?? route?.laundry_households?.length ?? 0)
  const nParcels = Number(laundry?.parcel_count ?? route?.parcel_households?.length ?? 0)
  const steps: ConclusionStep[] = [
    { who: 'ag_giao_nhan', did: `từ phiếu gom lên lộ trình: rời kho ${route?.depart ?? ''}, tới Trạm Z ${tram?.arrive ?? ''} giao ${fmtInt(bags)} túi cho ${fmtInt(bags)} đơn; chiều về gom ${fmtInt(nLaundry)} túi giặt + ${fmtInt(nParcels)} bưu phẩm, về kho ${back?.arrive ?? ''}` },
    { who: 'xe1', did: 'chạy đúng lộ trình: chiều đi chở túi hàng, chiều về chở đồ giặt và bưu phẩm' },
    { who: 'hu_tram', did: `ký nhận ${fmtInt(bags)} túi tại trạm, giao đồ giặt và bưu phẩm cho xe` },
  ]
  return {
    scene: 'ra_tram',
    kicker: 'Kết luận bước 4',
    title: 'Giao hàng: xe đi đầy, về không rỗng',
    summary: `Xe đi đầy, về không rỗng: chiều đi ${fmtInt(bags)} túi, chiều về ${fmtInt(nLaundry)} túi giặt + ${fmtInt(nParcels)} bưu phẩm. Có bao nhiêu đơn, bao nhiêu trạm thì agent lên bấy nhiêu điểm dừng, kèm giờ tới và số túi mỗi trạm.`,
    steps,
    handoffs: handoffsOf(evs),
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Trạm trên lộ trình', value: fmtInt(stations) },
      { label: 'Túi giao chiều đi', value: fmtInt(bags) },
      { label: 'Túi giặt gom chiều về', value: fmtInt(nLaundry) },
      { label: 'Bưu phẩm gom chiều về', value: fmtInt(nParcels) },
      { label: 'Giờ tới trạm', value: tram?.arrive ?? '—' },
    ],
    models: modelsOf(evs),
  }
}

function nhanHang(evs: StageEvent[]): Conclusion {
  const pays = evs.filter((e) => e.type === 'say' && e.detail?.payment)
  const orders = pays.reduce((n, e) => n + (e.detail?.orders?.length ?? 0), 0)
  const paid = pays.reduce((n, e) => n + Number(e.detail?.paid_vnd ?? 0), 0)
  const question = evs.find((e) => e.type === 'say' && e.to === 'ag_cham_khach')
  const answer = evs.find((e) => e.type === 'say' && e.from === 'ag_cham_khach' && e.to && !e.to.startsWith('hu_'))
  const steps: ConclusionStep[] = [
    { who: 'ho', did: `${fmtInt(pays.length)} nhà ghé Trạm Z, ${fmtInt(orders)} hộ nhận Giỏ và trả ${money(paid)}, có hóa đơn` },
    { who: 'hu_tram', did: `giao túi cho từng khách (việc tay, agent không thay)` },
  ]
  if (question) {
    steps.push({ who: question.from ?? 'ho', did: `hỏi: “${question.text}”` })
    steps.push({ who: 'ag_cham_khach', did: `${andList(toolsUsed(evs, 'ag_cham_khach'))}, đề xuất cách xử lý rồi xin bạn trực Trạm Z duyệt` })
    if (answer) steps.push({ who: 'hu_tram', did: `duyệt; agent trả lời khách: “${answer.text}”` })
  }
  return {
    scene: 'nhan_hang',
    kicker: 'Kết luận bước 5',
    title: 'Nhận Giỏ: khách ghé góc Trạm Z trong tiệm tạp hóa',
    summary: `Trạm đặt trong một cửa hàng có sẵn, cách nhà 500–600 m. Khách nhận Giỏ, trả tiền tại chỗ. Khi khách có chuyện, agent tra đơn và đề xuất; đổi trả luôn do người duyệt trước khi trả lời.`,
    steps,
    handoffs: handoffsOf(evs),
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Hộ nhận Giỏ', value: fmtInt(orders) },
      { label: 'Tiền hàng thu', value: money(paid) },
      { label: 'Khách hỏi', value: fmtInt(evs.filter((e) => e.type === 'say' && e.to === 'ag_cham_khach').length) },
      { label: 'Người duyệt', value: fmtInt(evs.filter((e) => e.type === 'approve').length) },
    ],
    models: modelsOf(evs),
  }
}

function doiSoat(evs: StageEvent[]): Conclusion {
  const sett = toolOut(evs, 'settlement')
  const totals = sett?.totals ?? {}
  const lines = evs.filter((e) => e.type === 'say' && e.from === 'ag_doi_soat' && e.detail?.settlement)
  const amount = Number(totals.amount_vnd ?? 0)
  const fee = Number(totals.fee_vnd ?? 0)
  const steps: ConclusionStep[] = [
    { who: 'ag_doi_soat', did: `khớp ${fmtInt(Number(toolOut(evs, 'completed_orders')?.orders ?? 0))} đơn đã giao và thu tiền, tính phí 10 % trên từng dòng hàng, chia 5 % trạm · 2 % kho và giao · 1 % người giới thiệu · 2 % Chợ Z` },
    { who: 'hu_kho', did: 'duyệt bảng đối soát trước khi số được gửi đi' },
    { who: 'ncc', did: `${fmtInt(lines.length)} nhà cung cấp nhận tin: bán bao nhiêu, phí bao nhiêu, nhận bao nhiêu` },
  ]
  return {
    scene: 'doi_soat',
    kicker: 'Kết luận bước 6',
    title: 'Đối soát: phí chỉ thu khi hàng đã đến tay khách',
    summary: `Không bán được thì không có phí. Mỗi đồng phí đều truy được về một đơn, một dòng hàng; agent tính, chủ kho duyệt, nhà cung cấp nhận số ngay tối hôm đó.`,
    steps,
    handoffs: handoffsOf(evs),
    approvals: approvalsOf(evs),
    numbers: [
      { label: 'Tiền hàng đã bán', value: money(amount) },
      { label: 'Phí 10 %', value: money(fee) },
      { label: 'Trạm Z nhận (5 %)', value: money(Number(totals.tram ?? 0)) },
      { label: 'Nhà cung cấp nhận', value: money(Number(totals.supplier_receives_vnd ?? amount - fee)) },
    ],
    models: modelsOf(evs),
  }
}

function tongKet(evs: StageEvent[], all: StageEvent[]): Conclusion {
  const last = [...all].reverse().find((e) => e.type === 'metric')?.metrics ?? {}
  const perAgent = AGENT_CODES.map((code) => ({
    code,
    // the closing read-out (detail.auto) is not agent work; the counts add up to the last metric line
    n: all.filter((e) => (e.type === 'tool' || (e.type === 'say' && !e.detail?.auto)) && e.from === code).length,
  }))
  const say = evs.find((e) => e.type === 'say' && e.detail?.auto) ?? evs.find((e) => e.type === 'say' && e.from === 'ag_doi_soat')
  const steps: ConclusionStep[] = perAgent.map((a) => ({ who: a.code, did: `${fmtInt(a.n)} việc` }))
  return {
    scene: 'tong_ket',
    kicker: 'Kết luận cả ngày',
    title: 'Một ngày của Trạm Z: agent làm phần lặp, người duyệt phần có tiền và có khách',
    summary: say?.text ?? '',
    steps,
    handoffs: all.filter((e) => e.type === 'handoff' && e.from && e.to).map((e) => ({ from: e.from!, to: e.to!, text: e.text ?? '' })),
    approvals: [],
    numbers: [
      { label: 'Đơn hoàn thành', value: fmtInt(Number(last.orders ?? 0)) },
      { label: 'Tiền hàng', value: money(Number(last.gmv_vnd ?? 0)) },
      { label: 'Việc agent làm', value: fmtInt(Number(last.agent_actions ?? 0)) },
      { label: 'Chi phí agent', value: money(Number(last.agent_cost_vnd ?? 0)) },
      { label: 'Lần người duyệt', value: fmtInt(Number(last.human_approvals ?? 0)) },
      { label: 'Phút người làm', value: fmtInt(Number(last.human_minutes ?? 0)) },
    ],
    models: modelsOf(all),
  }
}

export function conclusionOf(scene: string, events: StageEvent[]): Conclusion | null {
  const evs = sceneEvents(events, scene)
  if (!evs.length && scene !== 'tong_ket') return null
  switch (scene) {
    case 'dat_gio':
      return datGio(evs)
    case 'dang_ban':
      return dangBan(evs)
    case 'gom_kho':
      return gomKho(evs)
    case 'ra_tram':
      return raTram(evs)
    case 'nhan_hang':
      return nhanHang(evs)
    case 'doi_soat':
      return doiSoat(evs)
    case 'tong_ket':
      return tongKet(evs, events)
    default:
      return null
  }
}

export const isPerson = (code: string) => code.startsWith('hu_')
export const stepTone = (code: string) => (isAgent(code) ? 'agent' : isPerson(code) ? 'person' : 'outside')
