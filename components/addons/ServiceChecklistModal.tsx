'use client'

import { useState } from 'react'
import { C } from './theme'

export interface ChecklistService {
  id: string
  name: string
  note?: string   // e.g. "own price $15.00"
}

interface Props {
  title: string
  message?: string
  services: ChecklistService[]
  // When false the list is shown read-only (e.g. delete: it comes off every service).
  selectable?: boolean
  confirmLabel: (selectedCount: number) => string
  danger?: boolean
  emptyText?: string
  allowEmptyConfirm?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: (selectedIds: string[]) => void
  onClose: () => void
}

// One pop-up for every "which services?" question in the add-on library:
// adding to services, switching on/off, and confirming a delete.
export default function ServiceChecklistModal({
  title, message, services, selectable = true, confirmLabel, danger = false,
  emptyText = 'No services to show.', allowEmptyConfirm = false, busy = false, error = null,
  onConfirm, onClose,
}: Props) {
  // Everything starts ticked. The parent mounts a fresh modal each time it opens.
  const [selected, setSelected] = useState<string[]>(() => services.map((s) => s.id))

  const allSelected = services.length > 0 && selected.length === services.length
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const count = selectable ? selected.length : services.length
  const canConfirm = !busy && (allowEmptyConfirm || count > 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}
      style={{ position: 'fixed', inset: 0, background: C.overlay, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{ background: C.surface, borderRadius: 16, maxWidth: 460, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
        <div style={{ padding: '22px 24px 14px', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontFamily: C.headingFont, fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h2>
          {message && <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0', lineHeight: 1.5 }}>{message}</p>}
        </div>

        <div style={{ padding: '12px 24px', overflowY: 'auto', flex: 1 }}>
          {services.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, margin: '6px 0' }}>{emptyText}</p>
          ) : (
            <>
              {selectable && services.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{selected.length} of {services.length} selected</span>
                  <button
                    type="button"
                    onClick={() => setSelected(allSelected ? [] : services.map((s) => s.id))}
                    style={{ fontSize: 12, background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, padding: 0 }}
                  >
                    {allSelected ? 'Select none' : 'Select all'}
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {services.map((s) => {
                  const checked = selected.includes(s.id)
                  const row = (
                    <>
                      {selectable && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(s.id)}
                          style={{ width: 16, height: 16, accentColor: C.accent, flexShrink: 0 }}
                        />
                      )}
                      <span style={{ flex: 1, fontSize: 14, color: C.text }}>{s.name}</span>
                      {s.note && <span style={{ fontSize: 12, color: C.muted }}>{s.note}</span>}
                    </>
                  )
                  return selectable ? (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: C.surface2, cursor: 'pointer' }}>
                      {row}
                    </label>
                  ) : (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: C.surface2 }}>
                      {row}
                    </div>
                  )
                })}
              </div>
            </>
          )}
          {error && <p style={{ fontSize: 12, color: C.danger, margin: '10px 0 0' }}>{error}</p>}
        </div>

        <div style={{ padding: '14px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ height: 40, padding: '0 18px', borderRadius: 8, fontSize: 14, background: 'none', color: C.muted, border: `1px solid ${C.border}`, cursor: busy ? 'default' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(selectable ? selected : services.map((s) => s.id))}
            style={{
              height: 40, padding: '0 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
              background: danger ? C.danger : C.accent, color: danger ? C.onDanger : C.onAccent,
              cursor: canConfirm ? 'pointer' : 'default', opacity: canConfirm ? 1 : 0.5,
            }}
          >
            {busy ? 'Saving…' : confirmLabel(count)}
          </button>
        </div>
      </div>
    </div>
  )
}
