import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import enUS from "date-fns/locale/en-US"
import '../components/Calendar.css'
import { useState } from "react"

const API = process.env.REACT_APP_URL || "http://localhost:5000"

const locales = { "en-US": enUS }

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const initialEvents = [
  {
    id: 1,
    title: "Football Match",
    start: new Date(2026, 2, 10, 10, 0),
    end: new Date(2026, 2, 10, 12, 0)
  },
  {
    id: 2,
    title: "Training",
    start: new Date(2026, 2, 10, 14, 0),
    end: new Date(2026, 2, 10, 16, 0)
  },
  {
    id: 3,
    title: "League Match",
    start: new Date(2026, 2, 12, 18, 0),
    end: new Date(2026, 2, 12, 20, 0)
  }
]

// Utility to format datetime-local input value
function toDatetimeLocal(date) {
  if (!date) return ""
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Modal Component
function EventModal({ isOpen, onClose, onSave, onDelete, slotInfo, existingEvent }) {
  const isEditing = Boolean(existingEvent)

  const [form, setForm] = useState(() => ({
    title: existingEvent?.title || "",
    start: toDatetimeLocal(existingEvent?.start || slotInfo?.start),
    end: toDatetimeLocal(existingEvent?.end || slotInfo?.end || slotInfo?.start),
    notes: existingEvent?.notes || ""
  }))

  // Reset form when modal opens with new data
  useState(() => {
    setForm({
      title: existingEvent?.title || "",
      start: toDatetimeLocal(existingEvent?.start || slotInfo?.start),
      end: toDatetimeLocal(existingEvent?.end || slotInfo?.end || slotInfo?.start),
      notes: existingEvent?.notes || ""
    })
  }, [existingEvent, slotInfo])

  if (!isOpen) return null

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      ...(existingEvent || {}),
      title: form.title,
      start: new Date(form.start),
      end: new Date(form.end),
      notes: form.notes
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10,12,20,0.55)",
          backdropFilter: "blur(3px)",
          zIndex: 1050,
          animation: "fadeIn 0.18s ease"
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1055,
        width: "100%",
        maxWidth: 480,
        padding: "0 16px",
        animation: "slideUp 0.22s cubic-bezier(.4,0,.2,1)"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          overflow: "hidden"
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a56db 0%, #0e3fa5 100%)",
            padding: "20px 24px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
                {isEditing ? "Edit Time Slot" : "New Time Slot"}
              </h5>
              <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                {isEditing ? "Update the details below" : "Fill in the slot details"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                width: 34, height: 34,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, lineHeight: 1,
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Training Session"
                required
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 8,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 14, color: "#111827",
                  outline: "none", transition: "border-color 0.15s",
                  fontFamily: "inherit"
                }}
                onFocus={e => e.target.style.borderColor = "#1a56db"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            {/* Start / End */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  Start
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  value={form.start}
                  onChange={handleChange}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 12px", borderRadius: 8,
                    border: "1.5px solid #e5e7eb",
                    fontSize: 13, color: "#111827",
                    outline: "none", transition: "border-color 0.15s",
                    fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#1a56db"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  End
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  value={form.end}
                  onChange={handleChange}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 12px", borderRadius: 8,
                    border: "1.5px solid #e5e7eb",
                    fontSize: 13, color: "#111827",
                    outline: "none", transition: "border-color 0.15s",
                    fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#1a56db"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                Notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 8,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 14, color: "#111827",
                  outline: "none", resize: "vertical",
                  transition: "border-color 0.15s",
                  fontFamily: "inherit", minHeight: 72
                }}
                onFocus={e => e.target.style.borderColor = "#1a56db"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onDelete(existingEvent)}
                  style={{
                    padding: "9px 16px", borderRadius: 8,
                    border: "1.5px solid #fee2e2",
                    background: "#fff5f5", color: "#dc2626",
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer", marginRight: "auto",
                    transition: "all 0.15s", fontFamily: "inherit"
                  }}
                  onMouseEnter={e => { e.target.style.background = "#fee2e2" }}
                  onMouseLeave={e => { e.target.style.background = "#fff5f5" }}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 18px", borderRadius: 8,
                  border: "1.5px solid #e5e7eb",
                  background: "#fff", color: "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s", fontFamily: "inherit"
                }}
                onMouseEnter={e => { e.target.style.background = "#f9fafb" }}
                onMouseLeave={e => { e.target.style.background = "#fff" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "9px 22px", borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #1a56db 0%, #0e3fa5 100%)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(26,86,219,0.35)",
                  transition: "opacity 0.15s", fontFamily: "inherit"
                }}
                onMouseEnter={e => { e.target.style.opacity = "0.88" }}
                onMouseLeave={e => { e.target.style.opacity = "1" }}
              >
                {isEditing ? "Save Changes" : "Add Slot"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  )
}

// Main Calendar Component
function CalendarComponent() {
  const [events, setEvents] = useState(initialEvents)
  const [view, setView] = useState("month")
  const [date, setDate] = useState(new Date())
  const [modal, setModal] = useState({ isOpen: false, slotInfo: null, existingEvent: null })

  const openNewSlot = (slotInfo) => {
    setModal({ isOpen: true, slotInfo, existingEvent: null })
  }

  const openEditEvent = (event) => {
    setModal({ isOpen: true, slotInfo: null, existingEvent: event })
  }

  const closeModal = () => {
    setModal({ isOpen: false, slotInfo: null, existingEvent: null })
  }

  const handleSave = (eventData) => {
    if (eventData.id) {
      // Edit existing
      setEvents((prev) => prev.map((e) => e.id === eventData.id ? eventData : e))
    } else {
      // Create new
      setEvents((prev) => [...prev, { ...eventData, id: Date.now() }])
    }
    closeModal()
  }

  const handleDelete = (event) => {
    setEvents((prev) => prev.filter((e) => e.id !== event.id))
    closeModal()
  }

  return (
    <>
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          date={date}
          view={view}
          selectable
          onNavigate={setDate}
          onView={setView}
          onSelectSlot={openNewSlot}
          onSelectEvent={openEditEvent}
          startAccessor="start"
          endAccessor="end"
          views={["month", "week", "day", "agenda"]}
          style={{ height: 600 }}
        />
      </div>

      <EventModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        slotInfo={modal.slotInfo}
        existingEvent={modal.existingEvent}
      />
    </>
  )
}

export default function Slots() {
  return (
    <div className="row gx-3">
      <div className="col-xxl-12">
        <div className="card calendar-card">
          <div className="card-body">
            <CalendarComponent />
          </div>
        </div>
      </div>
    </div>
  )
};