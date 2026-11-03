'use client'

/**
 * "Một ngày của Trạm Z": a 30-second replay of one simulated day, for a 1920×1080 projector.
 * Sources: ?src=/demo/events.jsonl (default) replays a file, ?ws=ws://localhost:8765 adds events live.
 * headcount.json and summary.json are read from the same folder (?data= overrides). No API calls.
 */
import './stage.css'

import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { AgentCard } from './AgentCard'
import { FinalScreen } from './FinalScreen'
import { clockOf, fmtInt } from './format'
import { PLACE_LABELS, homeSpot, spriteOf } from './geometry'
import { IconFull, IconLog, IconPause, IconPlay, IconRestart, IconTable } from './icons'
import { CARD_H, MAIN_Y, MAP_X, MAP_Y, STAGE_H, STAGE_W, cardAnchor, cardTop } from './layout'
import { LogPanel } from './LogPanel'
import { Beams, Bubbles, Flights, Ticks } from './Overlays'
import { ListingPanel, SettlementPanel } from './Panels'
import type { TramMap } from './pixiMap'
import { RollingNumber } from './RollingNumber'
import { AGENTS, AGENT_CODES, SCENES, SERVICE_LABELS, sceneIndex } from './roster'
import { applyEvent, initialState, prune, type Anchor, type StageState } from './state'
import { LIVE_GAP_MS, buildSchedule, parseJsonl, simTimeAt, type SceneSlot } from './timeline'
import type { Headcount, StageEvent, Summary } from './types'

export interface TramZStageProps {
  /** events file used when the URL has no ?src= */
  defaultSrc?: string
  logoSrc?: string
}

type Source = { kind: 'file'; src: string; base: string } | { kind: 'ws'; url: string; base: string }

const dirOf = (url: string) => {
  const i = url.lastIndexOf('/')
  return i >= 0 ? url.slice(0, i + 1) : ''
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

/** Where a bubble / flight / tick attaches: an agent's card, or a sprite on the map (stage coordinates). */
function makeAnchor(mapRef: { current: TramMap | null }): Anchor {
  return (actor) => {
    const i = AGENT_CODES.indexOf(actor)
    if (i >= 0) return { ...cardAnchor(i), side: 'card', key: actor }
    const sprite = spriteOf(actor)
    if (!sprite) return null
    const p = mapRef.current?.posOf(sprite) ?? homeSpot(sprite).at
    return { x: MAP_X + p.x, y: MAP_Y + p.y, side: 'map', key: sprite }
  }
}

function Btn({ on, onClick, title, children }: { on?: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`tzs-btn ${on ? 'on' : ''}`}
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.currentTarget.blur()
        onClick()
      }}
    >
      {children}
    </button>
  )
}

function Counter({ label, value, flex, className }: { label: string; value: number; flex?: number; className?: string }) {
  return (
    <div className={`tzs-counter ${className ?? ''}`} style={flex ? { flex } : undefined}>
      <div className="val">
        <RollingNumber value={value} format={fmtInt} />
      </div>
      <div className="lbl">{label}</div>
    </div>
  )
}

function ModeBadge({ mode, ws, wsState }: { mode: string | null; ws: boolean; wsState: string }) {
  if (mode === 'live')
    return (
      <div className="tzs-mode live">
        <div className="tzs-mode-main">
          <span className={`tzs-live-dot ${!ws || wsState === 'open' ? '' : 'off'}`} />
          Chạy thật · Claude + Meta
        </div>
        {ws && <div className="tzs-mode-sub">{wsState === 'open' ? 'đang nhận sự kiện' : 'đang chờ kết nối…'}</div>}
      </div>
    )
  if (mode === 'mock')
    return (
      <div className="tzs-mode mock">
        <div className="tzs-mode-main">DỮ LIỆU MOCK</div>
        <div className="tzs-mode-sub">dữ liệu mẫu, chưa gọi model thật</div>
      </div>
    )
  return <div className="tzs-mode" />
}

export default function TramZStage({ defaultSrc = '/demo/events.jsonl', logoSrc = '/images/miniapp/logo.svg' }: TramZStageProps) {
  const [scale, setScale] = useState(0)
  const [st, setSt] = useState<StageState>(initialState)
  const [now, setNow] = useState(0)
  const [clock, setClock] = useState<{ text: string; t: number } | null>(null)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [slow, setSlow] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logOpen, setLogOpen] = useState(false)
  const [final, setFinal] = useState<null | { manual: boolean }>(null)
  const [headcount, setHeadcount] = useState<Headcount | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [wsState, setWsState] = useState<'idle' | 'connecting' | 'open' | 'closed'>('idle')
  const [eventCount, setEventCount] = useState(0)

  const eventsRef = useRef<StageEvent[]>([])
  const atRef = useRef<number[]>([])
  const totalRef = useRef(0)
  const scenesRef = useRef<SceneSlot[]>([])
  const seekRef = useRef<number | null>(null)
  const cursorRef = useRef(0)
  const playheadRef = useRef(0)
  const startedRef = useRef(false)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const liveRef = useRef(false)
  const autoplayRef = useRef(false)
  const finalShownRef = useRef(false)
  const tongKetAtRef = useRef<number | null>(null)
  const clockTextRef = useRef('')
  const baseRef = useRef('')
  const mapRef = useRef<TramMap | null>(null)
  const mapHostRef = useRef<HTMLDivElement>(null)
  const vanTagRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------------------ playback controls */

  const resetPlayback = useCallback(() => {
    cursorRef.current = 0
    playheadRef.current = 0
    finalShownRef.current = false
    tongKetAtRef.current = null
    clockTextRef.current = ''
    setSt(initialState())
    setFinal(null)
    setProgress(0)
    setClock(null)
    mapRef.current?.reset()
  }, [])

  const begin = useCallback(() => {
    startedRef.current = true
    pausedRef.current = false
    setStarted(true)
    setPaused(false)
  }, [])

  const togglePause = useCallback(() => {
    if (!startedRef.current) return begin()
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }, [begin])

  const toggleSlow = useCallback(() => {
    speedRef.current = speedRef.current === 1 ? 1 / 3 : 1
    setSlow(speedRef.current !== 1)
  }, [])

  const restart = useCallback(() => {
    if (liveRef.current) {
      // after (or during) a live run, restart replays what arrived with the scene timing
      const sch = buildSchedule(eventsRef.current)
      atRef.current = sch.at
      totalRef.current = sch.total
      scenesRef.current = sch.scenes
    }
    resetPlayback()
    begin()
  }, [begin, resetPlayback])

  /** Jump to a playhead (keys 1–7 = scene starts, ?at=ms): replays everything before it instantly. */
  const seek = useCallback(
    (ms: number) => {
      const evs = eventsRef.current
      const at = atRef.current
      resetPlayback()
      const anchor = makeAnchor(mapRef)
      let s = initialState()
      let i = 0
      for (; i < evs.length && at[i] <= ms; i++) {
        mapRef.current?.handle(evs[i], true)
        s = applyEvent(s, evs[i], at[i], anchor)
        if (evs[i].type === 'scene' && evs[i].scene === 'tong_ket') tongKetAtRef.current = at[i]
      }
      cursorRef.current = i
      playheadRef.current = ms
      setSt(prune(s, ms))
      setNow(ms)
      startedRef.current = true
      setStarted(true)
    },
    [resetPlayback],
  )

  const showFinal = useCallback((manual: boolean) => {
    // re-read headcount.json: a live run writes it at the end of the day
    fetchJson<Headcount>(`${baseRef.current}headcount.json`).then((h) => {
      if (h) setHeadcount(h)
    })
    setFinal({ manual })
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => undefined)
  }, [])

  /* ------------------------------------------------------------ fit 1920×1080 into the window */

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    const id = requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', fit)
    }
  }, [])

  /* ------------------------------------------------------------ read the URL */

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const ws = q.get('ws')
    const auto = q.get('autoplay')
    const id = requestAnimationFrame(() => {
      if (ws) {
        liveRef.current = true
        autoplayRef.current = auto !== '0'
        setSource({ kind: 'ws', url: ws, base: q.get('data') || dirOf(defaultSrc) })
      } else {
        const src = q.get('src') || defaultSrc
        autoplayRef.current = auto === '1'
        const at = Number(q.get('at'))
        if (q.get('at') && Number.isFinite(at)) seekRef.current = at
        setSource({ kind: 'file', src, base: q.get('data') || dirOf(src) })
      }
    })
    return () => cancelAnimationFrame(id)
  }, [defaultSrc])

  /* ------------------------------------------------------------ load events (file or WebSocket) */

  useEffect(() => {
    if (!source) return
    let cancelled = false
    baseRef.current = source.base
    fetchJson<Headcount>(`${source.base}headcount.json`).then((h) => !cancelled && h && setHeadcount(h))
    fetchJson<Summary>(`${source.base}summary.json`).then((s) => !cancelled && s && setSummary(s))

    if (source.kind === 'file') {
      fetch(source.src, { cache: 'no-store' })
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
          return r.text()
        })
        .then((text) => {
          if (cancelled) return
          const { events } = parseJsonl(text)
          if (!events.length) throw new Error('tệp không có sự kiện nào')
          eventsRef.current = events
          const sch = buildSchedule(events)
          atRef.current = sch.at
          totalRef.current = sch.total
          scenesRef.current = sch.scenes
          setEventCount(events.length)
          resetPlayback()
          setLoaded(true)
          if (seekRef.current != null) {
            pausedRef.current = true
            setPaused(true)
            seek(seekRef.current)
          } else if (autoplayRef.current) begin()
        })
        .catch((e: Error) => !cancelled && setError(`Không đọc được ${source.src}: ${e.message}`))
      return () => {
        cancelled = true
      }
    }

    let sock: WebSocket | null = null
    let retry: number | undefined
    const push = (ev: StageEvent) => {
      const at = atRef.current
      const last = at.length ? at[at.length - 1] : -Infinity
      eventsRef.current.push(ev)
      at.push(Math.max(playheadRef.current + 30, last + LIVE_GAP_MS))
      setEventCount(eventsRef.current.length)
    }
    const connect = () => {
      if (cancelled) return
      setWsState('connecting')
      try {
        sock = new WebSocket(source.url)
      } catch (e) {
        setError(`Không mở được ${source.url}: ${(e as Error).message}`)
        return
      }
      sock.onopen = () => setWsState('open')
      sock.onmessage = (m) => {
        if (typeof m.data !== 'string') return
        // one JSON event per message (several lines are accepted too); live keeps arrival order
        for (const line of m.data.split(/\r?\n/)) {
          if (!line.trim()) continue
          try {
            const ev = JSON.parse(line) as StageEvent
            if (ev && typeof ev.t === 'number' && ev.type) push(ev)
          } catch {
            /* skip a bad line */
          }
        }
      }
      sock.onclose = () => {
        setWsState('closed')
        if (!cancelled) retry = window.setTimeout(connect, 1500)
      }
      sock.onerror = () => sock?.close()
    }
    const id = requestAnimationFrame(() => {
      setLoaded(true)
      if (autoplayRef.current) begin()
      connect()
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      window.clearTimeout(retry)
      sock?.close()
    }
  }, [source, begin, resetPlayback, seek])

  /* ------------------------------------------------------------ the pixel map (pixi, client only) */

  useEffect(() => {
    const host = mapHostRef.current
    if (!host) return
    let disposed = false
    let map: TramMap | null = null
    import('./pixiMap')
      .then((m) => m.createTramMap(host, Math.min(2, window.devicePixelRatio || 1)))
      .then((created) => {
        if (disposed) {
          created.destroy()
          return
        }
        map = created
        mapRef.current = created
        const evs = eventsRef.current
        for (let i = 0; i < cursorRef.current; i++) created.handle(evs[i], true)
      })
      .catch((e: Error) => setError(`Không vẽ được bản đồ: ${e.message}`))
    return () => {
      disposed = true
      if (map) {
        if (mapRef.current === map) mapRef.current = null
        map.destroy()
      }
    }
  }, [])

  /* ------------------------------------------------------------ the clock: one requestAnimationFrame loop */

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastUi = 0
    const anchor = makeAnchor(mapRef)
    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(100, Math.max(0, ts - last))
      last = ts
      const running = startedRef.current && !pausedRef.current
      const adv = running ? dt * speedRef.current : 0
      playheadRef.current += adv
      const ph = playheadRef.current
      const evs = eventsRef.current
      const at = atRef.current
      const fired: StageEvent[] = []
      while (cursorRef.current < evs.length && at[cursorRef.current] <= ph) fired.push(evs[cursorRef.current++])
      const map = mapRef.current
      if (fired.length) {
        for (const ev of fired) {
          map?.handle(ev)
          if (ev.type === 'scene' && ev.scene === 'tong_ket') tongKetAtRef.current = ph
        }
        setSt((s) => fired.reduce((acc, ev) => applyEvent(acc, ev, ph, anchor), s))
      }
      map?.update(adv)

      const t = simTimeAt(evs, at, cursorRef.current, ph)
      if (t != null) {
        map?.setTime(t)
        const text = clockOf(t)
        if (text !== clockTextRef.current) {
          clockTextRef.current = text
          setClock({ text, t })
        }
      }

      const tagEl = vanTagRef.current
      if (tagEl) {
        const tag = map?.vanTag()
        if (tag) {
          tagEl.style.display = 'block'
          tagEl.style.transform = `translate(${tag.x}px, ${tag.y}px) translate(-50%, -100%)`
          if (tagEl.textContent !== tag.text) tagEl.textContent = tag.text
        } else if (tagEl.style.display !== 'none') tagEl.style.display = 'none'
      }

      if (fired.length || ts - lastUi > 100) {
        lastUi = ts
        setNow(ph)
        setSt((s) => prune(s, ph))
        if (!liveRef.current && totalRef.current) setProgress(Math.min(1, ph / totalRef.current))
      }

      if (!finalShownRef.current && evs.length && cursorRef.current >= evs.length) {
        const done = liveRef.current
          ? tongKetAtRef.current != null && ph >= tongKetAtRef.current + 2000
          : ph >= totalRef.current
        if (done) {
          finalShownRef.current = true
          showFinal(false)
        }
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [showFinal])

  /* ------------------------------------------------------------ keys: Space pause, F fullscreen */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'Escape') setLogOpen(false)
      else if (/^[1-7]$/.test(e.key) && !liveRef.current) {
        const slot = scenesRef.current[Number(e.key) - 1]
        if (slot) seek(slot.start)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause, toggleFullscreen, seek])

  /* ------------------------------------------------------------ render */

  const sIdx = sceneIndex(st.scene)
  const scene = sIdx >= 0 ? SCENES[sIdx] : null
  const isWs = source?.kind === 'ws'
  const mode = st.mode ?? (isWs ? 'live' : ((summary?.mode as string | undefined) ?? null))
  const slowK = slow ? 3 : 1
  const m = st.metrics
  const services = Object.entries(summary?.services ?? {})
    .filter(([k, v]) => typeof v === 'number' && SERVICE_LABELS[k])
    .map(([k, v]) => SERVICE_LABELS[k](v as number))
  const playing = started && !paused

  return (
    <div className="tzs-viewport">
      <div
        className="tzs-stage"
        style={{ transform: `scale(${scale || 1})`, visibility: scale ? 'visible' : 'hidden' }}
        data-scene={st.scene ?? ''}
        data-events={`${st.seen}/${eventCount}`}
      >
        <header className="tzs-header">
          <div className="tzs-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Chợ Z" />
            <div>
              <div className="tzs-brand-kicker">Chợ Z · mô phỏng một ngày</div>
              <div className="tzs-brand-title">Một ngày của Trạm Z</div>
            </div>
          </div>
          <div className="tzs-scene">
            <div className="tzs-scene-line">
              {scene ? (
                <>
                  <span className="tzs-scene-step">
                    {sIdx + 1}/{SCENES.length}
                  </span>
                  <span className="tzs-scene-title">{scene.title}</span>
                </>
              ) : (
                <span className="tzs-scene-title">{loaded ? '26 giờ trong 30 giây' : 'Đang tải dữ liệu…'}</span>
              )}
            </div>
            <div className="tzs-steps">
              {SCENES.map((s, i) => (
                <div key={s.code} className={i < sIdx ? 'done' : i === sIdx ? 'now' : ''} title={s.short} />
              ))}
            </div>
          </div>
          <div className="tzs-controls">
            <Btn on={playing} onClick={togglePause} title="Dừng / chạy (Space)">
              {playing ? <IconPause /> : <IconPlay />}
            </Btn>
            <Btn on={slow} onClick={toggleSlow} title="Chậm ×3">
              ×3
            </Btn>
            <Btn onClick={restart} title="Chạy lại">
              <IconRestart />
            </Btn>
            <Btn on={logOpen} onClick={() => setLogOpen((o) => !o)} title="Xem log">
              <IconLog />
              Xem log
            </Btn>
            <Btn on={!!final} onClick={() => (final ? setFinal(null) : showFinal(true))} title="Bảng 1 trạm và 50 trạm">
              <IconTable />
            </Btn>
            <Btn onClick={toggleFullscreen} title="Toàn màn hình (F)">
              <IconFull />
            </Btn>
          </div>
          <ModeBadge mode={mode} ws={isWs} wsState={wsState} />
        </header>
        {!isWs && (
          <div className="tzs-progress">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        <div className="tzs-map">
          <div className="tzs-map-host" ref={mapHostRef} />
          {PLACE_LABELS.map((p) => (
            <div key={p.text} className={`tzs-place ${p.tone}`} style={{ left: p.x, top: p.y }}>
              {p.text}
            </div>
          ))}
          <div className="tzs-van-tag" ref={vanTagRef} />
          <AnimatePresence>
            {st.scene === 'dang_ban' && st.listings.length > 0 && (
              <ListingPanel key="listings" listings={st.listings} slow={slowK} />
            )}
            {(st.scene === 'doi_soat' || st.scene === 'tong_ket') && st.settlement && (
              <SettlementPanel key="split" s={st.settlement} slow={slowK} />
            )}
          </AnimatePresence>
        </div>

        <div className="tzs-cards">
          {AGENTS.map((a, i) => {
            const s = st.agents[a.code]
            return <AgentCard key={a.code} info={a} s={s} active={s.activeUntil > now} top={cardTop(i) - MAIN_Y} height={CARD_H} />
          })}
        </div>

        <Beams beams={st.beams} slow={slowK} />
        <Bubbles bubbles={st.bubbles} slow={slowK} />
        <Flights flights={st.flights} slow={slowK} />
        <Ticks ticks={st.ticks} slow={slowK} />

        <footer className="tzs-bottom">
          <div className="tzs-bottom-row">
            <div className="tzs-clock">
              <div className="time">{clock?.text ?? '--:--'}</div>
              <div className="day">{clock ? (clock.t < 0 ? 'Tối hôm trước' : 'Ngày nhận Giỏ') : 'Giờ mô phỏng'}</div>
            </div>
            <Counter label="Đơn" value={m.orders} />
            <Counter label="Tiền hàng (đ)" value={m.gmv_vnd} flex={1.35} />
            <Counter label="Chi phí agent (đồng)" value={m.agent_cost_vnd} />
            <div className="tzs-pair">
              <Counter className="agent" label="Việc agent đã làm" value={m.agent_actions} />
              <Counter label="Lần người duyệt" value={m.human_approvals} />
            </div>
          </div>
          <div className="tzs-services">{services.length ? `Dịch vụ khác: ${services.join(' · ')}` : ' '}</div>
        </footer>

        {logOpen && <LogPanel lines={st.log} total={eventCount} onClose={() => setLogOpen(false)} />}

        {!started && loaded && !error && (
          <div className="tzs-start">
            <div className="tzs-start-card">
              <h1>Một ngày của Trạm Z</h1>
              <p>26 giờ của một trạm Giỏ, phát lại trong 30 giây · 6 agent, 2 người duyệt</p>
              <Btn on onClick={begin} title="Bắt đầu (Space)">
                <IconPlay />
                Bắt đầu · Space
              </Btn>
            </div>
          </div>
        )}

        <AnimatePresence>
          {final && (
            <FinalScreen
              key="final"
              headcount={headcount}
              logoSrc={logoSrc}
              immediate={final.manual}
              mode={mode}
              onClose={() => setFinal(null)}
            />
          )}
        </AnimatePresence>

        {error && <div className="tzs-error">{error}</div>}
      </div>
    </div>
  )
}
