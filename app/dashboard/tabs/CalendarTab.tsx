'use client'

import { useState, useEffect } from 'react'
import { buildDateMap, DateMap } from '@/lib/calendar'
import DashboardCalendar from '@/components/calendar/DashboardCalendar'

export default function CalendarTab() {
  const [dateMap, setDateMap] = useState<DateMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().substring(0, 10)
        const in90 = new Date(Date.now() + 90 * 864e5).toISOString().substring(0, 10)
        const [apptRes, blocksRes] = await Promise.all([
          fetch('/api/admin/bookings', { cache: 'no-store' }),
          fetch(`/api/admin/availability/blocks?startDate=${today}&endDate=${in90}`, { cache: 'no-store' }),
        ])
        const [apptData, blocksData] = await Promise.all([
          apptRes.json().catch(() => ({})),
          blocksRes.json().catch(() => ({})),
        ])
        setDateMap(buildDateMap(
          apptData.appointments ?? apptData.data ?? [],
          blocksData.blocks ?? blocksData.data ?? [],
        ))
      } catch {
        setError('Could not load calendar data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'rgba(0,0,0,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
        Loading calendar…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#991B1B', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #e8f0f1', padding: '24px',
    }}>
      <DashboardCalendar dateMap={dateMap} mode="full" />
    </div>
  )
}
