import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000"

const STATUS_BADGE = {
  pending:  { cls: "bg-warning text-dark", label: "Pending"  },
  read:     { cls: "bg-info text-white",   label: "Read"     },
  resolved: { cls: "bg-success text-white",label: "Resolved" },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
  : "—"

const customStyles = {
  headRow:   { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells: { style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:      { style: { fontSize:13, cursor:"pointer" }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [reply,     setReply]     = useState("")
  const [sending,   setSending]   = useState(false)
  const [filter,    setFilter]    = useState("all")
  const [search,    setSearch]    = useState("")

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchEnquiries = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/enquiries/admin`, { headers })
      setEnquiries(res.data.enquiries ?? [])
    } catch {
      setEnquiries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEnquiries() }, [])

  const openModal = async (enq) => {
    setSelected(enq)
    setReply(enq.reply ?? "")
    if (enq.status === "pending") {
      try {
        await axios.patch(`${API}/api/enquiries/${enq.id}/read`, {}, { headers })
        setEnquiries(prev => prev.map(e => e.id === enq.id ? { ...e, status:"read" } : e))
      } catch {}
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await axios.post(`${API}/api/enquiries/${selected.id}/reply`, { reply: reply.trim() }, { headers })
      const updated = { ...selected, reply: reply.trim(), status:"resolved", replied_at: new Date() }
      setEnquiries(prev => prev.map(e => e.id === selected.id ? updated : e))
      setSelected(updated)
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  const counts = {
    all:      enquiries.length,
    pending:  enquiries.filter(e => e.status === "pending").length,
    resolved: enquiries.filter(e => e.status === "resolved").length,
  }

  const visible = useMemo(() => enquiries.filter(e => {
    const matchStatus = filter === "all" || e.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q) || e.message?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  }), [enquiries, filter, search])

  const columns = [
    { name:"#",        width:"55px", cell:(_,i) => i+1 },
    { name:"From",     grow:2, cell: e => (
      <div className="d-flex align-items-center gap-2 py-1">
        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{width:32,height:32}}>
          <span className="text-white fw-bold" style={{fontSize:12}}>{e.name?.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div style={{fontSize:13}} className={e.status==="pending"?"fw-semibold":""}>{e.name}</div>
          <div className="text-muted" style={{fontSize:11}}>{e.email}</div>
        </div>
      </div>
    )},
    { name:"Subject",  grow:2, cell: e => (
      <div style={{fontSize:13}} className={e.status==="pending"?"fw-semibold":""}>
        {e.subject || "General Enquiry"}
        {e.status === "pending" && <span className="ms-2 badge bg-danger" style={{fontSize:9}}>New</span>}
      </div>
    )},
    { name:"Message",  grow:3, cell: e => (
      <span className="text-muted d-block text-truncate" style={{fontSize:12, maxWidth:250}}>
        {e.message}
      </span>
    )},
    { name:"Status",   width:"110px", cell: e => (
      <span className={`badge ${STATUS_BADGE[e.status]?.cls ?? "bg-secondary"}`}>
        {STATUS_BADGE[e.status]?.label ?? e.status}
      </span>
    )},
    { name:"Received", width:"160px", cell: e => <span className="text-muted" style={{fontSize:12}}>{fmtDate(e.created_at)}</span> },
    { name:"",         width:"80px",  cell: e => (
      <button className="btn btn-sm btn-outline-primary" onClick={ev => { ev.stopPropagation(); openModal(e) }}>
        {e.reply ? "View" : "Reply"}
      </button>
    )},
  ]

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">Enquiries</h5>

          <div className="btn-group btn-group-sm">
            {["all","pending","resolved"].map(f => (
              <button key={f}
                className={`btn ${filter===f ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase()+f.slice(1)}
                <span className={`ms-1 badge rounded-pill ${filter===f ? "bg-white text-primary" : "bg-primary text-white"}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="input-group input-group-sm" style={{width:210}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {search && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setSearch("")}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm" onClick={fetchEnquiries}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={visible}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10,25,50]}
            highlightOnHover
            pointerOnHover
            customStyles={customStyles}
            onRowClicked={openModal}
            noDataComponent={
              <div className="py-5 text-muted text-center">
                <i className="bi bi-envelope fs-1 d-block mb-2 opacity-25"></i>
                No enquiries found
              </div>
            }
          />
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal fade show d-block" tabIndex="-1"
          style={{background:"rgba(0,0,0,0.5)"}} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">{selected.subject || "General Enquiry"}</h5>
                  <small className="text-muted">
                    from {selected.name} · {selected.email}
                    {selected.phone ? ` · ${selected.phone}` : ""}
                  </small>
                </div>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>

              <div className="modal-body">
                <div className="p-3 rounded mb-3" style={{background:"var(--bs-light,#f8f9fa)",lineHeight:1.7}}>
                  <div className="text-muted mb-1" style={{fontSize:11}}>{fmtDate(selected.created_at)}</div>
                  <p className="mb-0" style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{selected.message}</p>
                </div>

                {selected.reply && (
                  <div className="p-3 rounded mb-3 border-start border-primary border-3" style={{background:"#f0f4ff"}}>
                    <div className="fw-semibold text-primary mb-1" style={{fontSize:12}}>
                      🏟️ Your reply · {fmtDate(selected.replied_at)}
                    </div>
                    <p className="mb-0 small" style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{selected.reply}</p>
                  </div>
                )}

                <label className="form-label fw-semibold">{selected.reply ? "Update reply" : "Write a reply"}</label>
                <textarea className="form-control" rows={4}
                  placeholder="Type your reply to the customer…"
                  value={reply} onChange={e => setReply(e.target.value)} />
              </div>

              <div className="modal-footer">
                <span className={`badge me-auto ${STATUS_BADGE[selected.status]?.cls}`}>
                  {STATUS_BADGE[selected.status]?.label}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={!reply.trim()||sending}>
                  {sending
                    ? <><span className="spinner-border spinner-border-sm me-1"/>Sending…</>
                    : selected.reply ? "Update Reply" : "Send Reply"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}