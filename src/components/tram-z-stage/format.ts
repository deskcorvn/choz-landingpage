const intVN = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const dec2VN = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const dec1VN = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

export const fmtInt = (n: number) => intVN.format(Math.round(n))
export const fmtDec = (n: number) => dec2VN.format(n)
export const fmtPct = (n: number) => `${dec1VN.format(n)}%`
export const fmtVnd = (n: number) => `${intVN.format(Math.round(n))} đ`

/** "HH:MM" of simulated seconds (negative = the evening before), same rule as schema.clock(). */
export function clockOf(t: number): string {
  const minutes = (((Math.floor(t / 60) % 1440) + 1440) % 1440) | 0
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Model latency for the agent card: "850 ms" or "12,9 s". */
export function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${dec1VN.format(ms / 1000)} s`
}
