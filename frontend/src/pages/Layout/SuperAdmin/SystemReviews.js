import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import { toast, ToastContainer } from "react-toastify"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000"

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
  : "—"

const Stars = ({ rating }) => (
  <span style={{ color: "#f5bd16", fontSize: 13, whiteSpace: "nowrap" }}>
    {"★".repeat(rating)}{"☆".repeat(5 - rating)}
  </span>
)

const customStyles = {
  headRow:   { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells: { style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:      { style: { fontSize:13, cursor:"pointer" }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

export default function SystemReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/super/get-reviews`, { headers })
      setReviews(Array.isArray(res.data) ? res.data : [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await axios.delete(`${API}/api/super/del-review/${id}`, { headers })
      setReviews(prev => prev.filter(r => r.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success("Review deleted", { position: "top-right", autoClose: 2500 })
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to delete review", { position: "top-right" })
    } finally {
      setDeletingId(null)
    }
  }

  const visible = useMemo(() => reviews.filter(r => {
    const q = search.toLowerCase()
    return !q ||
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
  }), [reviews, search])

  const columns = [
    { name:"#",        width:"55px", cell:(_,i) => i+1 },
    { name:"Reviewer", grow:2, cell: r => (
      <div>
        <div className="fw-semibold" style={{fontSize:13}}>{r.name}</div>
        <div className="text-muted" style={{fontSize:11}}>{r.email}</div>
      </div>
    )},
    { name:"Rating",   width:"120px", cell: r => <Stars rating={r.rating} /> },
    { name:"Comment",  grow:3, cell: r => (
      <span className="text-muted d-block text-truncate" style={{fontSize:12, maxWidth:280}}>
        {r.comment || <em>No comment</em>}
      </span>
    )},
    { name:"Date",     width:"160px", cell: r => <span className="text-muted" style={{fontSize:12}}>{fmtDate(r.created_at)}</span> },
    { name:"Actions",  width:"140px", cell: r => (
      <div className="d-flex gap-1">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={ev => { ev.stopPropagation(); setSelected(r) }}
        >
          View
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={ev => { ev.stopPropagation(); handleDelete(r.id) }}
          disabled={deletingId === r.id}
        >
          {deletingId === r.id
            ? <span className="spinner-border spinner-border-sm" />
            : <i className="bi bi-trash"></i>}
        </button>
      </div>
    )},
  ]

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">System Reviews</h5>

          <div className="input-group input-group-sm" style={{width:210}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Name, email, comment…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {search && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setSearch("")}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm" onClick={fetchReviews}>
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
            onRowClicked={r => setSelected(r)}
            noDataComponent={
              <div className="py-5 text-muted text-center">
                <i className="bi bi-star fs-1 d-block mb-2 opacity-25"></i>
                No reviews found
              </div>
            }
          />
        </div>
      </div>

      {/* View-only modal — no reply */}
      {selected && (
        <div className="modal fade show d-block" tabIndex="-1"
          style={{background:"rgba(0,0,0,0.5)"}} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">
                    <Stars rating={selected.rating} /> <span className="ms-2">{selected.rating}/5</span>
                  </h5>
                  <small className="text-muted">
                    {selected.name} · {selected.email}
                  </small>
                </div>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>

              <div className="modal-body">
                <div className="p-3 rounded" style={{background:"var(--bs-light,#f8f9fa)",lineHeight:1.7}}>
                  <div className="text-muted mb-1" style={{fontSize:11}}>{fmtDate(selected.created_at)}</div>
                  <p className="mb-0" style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                    {selected.comment || <em className="text-muted">No comment left.</em>}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(selected.id)}
                  disabled={deletingId === selected.id}
                >
                  {deletingId === selected.id
                    ? <><span className="spinner-border spinner-border-sm me-1"/>Deleting…</>
                    : <><i className="bi bi-trash me-1"></i>Delete Review</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer/>
    </div>
  )
}