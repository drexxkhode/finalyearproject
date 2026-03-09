import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Calendar, dateFnsLocalizer } from "react-big-calendar"

import { format, parse, startOfWeek, getDay } from "date-fns"
import enUS from "date-fns/locale/en-US";
import '../components/Calendar.css';

import { useState } from "react"

const locales = {
  "en-US": enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

const events = [
  {
    title: "Football Match",
    start: new Date(2026, 2, 10, 10, 0),
    end: new Date(2026, 2, 10, 12, 0)
  },
  {
    title: "Training",
    start: new Date(2026, 2, 10, 14, 0),
    end: new Date(2026, 2, 10, 16, 0)
  },
  {
    title: "League Match",
    start: new Date(2026, 2, 12, 18, 0),
    end: new Date(2026, 2, 12, 20, 0)
  }
]

function CalendarComponent() {

  const [view, setView] = useState("month")
  const [date, setDate] = useState(new Date())

  const handleNavigate = (newDate) => {
    setDate(newDate)
  }

  const handleView = (newView) => {
    setView(newView)
  }

  const handleSelectSlot = (slotInfo) => {
    setDate(slotInfo.start)
    setView("day")
  }

  const handleSelectEvent = (event) => {
    alert(event.title)
  }

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        date={date}
        view={view}
        selectable
        onNavigate={handleNavigate}
        onView={handleView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        startAccessor="start"
        endAccessor="end"
        views={["month","week","day","agenda"]}
        style={{ height: 600 }}
      />
    </div>
  )
}

export default function Events() {
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
}