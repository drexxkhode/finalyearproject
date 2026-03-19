import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—"
const fmtAmt  = (a) => `₵${parseFloat(a??0).toFixed(2)}`

const StatusBadge = ({ s }) => {
  const m = {
    confirmed: ["#198754","Confirmed"],
    cancelled: ["#dc3545","Cancelled"],
    completed: ["#0895b3","Completed"],
    pending:   ["#e6a817","Pending"],
  }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}
const PayBadge = ({ s }) => {
  const m = {
    paid:           ["#198754","Paid"],
    refunded:       ["#0895b3","Refunded"],
    refund_pending: ["#6f42c1","Refund Pending"],
    no_refund:      ["#fd7e14","No Refund"],
    pending:        ["#e6a817","Pending"],
    failed:         ["#dc3545","Failed"],
  }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}

const columns = [
  { name:"#",         width:"55px", cell:(_,i) => i+1 },
  { name:"Customer",  grow:2,       selector: r => r.name,         cell: r => <div><div className="fw-semibold" style={{fontSize:13}}>{r.name||"—"}</div><div className="text-muted" style={{fontSize:11}}>{r.email||"—"}</div></div> },
  { name:"Contact",                 selector: r => r.contact,      cell: r => r.contact||"—" },
  { name:"Date",                    selector: r => r.booking_date, cell: r => fmtDate(r.booking_date), sortable:true },
  { name:"Slot",                    selector: r => r.slot_label,   cell: r => r.slot_label||"—" },
  { name:"Amount",                  selector: r => r.amount,       cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Status",                  cell: r => <StatusBadge s={r.status} /> },
  { name:"Payment",                 cell: r => <PayBadge s={r.payment_status} /> },
  { name:"Booked On",               selector: r => r.created_at,   cell: r => fmtDate(r.created_at), sortable:true },
]

const customStyles = {
  headRow:  { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells:{ style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:     { style: { fontSize:13 }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

const exportCSV = (data, filename) => {
  const headers = ["#","Customer","Email","Contact","Date","Slot","Amount","Status","Payment","Booked On"]
  const rows = data.map((r,i) => [
    i+1, r.name||"", r.email||"", r.contact||"",
    fmtDate(r.booking_date), r.slot_label||"",
    fmtAmt(r.amount), r.status, r.payment_status,
    fmtDate(r.created_at)
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type:"text/csv" })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click()
  URL.revokeObjectURL(url)
}

const exportJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click()
  URL.revokeObjectURL(url)
}

const printTable = (data) => {
  const rows = data.map((r,i) => `
    <tr>
      <td>${i+1}</td><td>${r.name||"—"}</td><td>${r.email||"—"}</td><td>${r.contact||"—"}</td>
      <td>${fmtDate(r.booking_date)}</td><td>${r.slot_label||"—"}</td>
      <td>${fmtAmt(r.amount)}</td><td>${r.status}</td><td>${r.payment_status}</td>
    </tr>`).join("")
  const win = window.open("","_blank")
  win.document.write(`<html><head><title>Bookings Report</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}
    th{background:#1a56db;color:white;padding:6px 8px;text-align:left}
    td{padding:5px 8px;border-bottom:1px solid #dee2e6}tr:nth-child(even) td{background:#f8f9fa}
    h2{color:#1a56db}</style></head><body>
    <h2>Bookings Report</h2>
    <p>Generated: ${new Date().toLocaleString()} | ${data.length} records</p>
    <table><thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Contact</th><th>Date</th><th>Slot</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
  win.document.close()
  win.print()
}

export default function BookingReport() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [payment,  setPayment]  = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")
  const [summary,  setSummary]  = useState({ total:0, confirmed:0, cancelled:0, refunded:0, completed:0, revenue:0 })
  const [generated,setGenerated]= useState(null)

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = () => {
    setLoading(true)
    axios.get(`${API}/api/admin/get-bookings`, { headers })
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : []
        setBookings(rows)
        setGenerated(new Date().toLocaleString())
        setSummary({
          total:     rows.length,
          confirmed: rows.filter(r => r.status === "confirmed").length,
          cancelled: rows.filter(r => r.status === "cancelled").length,
          refunded:  rows.filter(r => r.payment_status === "refunded").length,
          completed: rows.filter(r => r.status === "completed").length,
          revenue:   rows
            .filter(r => r.payment_status === "paid" || r.payment_status === "no_refund")
            .reduce((s,r) => s + parseFloat(r.amount??0), 0),
        })
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => bookings.filter(r => {
    const q = search.toLowerCase()
    const d = r.booking_date?.slice(0,10) ?? ""
    return (
      (!q       || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.slot_label?.toLowerCase().includes(q)) &&
      (!status  || r.status === status) &&
      (!payment || r.payment_status === payment) &&
      (!dateFrom|| d >= dateFrom) &&
      (!dateTo  || d <= dateTo)
    )
  }), [bookings, search, status, payment, dateFrom, dateTo])

  const hasFilter = search||status||payment||dateFrom||dateTo
  const clearAll  = () => { setSearch(""); setStatus(""); setPayment(""); setDateFrom(""); setDateTo("") }

  return (
    <div className="col-xxl-12">
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">Bookings Report</h4>
          {generated && <small className="text-muted">Generated: {generated}</small>}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        {[
          { label:"Total",     value:summary.total,           icon:"bi-calendar-check",        color:"primary" },
          { label:"Confirmed", value:summary.confirmed,       icon:"bi-check-circle-fill",     color:"info"    },
          { label:"Cancelled", value:summary.cancelled,       icon:"bi-x-circle-fill",         color:"danger"  },
          { label:"Refunded",  value:summary.refunded,        icon:"bi-arrow-counterclockwise", color:"warning" },
          { label:"Completed", value:summary.completed,       icon:"bi-patch-check-fill",      color:"success" },
          { label:"Revenue",   value:fmtAmt(summary.revenue), icon:"bi-cash-coin",             color:"success" },
        ].map(c => (
          <div className="col-6 col-xl-2" key={c.label}>
            <div className="card border-0 shadow-sm text-center h-100">
              <div className="card-body py-3">
                <i className={`bi ${c.icon} text-${c.color} fs-4 d-block mb-1`}></i>
                <div className="fw-bold fs-5">{c.value}</div>
                <div className="text-muted" style={{fontSize:11}}>{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Report Table</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigator.clipboard.writeText(filtered.map(r=>[r.name,r.email,fmtDate(r.booking_date),r.slot_label,fmtAmt(r.amount),r.status,r.payment_status].join("\t")).join("\n"))}>
            <i className="bi bi-clipboard me-1"></i>Copy
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={() => exportCSV(filtered,`bookings-${Date.now()}.csv`)}>
            <i className="bi bi-filetype-csv me-1"></i>CSV
          </button>
          <button className="btn btn-sm btn-success" onClick={() => exportJSON(filtered,`bookings-${Date.now()}.json`)}>
            <i className="bi bi-file-earmark-code me-1"></i>JSON
          </button>
          <button className="btn btn-sm btn-info text-white" onClick={() => printTable(filtered)}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
        </div>

        {/* Filters */}
        <div className="card-body border-bottom pb-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Name, email, slot…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={payment} onChange={e => setPayment(e.target.value)}>
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="refund_pending">Refund Pending</option>
                <option value="no_refund">No Refund</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control form-control-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {hasFilter && (
              <div className="col-auto">
                <button className="btn btn-outline-danger btn-sm" onClick={clearAll}>
                  <i className="bi bi-x-lg me-1"></i>Clear
                </button>
              </div>
            )}
          </div>
          {hasFilter && (
            <div className="d-flex flex-wrap gap-1 mt-2">
              {search   && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-normal">"{search}"</span>}
              {status   && <span className="badge bg-secondary bg-opacity-10 text-secondary border fw-normal">{status}</span>}
              {payment  && <span className="badge bg-secondary bg-opacity-10 text-secondary border fw-normal">{payment}</span>}
              {dateFrom && <span className="badge bg-secondary bg-opacity-10 text-secondary border fw-normal">From: {dateFrom}</span>}
              {dateTo   && <span className="badge bg-secondary bg-opacity-10 text-secondary border fw-normal">To: {dateTo}</span>}
              <span className="badge bg-light text-muted border fw-normal">{filtered.length} records</span>
            </div>
          )}
        </div>

        <div className="card-body">
          <DataTable
            columns={columns}
            data={filtered}
            progressPending={loading}
            pagination
            paginationPerPage={25}
            paginationRowsPerPageOptions={[10,25,50,100]}
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={<div className="py-5 text-muted text-center"><i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-25"></i>No bookings match the selected filters</div>}
          />
        </div>
      </div>
    </div>
  )
}