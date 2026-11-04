'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { fmtInt, fmtPct, fmtVnd } from './format'
import { LOT_NAMES, actorName } from './roster'
import type { BasketBoard, HouseBasket, Listing, Lot, Payment, Picklist, Route, Settlement, Substitution, SupplierSettlement, ThreadLine } from './state'

const PLACE: Record<string, string> = {
  loc_kho: 'Kho khu vực',
  loc_duong: 'Trên đường',
  loc_tram: 'Trạm Z',
  loc_ncc: 'Nhà cung cấp',
}

function Panel({
  title,
  sub,
  pos,
  slow,
  children,
  className,
}: {
  title: string
  sub?: string
  pos: { left: number; top: number; width: number }
  slow: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`tzs-panel ${className ?? ''}`}
      style={pos}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35 * slow }}
    >
      <div className="tzs-panel-head">
        <div className="tzs-panel-title">{title}</div>
        {sub && <div className="tzs-panel-sub">{sub}</div>}
      </div>
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ dat_gio: the "Gom đơn" board */

export function BasketPanel({
  baskets,
  houses,
  picklist,
  substitution,
  notes,
  approved,
  slow,
}: {
  baskets: BasketBoard | null
  houses: HouseBasket[]
  picklist: Picklist | null
  substitution: Substitution | null
  notes: { id: string; to: string; text: string }[]
  approved: string | null
  slow: number
}) {
  const short = picklist?.short ?? []
  return (
    <Panel title="Gom đơn" sub="agent Chia đơn đọc Giỏ đã đặt, cộng thành một phiếu gom" pos={{ left: 24, top: 66, width: 1104 }} slow={slow} className="tzs-board">
      <div className="tzs-board-cols">
        <div className="tzs-board-col">
          <div className="tzs-board-h">Khách đã đặt</div>
          {houses.length > 0 && (
            <div className="tzs-houses">
              {houses.map((h) => (
                <motion.div key={h.id} className="tzs-house-row" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 * slow }}>
                  <span>Nhà {h.house}</span>
                  <b>{fmtInt(h.households)} Giỏ</b>
                </motion.div>
              ))}
            </div>
          )}
          {baskets ? (
            <>
              <div className="tzs-big">
                {fmtInt(baskets.baskets)} <span>Giỏ</span>
              </div>
              <div className="tzs-tiers">
                {baskets.byPrice.map((t) => (
                  <div key={t.price} className="tzs-tier">
                    <b>{fmtInt(t.count)}</b> Giỏ {fmtInt(t.price / 1000)}k
                  </div>
                ))}
                {baskets.extras > 0 && (
                  <div className="tzs-tier">
                    <b>{fmtInt(baskets.extras)}</b> hộ mua thêm
                  </div>
                )}
              </div>
              <div className="tzs-board-line">Tiền hàng đặt: <b>{fmtVnd(baskets.total)}</b></div>
            </>
          ) : (
            <div className="tzs-board-wait">{houses.length ? 'Agent đang đọc Giỏ…' : 'Đang chờ khách đặt…'}</div>
          )}
        </div>
        <div className="tzs-board-arrow">→</div>
        <div className="tzs-board-col wide">
          <div className="tzs-board-h">Phiếu gom theo nhà cung cấp</div>
          {picklist ? (
            <div className="tzs-pick">
              {picklist.bySupplier.map((s) => (
                <div key={s.supplier} className="tzs-pick-row">
                  <div className="tzs-pick-sup">{actorName(s.supplier)}</div>
                  <div className="tzs-pick-items">
                    {s.items.map((it) => (
                      <span key={it.sku} className={`tzs-pick-item ${short.some((x) => x.name === it.name) ? 'short' : ''}`}>
                        <b>{fmtInt(it.qty)}</b> {it.name.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="tzs-board-line">
                <b>{fmtInt(picklist.orders)}</b> đơn · <b>{fmtInt(picklist.items)}</b> mặt hàng · <b>{fmtInt(picklist.bySupplier.length)}</b> nhà cung cấp
              </div>
            </div>
          ) : (
            <div className="tzs-board-wait">Đang lập phiếu…</div>
          )}
        </div>
        <div className="tzs-board-col">
          <div className="tzs-board-h">Thiếu hàng?</div>
          {picklist && short.length === 0 && <div className="tzs-ok-line">Đủ hàng cho mọi Giỏ</div>}
          {short.map((x) => (
            <div key={x.name} className="tzs-short">
              <div className="tzs-short-head">
                Thiếu <b>{fmtInt(x.missing)}</b> {x.name.toLowerCase()} <span>(cần {fmtInt(x.need)}, còn {fmtInt(x.stock)})</span>
              </div>
              {x.suggest && (
                <div className="tzs-short-sub">
                  Agent đề xuất: thay <b>{x.suggest.toLowerCase()}</b>, hoàn <b>{fmtVnd(x.refund)}</b> mỗi đơn
                </div>
              )}
              {approved && <div className="tzs-note ok">Người trực trạm: {approved}</div>}
              {substitution && (
                <div className="tzs-short-sub">
                  Đã đổi ở {substitution.orders.length} đơn: {substitution.orders.map((o) => o.order).join(', ')}
                </div>
              )}
              {notes.slice(-2).map((n) => (
                <div key={n.id} className="tzs-note">
                  → {actorName(n.to)}: {n.text}
                </div>
              ))}
            </div>
          ))}
          {!picklist && <div className="tzs-board-wait">…</div>}
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ dang_ban: listings */

const verdictLabel = (l: Listing) => {
  if (!l.verdict) return { cls: '', text: 'Đang đối chiếu với ảnh…' }
  const detail = l.verdictText?.replace(/^(pass|warn|block|khớp ảnh|có chỗ lệch|không đăng)\s*:\s*/i, '') ?? ''
  const n = detail.match(/(\d+)\s*(?:claim|điểm)/)?.[1]
  const bad = detail.match(/(\d+)\s*lệch/)?.[1]
  const counts = n ? `${n} điểm đối chiếu${bad && Number(bad) > 0 ? `, ${bad} lệch` : ''}` : detail
  if (l.verdict === 'pass') return { cls: 'pass', text: `Khớp ảnh · ${counts}` }
  if (l.verdict === 'warn') return { cls: 'warn', text: `Có chỗ lệch · ${counts}` }
  return { cls: 'block', text: 'Không được bán trên Chợ Z' }
}

/** dang_ban: the listings the Meta agents wrote and checked this morning, with the refusal stamp on one. */
export function ListingPanel({ listings, slow }: { listings: Listing[]; slow: number }) {
  const shown = listings.slice(-4)
  return (
    <Panel title="Tin đăng sáng nay" sub="agent Đăng bán viết tin · agent Kiểm chứng đối chiếu với ảnh, nhãn và quy định bán hàng" pos={{ left: 24, top: 428, width: 1104 }} slow={slow}>
      <div className={`tzs-listings n${shown.length}`}>
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
                  {l.ocop && <span className="tzs-chip ocop">OCOP {l.ocop}</span>}
                  {l.label && <span className="tzs-chip label">{l.label}</span>}
                  <span className={`tzs-chip ${v.cls}`}>{v.text}</span>
                  {l.waiting && <span className="tzs-chip wait">Chờ người duyệt</span>}
                  {l.live && <span className="tzs-chip ok">Đã lên tin{l.seconds ? ` · ${l.seconds}` : ''}</span>}
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
                      KHÔNG ĐĂNG
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ gom_kho: lots at the warehouse */

export function LotPanel({ lots, approved, slow }: { lots: Lot[]; approved: string | null; slow: number }) {
  return (
    <Panel title="Kiểm từng lô hàng về kho" sub="agent Kiểm chứng: nhãn, hạn dùng, hàng lạnh dưới 4 °C · chủ kho ký nhận" pos={{ left: 24, top: 428, width: 1104 }} slow={slow}>
      <div className="tzs-lots">
        <AnimatePresence>
          {lots.map((l) => (
            <motion.div
              key={l.key}
              className={`tzs-lot ${l.result === 'loại' ? 'bad' : 'good'} ${l.replaced ? 'replaced' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 * slow }}
            >
              <div className="tzs-lot-name">
                {LOT_NAMES[l.item] ?? l.item} <span>· {actorName(l.supplier)}</span>
              </div>
              <div className="tzs-lot-facts">
                <span>{fmtInt(l.qty)} phần</span>
                <span>HSD {l.expiry.slice(8, 10)}/{l.expiry.slice(5, 7)}</span>
                {l.tempC != null && <span className={l.result === 'loại' ? 'hot' : ''}>{String(l.tempC).replace('.', ',')} °C</span>}
              </div>
              <div className={`tzs-lot-result ${l.result === 'loại' ? 'bad' : 'good'}`}>
                {l.result === 'loại' ? `Loại · ${l.reasons[0] ?? ''}` : l.replaced ? 'Đạt · lô đổi mới' : 'Đạt'}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {lots.length === 0 && <div className="tzs-board-wait">Đang chờ hàng về…</div>}
      </div>
      {approved && <div className="tzs-note ok tzs-lots-approved">Chủ kho: {approved}</div>}
    </Panel>
  )
}

/* ------------------------------------------------------------------ ra_tram: the route board */

export function RoutePanel({ route, bagsApproved, slow }: { route: Route | null; bagsApproved: string | null; slow: number }) {
  return (
    <Panel title="Lộ trình xe hôm nay: đi đầy, về không rỗng" sub="agent Giao nhận lên từ phiếu gom: mỗi trạm một dòng, chiều về gom đồ giặt và bưu phẩm" pos={{ left: 24, top: 66, width: 760 }} slow={slow}>
      {route ? (
        <>
          <div className="tzs-route-head">
            <span>
              Xe · rời kho <b>{route.depart}</b>
            </span>
            <span>
              <b>{fmtInt(route.bags)}</b> túi cho <b>{fmtInt(route.bags)}</b> đơn · <b>{fmtInt(route.stations)}</b> trạm
            </span>
          </div>
          <ol className="tzs-route">
            {route.legs.map((leg, i) => {
              const state = i < route.at ? 'done' : i === route.at ? 'now' : ''
              const tramAt = route.legs.findIndex((l) => l.to === 'loc_tram')
              const pick = [leg.pickLaundry ? `${fmtInt(leg.pickLaundry)} túi giặt` : '', leg.pickParcels ? `${fmtInt(leg.pickParcels)} bưu phẩm` : ''].filter(Boolean).join(' + ')
              const what = leg.dropBags
                ? `giao ${fmtInt(leg.dropBags)} túi${leg.station ? ` · ${leg.station}` : ''}${pick ? ` · nhận ${pick}` : ''}`
                : leg.bringBack || leg.bringBackParcels
                  ? `về kho, mang theo ${[leg.bringBack ? `${fmtInt(leg.bringBack)} túi giặt` : '', leg.bringBackParcels ? `${fmtInt(leg.bringBackParcels)} bưu phẩm` : ''].filter(Boolean).join(' + ')}`
                  : leg.to === 'loc_duong'
                    ? tramAt >= 0 && i > tramAt
                      ? 'đường về, chở đồ giặt và bưu phẩm'
                      : `đường ra trạm, chở ${fmtInt(route.bags)} túi`
                    : leg.to === 'loc_tram'
                      ? 'ghé trạm'
                      : ''
              return (
                <li key={i} className={`tzs-route-leg ${state}`}>
                  <span className="tzs-route-time">{leg.arrive}</span>
                  <span className="tzs-route-dot" />
                  <span className="tzs-route-place">{PLACE[leg.to] ?? leg.to}</span>
                  <span className="tzs-route-what">{what}</span>
                </li>
              )
            })}
          </ol>
          <div className="tzs-route-two">
            <div className="tzs-route-dir out">
              <div className="k">Chiều đi</div>
              <b>{fmtInt(route.bags)} túi</b> cho {fmtInt(route.bags)} đơn → Trạm Z, góc trong tiệm tạp hóa
            </div>
            <div className="tzs-route-dir back">
              <div className="k">Chiều về</div>
              <b>{fmtInt(route.laundry.length)} túi giặt</b>
              {route.laundry.length > 0 && ` (hộ ${route.laundry.map((h) => String(parseInt(h.slice(2), 10))).join(', ')})`}
              {' + '}
              <b>{fmtInt(route.parcels.length)} bưu phẩm</b>
              {route.parcels.length > 0 && ` (hộ ${route.parcels.map((h) => String(parseInt(h.slice(2), 10))).join(', ')})`} → kho
            </div>
          </div>
          {bagsApproved && <div className="tzs-note ok">Bạn trực Trạm Z: {bagsApproved}</div>}
        </>
      ) : (
        <div className="tzs-board-wait">Agent đang lên lộ trình…</div>
      )}
    </Panel>
  )
}

/* ------------------------------------------------------------------ nhan_hang: pickups and the customer thread */

const THREAD_WHO: Record<ThreadLine['kind'], string> = {
  customer: 'Khách',
  tool: 'Agent tra cứu',
  agent: 'Agent',
  request: 'Agent xin duyệt',
  approve: 'Bạn trực Trạm Z',
  answer: 'Agent trả lời khách',
}

export function PickupPanel({ payments, thread, slow }: { payments: Payment[]; thread: ThreadLine[]; slow: number }) {
  const total = payments.reduce((n, p) => n + p.paid, 0)
  const orders = payments.reduce((n, p) => n + p.orders, 0)
  return (
    <Panel title="Khách nhận Giỏ tại Trạm Z" sub="trạm là một góc trong tiệm tạp hóa, cách nhà 500–600 m" pos={{ left: 24, top: 66, width: 1104 }} slow={slow} className="tzs-board">
      <div className="tzs-board-cols">
        <div className="tzs-board-col wide">
          <div className="tzs-board-h">Từng nhà ghé trạm</div>
          <div className="tzs-pays">
            {payments.map((p) => (
              <motion.div key={p.id} className="tzs-pay" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 * slow }}>
                <span className="tzs-pay-house">Nhà {p.house}</span>
                <span className="tzs-pay-n">{fmtInt(p.orders)} hộ</span>
                <span className="tzs-pay-vnd">{fmtVnd(p.paid)}</span>
              </motion.div>
            ))}
            {payments.length === 0 && <div className="tzs-board-wait">Chưa có khách tới…</div>}
          </div>
          {payments.length > 0 && (
            <div className="tzs-board-line">
              <b>{fmtInt(orders)}</b> hộ đã nhận · thu <b>{fmtVnd(total)}</b> · có hóa đơn
            </div>
          )}
        </div>
        <div className="tzs-board-col wide">
          <div className="tzs-board-h">Khi khách có chuyện</div>
          <div className="tzs-thread">
            {thread.map((t) => (
              <motion.div key={t.id} className={`tzs-msg ${t.kind}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 * slow }}>
                <span className="tzs-msg-who">{t.kind === 'customer' ? actorName(t.who) : THREAD_WHO[t.kind]}</span>
                <span className="tzs-msg-text">{t.text}</span>
              </motion.div>
            ))}
            {thread.length === 0 && <div className="tzs-board-wait">Chưa có câu hỏi nào</div>}
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ doi_soat: the 10 % fee and the supplier lines */

const SPLIT_COLORS: Record<string, string> = {
  tram: '#b91c1c',
  kho_giao: '#ff7b00',
  gioi_thieu: '#0284c7',
  cho_z: '#7f1d1d',
}

export function SettlementPanel({ s, suppliers, approved, slow }: { s: Settlement; suppliers: SupplierSettlement[]; approved: string | null; slow: number }) {
  const sum = s.parts.reduce((a, p) => a + p.vnd, 0) || 1
  return (
    <Panel title={`Phí ${fmtPct(s.feePct)} chia cho 4 bên`} sub="chỉ tính trên hàng đã giao và thu tiền · agent Đối soát tính, chủ kho duyệt" pos={{ left: 24, top: 300, width: 1104 }} slow={slow}>
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
      {approved && <div className="tzs-note ok">Chủ kho: {approved}</div>}
      {suppliers.length > 0 && (
        <div className="tzs-suppliers">
          <div className="tzs-sup-row head">
            <span>Nhà cung cấp</span>
            <span>Đã bán</span>
            <span>Phí 10 %</span>
            <span>Nhận về</span>
          </div>
          {suppliers.map((x) => (
            <motion.div key={x.supplier} className="tzs-sup-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 * slow }}>
              <span>{actorName(x.supplier)}</span>
              <span>{fmtVnd(x.amount)}</span>
              <span>{fmtVnd(x.fee)}</span>
              <span className="get">{fmtVnd(x.receives)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </Panel>
  )
}
