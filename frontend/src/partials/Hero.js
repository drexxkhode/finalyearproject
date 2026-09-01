import { Link, useLocation, matchPath } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_URL || 'http://localhost:5000';

function Hero() {
  const location = useLocation();
  const [paymentMode, setPaymentMode] = useState('test');
  const [savingMode, setSavingMode] = useState(false);
  const [modeError, setModeError] = useState('');
  const [confirmLive, setConfirmLive] = useState(false);
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('user')); } catch {}
  const canManagePayments = currentUser?.role === 'Super_admin';

  useEffect(() => {
    if (!canManagePayments) return;
    axios.get(`${API}/api/super/payment-mode`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setPaymentMode(data.mode))
      .catch(() => setModeError('Payment mode unavailable'));
  }, [canManagePayments]);

  const switchPaymentMode = async (event) => {
    const mode = event.target.checked ? 'live' : 'test';
    if (mode === 'live') {
      setConfirmLive(true);
      return;
    }
    await savePaymentMode(mode);
  };

  const savePaymentMode = async (mode) => {
    setSavingMode(true); setModeError('');
    try {
      const { data } = await axios.put(`${API}/api/super/payment-mode`, { mode }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setPaymentMode(data.mode);
    } catch (error) {
      setModeError(error.response?.data?.message || 'Could not change payment mode');
    } finally { setSavingMode(false); }
  };

  const routes = [
  { path: '/', name: 'Dashboard' },
  { path: '/slots', name: 'Manage Time Slots' },
  { path: '/profile', name: 'My Profile' },
  { path: '/profile/:id', name: 'User Profile' },
  { path: '/bookings', name: 'Bookings' },
  { path: '/enquiries', name: 'Enquiries' },
  { path: '/users', name: 'Active Users' },
  { path: '/history/bookings', name: 'Booking History' },
  { path: '/history/payments', name: 'Payment History' },
  { path: '/report/payments', name: 'Payment Report' },
  { path: '/report/bookings', name: 'Booking Report' },
  { path: '/register', name: 'Register New User' },
  { path: '/edit-details/:id', name: 'Edit User Details' },
  { path: '/settings', name: 'General Settings' },
  { path: '/reset-password', name: 'Reset Password' },
  { path: '/super/turfs', name: 'All Turfs' },
  { path: '/super/register-turf', name: 'Register Turf' },
  { path: '/super/turf-owners', name: 'Turf Managers' },
  { path: '/super/admins', name: 'Super Admins' },
  { path: '/super/system-users', name: 'App Users' },
  { path: '/super/system-reviews', name: 'System Reviews' },
  { path: '/super/register', name: 'Register New System Administrator' },
  { path: '/super/register-turfowner', name: 'Register New Turf Owner' },
  { path: '/super/edit/:id', name: 'Edit Details' },
];
  const currentRoute = routes.find(route =>
    matchPath({ path: route.path, end: true }, location.pathname)
  );

  const currentPage = currentRoute?.name || '';

  return (
    <div className="app-hero-header d-flex align-items-center">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <i className="bi bi-house lh-1 pe-3 me-3 border-end border-dark"></i>
          <Link to="/" className="text-decoration-none">Home</Link>
        </li>
        <li className="breadcrumb-item text-secondary" aria-current="page">
          {currentPage}
        </li>

      </ol>
      {canManagePayments && <div className="d-flex align-items-center justify-content-end ms-auto gap-2">
        <small className={paymentMode === 'live' ? 'text-danger fw-bold' : 'text-secondary fw-bold'}>
          {savingMode ? 'Saving…' : paymentMode === 'live' ? 'PAYSTACK LIVE' : 'PAYSTACK TEST'}
        </small>
        <div className="form-check form-switch m-0">
          <input className="form-check-input" type="checkbox" role="switch" aria-label="Switch Paystack between test and live mode"
            checked={paymentMode === 'live'} disabled={savingMode} onChange={switchPaymentMode} />
        </div>
        {modeError && <small className="text-danger">{modeError}</small>}
      </div>}
      {confirmLive && <div className="modal d-block" role="dialog" aria-modal="true" style={{ background: 'rgba(0,0,0,.45)', zIndex: 2000 }}>
        <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">Enable live Paystack payments?</h5></div>
          <div className="modal-body">Live mode charges real money. Confirm that your live API keys and webhook are configured.</div>
          <div className="modal-footer"><button className="btn btn-outline-secondary" onClick={() => setConfirmLive(false)}>Cancel</button><button className="btn btn-danger" onClick={async () => { setConfirmLive(false); await savePaymentMode('live'); }}>Enable live mode</button></div>
        </div></div>
      </div>}
    </div>
  );
}

export default Hero;
