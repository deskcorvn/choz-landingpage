'use client'

import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** A counter that rolls to its new value with easing (framer-motion), writing text directly to avoid re-renders. */
export function RollingNumber({ value, format, duration = 0.8 }: { value: number; format: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(value)
  const formatRef = useRef(format)
  const [initial] = useState(() => format(value))

  useEffect(() => {
    formatRef.current = format
  }, [format])

  useEffect(() => {
    const from = shown.current
    if (from === value) {
      if (ref.current) ref.current.textContent = formatRef.current(value)
      return
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v
        if (ref.current) ref.current.textContent = formatRef.current(v)
      },
    })
    return () => controls.stop()
  }, [value, duration])

  return <span ref={ref}>{initial}</span>
}
