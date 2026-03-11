import { useRef, useEffect, useState } from "react";
const API = process.env.REACT_APP_URL || "http://localhost:5000";

const SAMPLE_DATA = [
  { id: 1, title: "App crashes",  module: "Main App",     reporter: "Lewis",  status: "Open",        owner: "Michael", severity: "High", created: "Aug-10, 2022", updated: "Sep-14, 2022", due: "Oct-20, 2022" },
  { id: 2, title: "Saving file",  module: "Form Screen",  reporter: "James",  status: "In Progress", owner: "Donald",  severity: "Low",  created: "Aug-10, 2022", updated: "Sep-14, 2022", due: "Oct-20, 2022" },
  { id: 3, title: "Login fail",   module: "Main App",     reporter: "Powell", status: "Open",        owner: "Glory",   severity: "High", created: "Aug-10, 2022", updated: "Sep-14, 2022", due: "Oct-20, 2022" },
  { id: 4, title: "Saving file",  module: "Form Screen",  reporter: "James",  status: "In Progress", owner: "Donald",  severity: "Low",  created: "Aug-10, 2022", updated: "Sep-14, 2022", due: "Oct-20, 2022" },
  { id: 5, title: "Login fail",   module: "Main App",     reporter: "Powell", status: "In Progress", owner: "Glory",   severity: "High", created: "Aug-10, 2022", updated: "Sep-14, 2022", due: "Oct-20, 2022" },
  { id: 6, title: "Payment fail", module: "Checkout",     reporter: "Sarah",  status: "Resolved",    owner: "Kevin",   severity: "High", created: "Sep-01, 2022", updated: "Sep-10, 2022", due: "Sep-15, 2022" },
  { id: 7, title: "Timeout",      module: "API Gateway",  reporter: "Tom",    status: "Open",        owner: "Nina",    severity: "Low",  created: "Sep-05, 2022", updated: "Sep-12, 2022", due: "Oct-01, 2022" },
]

const statusBadge = (status) => {
  const map = {
    "Open":        "border border-danger text-danger",
    "In Progress": "border border-warning text-warning",
    "Resolved":    "border border-success text-success",
  }
  return <span className={`badge ${map[status] || "border border-secondary text-secondary"}`}>{status}</span>
}

const severityBadge = (severity) => {
  const map = {
    "High":   "border border-danger text-danger",
    "Medium": "border border-warning text-warning",
    "Low":    "border border-success text-success",
  }
  return <span className={`badge ${map[severity] || "border border-secondary text-secondary"}`}>{severity}</span>
}

const unique = (arr, key) => [...new Set(arr.map(i => i[key]))].sort()

const PaymentReport = () => {
  const tableRef = useRef(null)
  const dtRef = useRef(null)

  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [severity, setSeverity] = useState("")
  const [module,   setModule]   = useState("")
  const [owner,    setOwner]    = useState("")

  const filtered = SAMPLE_DATA.filter(row => {
    const q = search.toLowerCase()
    const matchSearch = !q || [row.title, row.module, row.reporter, row.owner].some(v => v.toLowerCase().includes(q))
    return (
      matchSearch &&
      (!status   || row.status   === status)   &&
      (!severity || row.severity === severity) &&
      (!module   || row.module   === module)   &&
      (!owner    || row.owner    === owner)
    )
  })

  // Initialize / reinit DataTable when filtered rows change
  useEffect(() => {
    const $table = window.$(tableRef.current)

    if (window.$.fn.DataTable.isDataTable(tableRef.current)) {
      $table.DataTable().destroy()
    }

    dtRef.current = $table.DataTable({
      destroy: true,
      paging: true,
      searching: false,   // we handle search ourselves
      info: true,
      dom: 'Bfrtip',
      buttons: [
        { extend: 'copy',  className: 'btn btn-primary btn-sm',  text: '<i class="bi bi-clipboard"></i> Copy'  },
        { extend: 'excel', className: 'btn btn-success btn-sm',  text: '<i class="bi bi-file-earmark-excel"></i> Excel' },
        { extend: 'pdf',   className: 'btn btn-danger btn-sm',   text: '<i class="bi bi-filetype-pdf"></i> PDF' },
        { extend: 'print', className: 'btn btn-info btn-sm',     text: '<i class="bi bi-printer"></i> Print' },
      ],
    })

    return () => {
      if (window.$.fn.DataTable.isDataTable(tableRef.current)) {
        $table.DataTable().destroy()
      }
    }
  }, [filtered.length, search, status, severity, module, owner])

  const clearFilters = () => {
    setSearch(""); setStatus(""); setSeverity(""); setModule(""); setOwner("")
  }

  const hasFilters = search || status || severity || module || owner

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">

        {/* Card Header */}
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="card-title mb-0">Payment History</h5>
         
        </div>

        {/* Filter Bar */}
        <div className="card-body pb-0">
          <div className="row g-2 align-items-end mb-3">

            {/* Search */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-muted mb-1">Search</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Title, module, owner…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Status</label>
              <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {unique(SAMPLE_DATA, "status").map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Severity */}
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Severity</label>
              <select className="form-select form-select-sm" value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="">All Severities</option>
                {unique(SAMPLE_DATA, "severity").map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Module */}
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Module</label>
              <select className="form-select form-select-sm" value={module} onChange={e => setModule(e.target.value)}>
                <option value="">All Modules</option>
                {unique(SAMPLE_DATA, "module").map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Owner */}
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Owner</label>
              <select className="form-select form-select-sm" value={owner} onChange={e => setOwner(e.target.value)}>
                <option value="">All Owners</option>
                {unique(SAMPLE_DATA, "owner").map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Clear */}
            <div className="col-12 col-md-1 d-flex align-items-end">
              {hasFilters && (
                <button className="btn btn-outline-secondary btn-sm w-100" onClick={clearFilters}>
                  <i className="bi bi-x-lg me-1"></i>Clear
                </button>
              )}
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="d-flex flex-wrap gap-1 mb-3">
              {search   && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">Search: "{search}" <button className="btn-close btn-close-sm ms-1" style={{fontSize:"0.5rem"}} onClick={() => setSearch("")}></button></span>}
              {status   && <span className="badge bg-secondary bg-opacity-10 text-secondary border">{status} <button className="btn-close btn-close-sm ms-1" style={{fontSize:"0.5rem"}} onClick={() => setStatus("")}></button></span>}
              {severity && <span className="badge bg-secondary bg-opacity-10 text-secondary border">{severity} <button className="btn-close btn-close-sm ms-1" style={{fontSize:"0.5rem"}} onClick={() => setSeverity("")}></button></span>}
              {module   && <span className="badge bg-secondary bg-opacity-10 text-secondary border">{module} <button className="btn-close btn-close-sm ms-1" style={{fontSize:"0.5rem"}} onClick={() => setModule("")}></button></span>}
              {owner    && <span className="badge bg-secondary bg-opacity-10 text-secondary border">{owner} <button className="btn-close btn-close-sm ms-1" style={{fontSize:"0.5rem"}} onClick={() => setOwner("")}></button></span>}
              <span className="badge bg-light text-muted border">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card-body pt-0">
          <div className="table-responsive">
            <table className="table align-middle table-hover m-0" ref={tableRef}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Severity</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-4 d-block mb-1"></i>
                      No records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map(row => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.title}</td>
                      <td>{row.module}</td>
                      <td>{row.reporter}</td>
                      <td>{statusBadge(row.status)}</td>
                      <td>{row.owner}</td>
                      <td>{severityBadge(row.severity)}</td>
                      <td>{row.created}</td>
                      <td>{row.updated}</td>
                      <td>{row.due}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PaymentReport