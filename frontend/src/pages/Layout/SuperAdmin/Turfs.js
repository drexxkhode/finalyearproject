import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const customStyles = {
  headRow:   { style: { background:"#1a56db", borderRadius:"4px 4px 0 0" } },
  headCells: { style: { color:"white", fontWeight:600, fontSize:13 } },
  rows:      { style: { fontSize:13 }, highlightOnHoverStyle: { background:"#f0f4ff", borderBottomColor:"#e0e7ff" } },
}

const AllTurfs = () => {
  const [turfs,  setTurfs]  = useState([]);
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const navigate = useNavigate()

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchAllTurfs = () => {
    setLoading(true)
    axios.get(`${API}/api/turf/all-turfs`, { headers })
      .then(res => setTurfs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTurfs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAllTurfs() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this turf?")) return
    try {
      await axios.delete(`${API}/api/turf/delete-turf/${id}`, { headers })
      fetchAllTurfs()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const columns = [
    { name:"#",         width:"55px", cell:(_,i) => i+1 },
    { name:"Turf Name", grow:2, selector: r => `${r.name} `.trim(),
      cell: r => (
        <div>
          <div className="fw-semibold" style={{fontSize:13}}>{`${r.name} `.trim()}</div>
          <div className="text-muted" style={{fontSize:11}}>{r.email}</div>
        </div>
      )
    },
    { name:"Location",   selector: r => r.location, cell: r => r.location||"—" },
    { name:"Municipal",      selector: r => r.district,    cell: r => (
      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-normal" style={{fontSize:11}}>
        {r.district}
      </span>
    )},
    { name:"Actions",   width:"160px", cell: r => (
      <div className="d-flex gap-1">
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>
          <i className="bi bi-trash"></i>
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/profile/${r.id}`)}>
          View <i className="bi bi-arrow-right-circle"></i>
        </button>
      </div>
    )},
  ]

  const filtered = useMemo(() => turfs.filter(r => {
    const q = search.toLowerCase()
    const name = `${r.name} `.toLowerCase()
    return !q || name.includes(q) || r.location?.toLowerCase().includes(q) || r.district?.toLowerCase().includes(q)
  }), [turfs, search])

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto">All Turfs</h5>

          <div className="input-group input-group-sm" style={{width:210}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Turf name, location, Municipal…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {search && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setSearch("")}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAllTurfs}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>

          <Link className="btn btn-primary btn-sm" to="/register">
            <i className="bi bi-plus"></i> Add New
          </Link>
        </div>

        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={filtered}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10,25,50]}
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="py-5 text-muted text-center">
                <i className="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                No turf found
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default AllTurfs;