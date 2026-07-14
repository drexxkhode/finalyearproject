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

const SystemUsers = () => {
  const [users,  setUsers]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const navigate = useNavigate()

  const token   = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchUsers = () => {
    setLoading(true)
    axios.get(`${API}/api/users/all-users`, { headers })
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return
    try {
      await axios.delete(`${API}/api/users/del-user/${id}`, { headers })
      fetchUsers()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const columns = [
    { name:"#",         width:"55px", cell:(_,i) => i+1 },
    { name:"Photo",     width:"70px", cell: r => (
      <img
        src={r.photo || "/assets/images/admin/avatar.webp"}
        onError={e => e.target.src="/assets/images/admin/avatar.webp"}
        style={{width:40,height:40,borderRadius:"20%",objectFit:"cover"}}
      />
    )},
    { name:"Full Name", grow:2, selector: r => `${r.name}`.trim(),
      cell: r => (
        <div>
          <div className="fw-semibold" style={{fontSize:13}}>{`${r.name} `.trim()}</div>
          <div className="text-muted" style={{fontSize:11}}>{r.email}</div>
        </div>
      )
    },
    { name:"Contact",   selector: r => r.contact, cell: r => r.contact||"—" },
    {
  name: "Account Verified",
  selector: (r) => r.email_verified,
  cell: (r) => {
    const active = r.email_verified === 1;

    return (
      <span
        className={`badge ${
          active
            ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
            : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"
        } fw-normal`}
        style={{ fontSize: 11 }}
      >
        {active ? "Verified" : "Not Verified"}
      </span>
    );
  },
},
    { name:"Actions",   width:"160px", cell: r => (
      <div className="d-flex gap-1">
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>
          <i className="bi bi-trash"></i>
        </button>
      </div>
    )},
  ]

  const filtered = useMemo(() => users.filter(r => {
    const q = search.toLowerCase()
    const name = `${r.name} `.toLowerCase()
    return !q || name.includes(q) || r.email?.toLowerCase().includes(q) 
  }), [users, search])

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2">
          <h5 className="card-title mb-0 me-auto"> System Users</h5>

          <div className="input-group input-group-sm" style={{width:210}}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Name, email….."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {search && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setSearch("")}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers}>
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
            paginationRowsPerPageOptions={[10,25,50]}
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="py-5 text-muted text-center">
                <i className="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                No User found
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default SystemUsers;