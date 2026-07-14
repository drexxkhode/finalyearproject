import { useState, useEffect, useMemo } from "react"
import DataTable from "react-data-table-component"
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const API = process.env.REACT_APP_URL || "http://localhost:5000";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—"
const fmtAmt  = (a) => `₵${parseFloat(a??0).toFixed(2)}`

const StatusBadge = ({ s }) => {
  const m = { confirmed:["#198754","Confirmed"], cancelled:["#dc3545","Cancelled"], pending:["#e6a817","Pending"], rejected:["#6c3fa0","Rejected"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}
const PayBadge = ({ s }) => {
  const m = { paid:["#198754","Paid"], refunded:["#0895b3","Refunded"], pending:["#e6a817","Pending"], failed:["#dc3545","Failed"] }
  const [col, label] = m[s] || ["#6c757d", s]
  return <span style={{padding:"2px 10px",borderRadius:4,fontSize:11,background:col+"20",color:col,border:`1px solid ${col}50`,fontWeight:600}}>{label}</span>
}

const getColumns = (deleteBookings, openReject) => [
  { name:"#", width:"55px", cell:(_,i) => i+1 },

  {
    name:"Customer",
    grow:2,
    selector: r => r.name,
    cell: r => (
      <div className="py-1">
        <div className="fw-semibold" style={{fontSize:13}}>
          {r.name || "—"}
        </div>
        <div className="text-muted" style={{fontSize:11}}>
          {r.email}
        </div>
      </div>
    )
  },

  { name:"Contact", cell: r => r.contact || "—" },
  { name:"Date", selector: r => r.booking_date, cell: r => fmtDate(r.booking_date), sortable:true },
  { name:"Time Slot", cell: r => r.slot_label || "—" },
  { name:"Amount", selector: r => r.amount, cell: r => <strong>{fmtAmt(r.amount)}</strong>, sortable:true },
  { name:"Status", cell: r => <StatusBadge s={r.status} /> },
  { name:"Payment", cell: r => <PayBadge s={r.payment_status} /> },
{
    name:"Action",
    cell: r => (
      <div className="d-flex gap-1">
        {r.status === 'confirmed' && (
          <button className="btn btn-outline-danger btn-sm" onClick={() => openReject(r)} title="Reject booking">
            <i className="bi bi-x-circle" />
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => deleteBookings(r.id)} title="Delete record">
          <i className="bi bi-trash" />
        </button>
      </div>
    )
  }
];

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
    axios.get(`${API}/api/admin/all-bookings`, { headers })
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, []);

 const deleteBookings = async (id) => {
  try {
    if (!window.confirm("Delete this booking record?")) return;

    const res = await axios.delete(`${API}/api/admin/delete-booking/${id}`, { headers });

    if (res.status === 200) {
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success(res?.data?.message || "Record deleted");
    } else {
      toast.warning(res?.data?.message || "Unable to delete record");
    }
  } catch (err) {
    console.log("Deleting booking error:", err.response?.data?.message);
    toast.error(err.response?.data?.message ||"Error deleting booking");
  }
};

const [rejectTarget, setRejectTarget] = useState(null)
const [rejecting, setRejecting] = useState(false)

const handleReject = async (reason) => {
  setRejecting(true)
  try {
    const res = await axios.post(
      `${API}/api/admin/reject-booking/${rejectTarget.id}`,
      { reason },
      { headers }
    )
    setBookings(prev => prev.map(b => b.id === rejectTarget.id ? { ...b, status: 'rejected' } : b))
    toast.success(res.data.message)
    setRejectTarget(null)
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to reject booking")
  } finally {
    setRejecting(false)
  }
}

  const filtered = useMemo(() => bookings.filter(r => {
    const q = search.toLowerCase()
    return (
      (!q      || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.slot_label?.toLowerCase().includes(q)) &&
      (!status  || r.status === status) &&
      (!payment || r.payment_status === payment)
    )
  }), [bookings, search, status, payment]);

const columns = useMemo(() => getColumns(deleteBookings, setRejectTarget), [deleteBookings]);
function RejectModal({ booking, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal fade show d-block" tabIndex="-1"
      style={{background:"rgba(0,0,0,0.5)"}} onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reject Booking</h5>
            <button className="btn-close" onClick={onClose} disabled={loading} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-2">
              {booking.name} · {booking.slot_label} · {fmtDate(booking.booking_date)}
            </p>
            <label className="form-label small fw-bold">Reason for rejection</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="e.g. Turf under maintenance, double booking conflict…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            {booking.payment_status === 'paid' && (
              <div className="alert alert-warning py-2 small mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-1"></i>
                A full refund of {fmtAmt(booking.amount)} will be issued automatically.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onConfirm(reason)}
              disabled={loading || !reason.trim()}
            >
              {loading ? <><span className="spinner-border spinner-border-sm me-1"/>Rejecting…</> : "Reject Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};
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
            <option value="rejected">Rejected</option>
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
                No bookings data yet
              </div>
            }

          />
          {rejectTarget && (
  <RejectModal
    booking={rejectTarget}
    onConfirm={handleReject}
    onClose={() => setRejectTarget(null)}
    loading={rejecting}
  />
)}
        </div>
      </div>
      <ToastContainer/>
    </div>
    
  )
}

export default Bookings