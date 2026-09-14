import CalendarTab from '../tabs/CalendarTab'

export default function CalendarPage() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 38, fontWeight: 600, color: '#1C1008',
          margin: 0, lineHeight: 1,
        }}>
          Calendar
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginTop: 8 }}>
          Bookings and blocked dates
        </p>
      </div>
      <CalendarTab />
    </div>
  )
}
