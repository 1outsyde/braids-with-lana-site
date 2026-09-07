/** Time display options shown in dropdowns — 6:00 AM to 11:30 PM in 30-min steps */
export const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = []
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? 'AM' : 'PM'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      opts.push(`${h12}:${m === 0 ? '00' : '30'} ${period}`)
    }
  }
  return opts
})()

/** "9:00 AM" → "09:00" */
export function to24h(t12: string): string {
  const m = t12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return t12
  let h = parseInt(m[1], 10)
  const min = m[2]
  const period = m[3].toUpperCase()
  if (period === 'AM' && h === 12) h = 0
  else if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${min}`
}

/** "09:00" → "9:00 AM" */
export function to12h(t24: string): string {
  const m = t24.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t24
  let h = parseInt(m[1], 10)
  const min = m[2]
  const period = h < 12 ? 'AM' : 'PM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${min} ${period}`
}
