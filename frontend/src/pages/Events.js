import { useEffect, useRef } from 'react'

export default function Events() {
  const calendarRef = useRef(null)

  useEffect(() => {
    const calendar = new window.FullCalendar.Calendar(calendarRef.current, {
      initialView: 'dayGridMonth',
	  headerToolbar: {
			left: "prevYear,prev,next,nextYear today",
			center: "title",
			right: "dayGridMonth,dayGridWeek,dayGridDay",
		},
      selectable: true,
      draggable:true,
	  

      events: [
        { title: 'Meeting', date: '2026-02-25',color:'#fd7e14' },
        { title: 'Demo', date: '2026-02-27', color: "#da0202" }
      ],

      dateClick(info) {
        alert(`Date clicked: ${info.dateStr}`)
      },

      eventClick(info) {
        alert(`Event clicked: ${info.event.title}`)
      }
    })

    calendar.render()

    return () => calendar.destroy()
  }, [])

  return (
    
                <div className="row gx-3">
							<div className="col-xxl-12">
								
								<div className="card">
									<div className="card-body">
										<div ref={calendarRef}></div>
									</div>
								</div>
								
							</div>
							</div>
  )
}

