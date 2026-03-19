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
  { name:"#",        width:"55px", cell:(_,i) => i+1 },
  { name:"Customer", grow:2,       selector: r => r.name,         cell: r => (
    <div className="py-1">
      <div className="fw-semibold" style={{fontSize:13}}>{r.name||"—"}</div>
      <div className="text-muted"  style={{fontSize:11}}>{r.email}</div>
    </div>
  )},
  { name:"Contact",  selector: r => r.contact,       cell: r => r.contact||"—" },
  { name:"Date",     selector: r => r.booking_date,  cell: r => fmtDate(r.booking_date), sortable:true },
  { name:"Time Slot",selector: r => r.slot_label,    cell: r => r.slot_label||"—" },
  { name:"Amount",   selector: r => r.amount,        cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Status",   cell: r => <StatusBadge s={r.status} /> },
  { name:"Payment",  cell: r => <PayBadge s={r.payment_status} /> },
  { name:"Action", cell:r=> <button className="btn btn-danger btn-sm" ><i className="bi bi-trash" /></button>  },
]

const customStyles = {
  headRow:   { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells: { style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:      { style: { fontSize:13 }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

const Bookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [payment,  setPayment]  = useState("")

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchBookings = () => {
    setLoading(true)
    axios.get(`${API}/api/admin/get-bookings`, { headers })
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

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
      <div className="card mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Bookings</h5>

          <div className="input-group input-group-sm" style={{width:210}}>
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
            <button className="btn btn-outline-danger btn-sm"
              onClick={() => { setSearch(""); setStatus(""); setPayment("") }}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm" onClick={fetchBookings}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={filtered}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10,25,50,100]}
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="py-5 text-muted text-center">
                <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-25"></i>
                No bookings found
              </div>
            }

          />
        </div>
      </div>
    </div>
  )
}

export default Bookings