import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import axios from "axios"

const API = process.env_REACT_APP_URL || "http://localhost:5000"
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—"
const fmtAmt  = (a) => `₵${parseFloat(a??0).toFixed(2)}`

const PayBadge = ({ s }) => {
  const m = { completed:["#198754","Completed"], refunded:["#0895b3","Refunded"], pending:["#e6a817","Pending"], failed:["#dc3545","Failed"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}

const columns = [
  { name:"#", width:"55px", cell:(_,i) => i+1 },
  { name:"Customer", grow:2, cell: r => (
    <div className="py-1">
      <div className="fw-semibold" style={{fontSize:13}}>{r.user_name||"—"}</div>
      <div className="text-muted" style={{fontSize:11}}>{r.user_email}</div>
    </div>
  )},
  { name:"Contact",    selector: r => r.user_contact,   cell: r => r.user_contact||"—" },
  { name:"Reference",  selector: r => r.paystack_ref,   cell: r => <code style={{fontSize:10,background:"#f1f3f5",padding:"2px 5px",borderRadius:3}}>{r.paystack_ref}</code> },
  { name:"Paid At",    selector: r => r.paid_at,        cell: r => fmtDate(r.paid_at), sortable:true },
  { name:"Amount",     selector: r => r.amount,         cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Slots",      selector: r => r.slot_count,     cell: r => r.slot_count||0, width:"70px" },
  { name:"Slot Labels",selector: r => r.slot_labels,    cell: r => <span title={r.slot_labels} style={{fontSize:12,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{r.slot_labels||"—"}</span> },
  { name:"Status",     cell: r => <PayBadge s={r.payment_status} /> },
]

const customStyles = {
  headRow:  { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells:{ style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:     { style: { fontSize:13, cursor:"pointer" }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [selected, setSelected] = useState(null)
  const [summary,  setSummary]  = useState({ total:0, completed:0, refunded:0, failed:0, revenue:0, refundedAmt:0 })

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get(`${API}/api/payments/admin`, { headers })
      .then(res => {
        const rows = res.data?.payments ?? []
        setPayments(rows)
        setSummary({
          total:       rows.length,
          completed:   rows.filter(r => r.payment_status === "completed").length,
          refunded:    rows.filter(r => r.payment_status === "refunded").length,
          failed:      rows.filter(r => r.payment_status === "failed").length,
          revenue:     rows.filter(r => r.payment_status === "completed").reduce((s,r) => s+parseFloat(r.amount??0), 0),
          refundedAmt: rows.filter(r => r.payment_status === "refunded").reduce((s,r)  => s+parseFloat(r.amount??0), 0),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => payments.filter(r => {
    const q = search.toLowerCase()
    return (
      (!q     || r.user_name?.toLowerCase().includes(q) || r.user_email?.toLowerCase().includes(q) || r.paystack_ref?.toLowerCase().includes(q)) &&
      (!status || r.payment_status === status)
    )
  }), [payments, search, status])

  return (
    <div className="col-xxl-12">
      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { label:"Transactions", value:summary.total,               icon:"bi-receipt",                color:"primary"   },
          { label:"Completed",    value:summary.completed,           icon:"bi-check-circle-fill",      color:"success"   },
          { label:"Refunded",     value:summary.refunded,            icon:"bi-arrow-counterclockwise", color:"info"      },
          { label:"Failed",       value:summary.failed,              icon:"bi-x-circle-fill",          color:"danger"    },
          { label:"Revenue",      value:fmtAmt(summary.revenue),     icon:"bi-cash-coin",              color:"warning"   },
          { label:"Refunded Amt", value:fmtAmt(summary.refundedAmt), icon:"bi-cash-stack",             color:"secondary" },
        ].map(c => (
          <div className="col-6 col-md-4 col-xl-2" key={c.label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-2 py-3">
                <div className={`rounded-circle bg-${c.color} bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:44,height:44}}>
                  <i className={`bi ${c.icon} text-${c.color} fs-5`}></i>
                </div>
                <div>
                  <div className="fw-bold lh-1">{c.value}</div>
                  <div className="text-muted small">{c.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Payment History</h5>
          <div className="input-group input-group-sm" style={{width:220}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Name, email, reference…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select form-select-sm" style={{width:150}} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          {(search||status) && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => { setSearch(""); setStatus("") }}>
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
            noDataComponent={<div className="py-5 text-muted text-center"><i className="bi bi-receipt fs-1 d-block mb-2 opacity-25"></i>No payment records found</div>}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background:"rgba(0,0,0,0.5)"}} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:480}} onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div style={{background:"linear-gradient(135deg,#1a56db,#0e3fa5)",padding:"18px 24px"}}>
                <h5 className="mb-0 text-white fw-bold">Payment Detail</h5>
                <small className="text-white opacity-75">{fmtDate(selected.paid_at)}</small>
              </div>
              <div className="modal-body px-4 py-3">
                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded" style={{background:"#f8f9fa"}}>
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{width:44,height:44}}>
                    <span className="text-white fw-bold fs-5">{selected.user_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="fw-bold">{selected.user_name}</div>
                    <div className="text-muted small">{selected.user_email}</div>
                    {selected.user_contact && <div className="text-muted small">{selected.user_contact}</div>}
                  </div>
                </div>
                {[
                  { label:"Reference",    value:<code style={{fontSize:12}}>{selected.paystack_ref}</code> },
                  { label:"Amount",       value:<strong>{fmtAmt(selected.amount)}</strong> },
                  { label:"Slots Booked", value:`${selected.slot_count??0} slot${selected.slot_count>1?"s":""}` },
                  { label:"Slot Labels",  value:selected.slot_labels||"—" },
                  { label:"Paid At",      value:fmtDate(selected.paid_at) },
                  { label:"Status",       value:<PayBadge s={selected.payment_status} /> },
                ].map(row => (
                  <div key={row.label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">{row.label}</span>
                    <span className="fw-semibold small text-end" style={{maxWidth:260}}>{row.value}</span>
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