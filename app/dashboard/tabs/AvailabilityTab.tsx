'use client'

import { useEffect, useState, useCallback } from 'react'
import HoursEditor from '@/components/availability/HoursEditor'
import BlocksPanel from '@/components/availability/BlocksPanel'
import { DayHours, BlockRow, fillWeekFromRows, getDefaultHours } from '@/lib/availability'
import { to24h, to12h } from '@/lib/timeUtils'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function AvailabilityTab() {
  const [hours, setHours] = useState<DayHours[]>(getDefaultHours())
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loadingHours, setLoadingHours] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)

  // ── Load weekly hours ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/availability/weekly', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: { availability?: DayHours[] }) => {
        const rows = data.availability ?? []
        // Backend stores startTime/endTime as 24hr strings; fill all 7 days
        setHours(fillWeekFromRows(rows))
      })
      .catch(() => setHours(getDefaultHours()))
      .finally(() => setLoadingHours(false))
  }, [])

  // ── Load blocks ────────────────────────────────────────────────────
  const loadBlocks = useCallback(() => {
    setLoadingBlocks(true)
    const end = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/admin/availability/blocks?startDate=${new Date().toISOString()}&endDate=${end}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: { blocks?: BlockRow[] }) => setBlocks(data.blocks ?? []))
      .catch(() => setBlocks([]))
      .finally(() => setLoadingBlocks(false))
  }, [])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  // ── Save weekly hours ──────────────────────────────────────────────
  async function saveHours() {
    setSaveState('saving')
    setError(null)
    try {
      // Convert 12hr UI display values to 24hr for backend;
      // isActive=false rows are omitted (backend treats absence as closed)
      const slots = hours
        .filter((h: DayHours) => h.isActive)
        .map((h: DayHours) => ({
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isActive: true,
        }))
      const res = await fetch('/api/admin/availability/weekly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Save failed')
      const data = await res.json()
      const returned = (data.availability ?? []) as DayHours[]
      setHours(fillWeekFromRows(returned))
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setSaveState('error')
    }
  }

  // ── Add block ──────────────────────────────────────────────────────
  async function addBlock(payload: { startAt: string; endAt: string; isFullDay: boolean; reason?: string }) {
    const res = await fetch('/api/admin/availability/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startAt: payload.startAt,
        endAt: payload.endAt,
        blockType: 'custom',
        reason: payload.reason,
      }),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed to block date')
    loadBlocks()
  }

  // ── Delete block ───────────────────────────────────────────────────
  async function deleteBlock(id: string) {
    const res = await fetch(`/api/admin/availability/blocks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to remove block')
    loadBlocks()
  }

  const loading = loadingHours

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 600,
          color: '#1C1008', margin: 0, lineHeight: 1,
        }}>
          Availability
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginTop: 8 }}>
          Set your open hours and block specific dates.
        </p>
      </div>

      {/* Two-column layout on lg+ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        gap: 24,
        alignItems: 'start',
      }}
        className="availability-grid"
      >
        {/* ── Weekly hours card ──────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8f0f1',
          padding: '24px',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1C1008', marginBottom: 18, fontFamily: 'Cormorant Garamond, serif' }}>
            Weekly hours
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} style={{ height: 40, borderRadius: 8, background: 'rgba(0,0,0,0.05)' }} />
              ))}
            </div>
          ) : (
            <>
              <HoursEditor
                hours={hours}
                onChange={setHours}
                disabled={saveState === 'saving'}
              />

              {error && (
                <div style={{
                  marginTop: 14, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
                  fontSize: 13, color: '#c0392b',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <button
                  onClick={saveHours}
                  disabled={saveState === 'saving'}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 10,
                    background: saveState === 'saved' ? '#27ae60' : '#F5C518',
                    color: '#fff', border: 'none',
                    cursor: saveState === 'saving' ? 'default' : 'pointer',
                    opacity: saveState === 'saving' ? 0.65 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save hours'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Blocked dates card ─────────────────────────────────── */}
        <div style={{
          background: '#F5F7F8', borderRadius: 16,
          border: '1px solid #e8f0f1',
          padding: '24px',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1C1008', marginBottom: 18, fontFamily: 'Cormorant Garamond, serif' }}>
            Blocked dates
          </div>

          {loadingBlocks ? (
            <div style={{ height: 120, borderRadius: 8, background: 'rgba(0,0,0,0.05)' }} />
          ) : (
            <BlocksPanel
              blocks={blocks}
              onAdd={addBlock}
              onDelete={deleteBlock}
            />
          )}
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 860px) {
          .availability-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
