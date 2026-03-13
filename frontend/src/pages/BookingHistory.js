import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import axios from "axios"
const API = process.env.REACT_APP_URL || "http://localhost:5000";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—"
const fmtAmt  = (a) => `₵${parseFloat(a??0).toFixed(2)}`

const StatusBadge = ({ s }) => {
  const m = { confirmed:["#198754","Confirmed"], cancelled:["#dc3545","Cancelled"], pending:["#e6a817","Pending"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}
const PayBadge = ({ s }) => {
  const m = { paid:["#198754","Paid"], refunded:["#0895b3","Refunded"], pending:["#e6a817","Pending"], failed:["#dc3545","Failed"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}

const columns = [
  { name:"#", width:"55px", cell:(_,i) => i+1, },
  { name:"Customer", grow:2, cell: r => (
    <div className="d-flex align-items-center gap-2 py-1">
      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{width:32,height:32}}>
        <span className="text-white fw-bold" style={{fontSize:12}}>{r.name?.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <div className="fw-semibold" style={{fontSize:13}}>{r.name}</div>
        <div className="text-muted" style={{fontSize:11}}>{r.email}</div>
      </div>
    </div>
  )},
  { name:"Contact",      selector: r => r.contact,      cell: r => r.contact || "—" },
  { name:"Date",         selector: r => r.booking_date, cell: r => fmtDate(r.booking_date), sortable:true },
  { name:"Slot",         selector: r => r.slot_label,   cell: r => r.slot_label || "—" },
  { name:"Amount",       selector: r => r.amount,       cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Status",       cell: r => <StatusBadge s={r.status} /> },
  { name:"Payment",      cell: r => <PayBadge s={r.payment_status} /> },
  { name:"Booked On",    selector: r => r.created_at,   cell: r => fmtDate(r.created_at), sortable:true },
]

const customStyles = {
  headRow:  { style: { background:"#1a56db", color:"white", fontSize:13, fontWeight:600, borderRadius:"4px 4px 0 0" } },
  headCells:{ style: { color:"white", fontWeight:600 } },
  rows:     { style: { fontSize:13, cursor:"pointer" }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [payment,  setPayment]  = useState("")
  const [selected, setSelected] = useState(null)
  const [summary,  setSummary]  = useState({ total:0, confirmed:0, cancelled:0, revenue:0 })

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get(`${API}/api/admin/get-bookings`, { headers })
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : []
        setBookings(rows)
        setSummary({
          total:     rows.length,
          confirmed: rows.filter(r => r.status === "confirmed").length,
          cancelled: rows.filter(r => r.status === "cancelled").length,
          revenue:   rows.filter(r => r.payment_status === "paid").reduce((s,r) => s + parseFloat(r.amount??0), 0),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => bookings.filter(r => {
    const q = search.toLowerCase()
    return (
      (!q      || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.slot_label?.toLowerCase().includes(q)) &&
      (!status  || r.status === status) &&
      (!payment || r.payment_status === payment)
    )
  }), [bookings, search, status, payment])

  return (
    <div className="col-xxl-12">
      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { label:"Total",     value:summary.total,           icon:"bi-calendar-check", color:"primary" },
          { label:"Confirmed", value:summary.confirmed,       icon:"bi-check-circle",   color:"success" },
          { label:"Cancelled", value:summary.cancelled,       icon:"bi-x-circle",       color:"danger"  },
          { label:"Revenue",   value:fmtAmt(summary.revenue), icon:"bi-cash-coin",      color:"warning" },
        ].map(c => (
          <div className="col-6 col-md-3" key={c.label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <div className={`rounded-circle bg-${c.color} bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:44,height:44}}>
                  <i className={`bi ${c.icon} text-${c.color} fs-5`}></i>
                </div>
                <div>
                  <div className="fw-bold fs-5 lh-1">{c.value}</div>
                  <div className="text-muted small">{c.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Booking History</h5>
          <div className="input-group input-group-sm" style={{width:220}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Name, email, slot…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select form-select-sm" style={{width:140}} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <select className="form-select form-select-sm" style={{width:140}} value={payment} onChange={e => setPayment(e.target.value)}>
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          {(search||status||payment) && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => { setSearch(""); setStatus(""); setPayment("") }}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <div className="card-body">

          <DataTable
            columns={columns}
            data={filtered}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10,25,50,100]}
            highlightOnHover
            pointerOnHover
            customStyles={customStyles}
            onRowClicked={row => setSelected(row)}
            noDataComponent={<div className="py-5 text-muted text-center"><i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-25"></i>No bookings found</div>}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background:"rgba(0,0,0,0.5)"}} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:460}} onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div style={{background:"linear-gradient(135deg,#1a56db,#0e3fa5)",padding:"18px 24px"}}>
                <h5 className="mb-0 text-white fw-bold">Booking Detail</h5>
                <small className="text-white opacity-75">Booked on {fmtDate(selected.created_at)}</small>
              </div>
              <div className="modal-body px-4 py-3">
                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded" style={{background:"#f8f9fa"}}>
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{width:44,height:44}}>
                    <span className="text-white fw-bold fs-5">{selected.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="fw-bold">{selected.name}</div>
                    <div className="text-muted small">{selected.email}</div>
                    {selected.contact && <div className="text-muted small">{selected.contact}</div>}
                  </div>
                </div>
                {[
                  { label:"Booking Date", value: fmtDate(selected.booking_date) },
                  { label:"Time Slot",    value: selected.slot_label },
                  { label:"Amount",       value: fmtAmt(selected.amount) },
                  { label:"Status",       value: <StatusBadge s={selected.status} /> },
                  { label:"Payment",      value: <PayBadge s={selected.payment_status} /> },
                ].map(row => (
                  <div key={row.label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">{row.label}</span>
                    <span className="fw-semibold small">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0 px-4 pb-4 pt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}