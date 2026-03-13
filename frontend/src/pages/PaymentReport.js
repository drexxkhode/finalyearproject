import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component";
import axios from "axios";
const API = process.env.REACT_APP_URL || "http://localhost:5000";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—"
const fmtAmt  = (a) => `₵${parseFloat(a??0).toFixed(2)}`

const PayBadge = ({ s }) => {
  const m = { completed:["#198754","Completed"], refunded:["#0895b3","Refunded"], pending:["#e6a817","Pending"], failed:["#dc3545","Failed"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}

const columns = [
  { name:"#",           width:"55px",  cell:(_,i) => i+1 },
  { name:"Customer",    grow:2,        cell: r => <div><div className="fw-semibold" style={{fontSize:13}}>{r.user_name||"—"}</div><div className="text-muted" style={{fontSize:11}}>{r.user_email}</div></div> },
  { name:"Contact",                    selector: r => r.user_contact,  cell: r => r.user_contact||"—" },
  { name:"Reference",                  selector: r => r.paystack_ref,  cell: r => <code style={{fontSize:10,background:"#f1f3f5",padding:"2px 5px",borderRadius:3}}>{r.paystack_ref}</code> },
  { name:"Paid At",                    selector: r => r.paid_at,       cell: r => fmtDate(r.paid_at), sortable:true },
  { name:"Amount",                     selector: r => r.amount,        cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Slots",       width:"70px",  selector: r => r.slot_count,    cell: r => r.slot_count||0 },
  { name:"Slot Labels",                selector: r => r.slot_labels,   cell: r => <span title={r.slot_labels} style={{fontSize:12,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{r.slot_labels||"—"}</span> },
  { name:"Status",                     cell: r => <PayBadge s={r.payment_status} /> },
]

const customStyles = {
  headRow:  { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells:{ style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:     { style: { fontSize:13 }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

const exportCSV = (data, filename) => {
  const headers = ["#","Customer","Email","Contact","Reference","Paid At","Amount","Slots","Slot Labels","Status"]
  const rows = data.map((r,i) => [
    i+1, r.user_name||"", r.user_email||"", r.user_contact||"",
    r.paystack_ref||"", fmtDate(r.paid_at), fmtAmt(r.amount),
    r.slot_count||0, r.slot_labels||"", r.payment_status
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type:"text/csv" })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click()
  URL.revokeObjectURL(url)
}

const printTable = (data) => {
  const rows = data.map((r,i) => `<tr>
    <td>${i+1}</td><td>${r.user_name||"—"}</td><td>${r.user_email||"—"}</td>
    <td>${r.paystack_ref||"—"}</td><td>${fmtDate(r.paid_at)}</td>
    <td>${fmtAmt(r.amount)}</td><td>${r.slot_count||0}</td><td>${r.payment_status}</td>
  </tr>`).join("")
  const win = window.open("","_blank")
  win.document.write(`<html><head><title>Payment Report</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}
    th{background:#1a56db;color:white;padding:6px 8px;text-align:left}
    td{padding:5px 8px;border-bottom:1px solid #dee2e6}tr:nth-child(even) td{background:#f8f9fa}
    h2{color:#1a56db}</style></head><body>
    <h2>Payment Report</h2>
    <p>Generated: ${new Date().toLocaleString()} | ${data.length} records</p>
    <table><thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Reference</th><th>Paid At</th><th>Amount</th><th>Slots</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
  win.document.close(); win.print()
}

export default function PaymentReport() {
  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [status,    setStatus]    = useState("")
  const [dateFrom,  setDateFrom]  = useState("")
  const [dateTo,    setDateTo]    = useState("")
  const [summary,   setSummary]   = useState({ total:0, completed:0, refunded:0, failed:0, revenue:0, refundedAmt:0 })
  const [generated, setGenerated] = useState(null)

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = () => {
    setLoading(true)
    axios.get(`${API}/api/payments/admin`, { headers })
      .then(res => {
        const rows = res.data?.payments ?? []
        setPayments(rows)
        setGenerated(new Date().toLocaleString())
        setSummary({
          total:       rows.length,
          completed:   rows.filter(r => r.payment_status === "completed").length,
          refunded:    rows.filter(r => r.payment_status === "refunded").length,
          failed:      rows.filter(r => r.payment_status === "failed").length,
          revenue:     rows.filter(r => r.payment_status === "completed").reduce((s,r) => s+parseFloat(r.amount??0),0),
          refundedAmt: rows.filter(r => r.payment_status === "refunded").reduce((s,r)  => s+parseFloat(r.amount??0),0),
        })
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{ fetchData() },[])

  const filtered = useMemo(() => payments.filter(r => {
    const q = search.toLowerCase()
    const d = r.paid_at?.slice(0,10) ?? ""
    return (
      (!q     || r.user_name?.toLowerCase().includes(q) || r.user_email?.toLowerCase().includes(q) || r.paystack_ref?.toLowerCase().includes(q)) &&
      (!status || r.payment_status === status) &&
      (!dateFrom|| d >= dateFrom) &&
      (!dateTo  || d <= dateTo)
    )
  }), [payments, search, status, dateFrom, dateTo])

  const hasFilter = search||status||dateFrom||dateTo
  const clearAll  = () => { setSearch(""); setStatus(""); setDateFrom(""); setDateTo("") }

  return (
    <div className="col-xxl-12">
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">Payment Report</h4>
          {generated && <small className="text-muted">Generated: {generated}</small>}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        {[
          { label:"Transactions", value:summary.total,               icon:"bi-receipt",                color:"primary"   },
          { label:"Completed",    value:summary.completed,           icon:"bi-check-circle-fill",      color:"success"   },
          { label:"Refunded",     value:summary.refunded,            icon:"bi-arrow-counterclockwise", color:"info"      },
          { label:"Failed",       value:summary.failed,              icon:"bi-x-circle-fill",          color:"danger"    },
          { label:"Revenue",      value:fmtAmt(summary.revenue),     icon:"bi-cash-coin",              color:"warning"   },
          { label:"Refunded Amt", value:fmtAmt(summary.refundedAmt), icon:"bi-cash-stack",             color:"secondary" },
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
        {/* Export buttons */}
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Report Table</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigator.clipboard.writeText(filtered.map(r=>[r.user_name,r.user_email,r.paystack_ref,fmtDate(r.paid_at),fmtAmt(r.amount),r.payment_status].join("\t")).join("\n"))}>
            <i className="bi bi-clipboard me-1"></i>Copy
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={() => exportCSV(filtered,`payments-${Date.now()}.csv`)}>
            <i className="bi bi-filetype-csv me-1"></i>CSV
          </button>
          <button className="btn btn-sm btn-info" onClick={() => printTable(filtered)}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
        </div>

        {/* Filters */}
        <div className="card-body border-bottom pb-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Name, email, reference…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
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
            noDataComponent={<div className="py-5 text-muted text-center"><i className="bi bi-receipt fs-1 d-block mb-2 opacity-25"></i>No payment records match the selected filters</div>}
          />
        </div>
      </div>
    </div>
  )
}