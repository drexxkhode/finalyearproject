import { Link, useLocation, matchPath } from 'react-router-dom';

function Hero() {
  const location = useLocation();

  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/events', name: 'Events Calendar' },
    { path: '/profile', name: 'My Profile' },
    { path: '/profile/:id', name: 'User Profile' },
    { path: '/bookings', name: 'Bookings' },
    { path: '/enquiries', name: 'Enquiries' },
    { path: '/administrators', name: 'Administrators' },
    { path: '/history/bookings', name: 'Booking History' },
    { path: '/history/payments', name: 'Payment History' },
    { path: '/report/payments', name: 'Payment Report' },
    { path: '/report/bookings', name: 'Booking Report' },
    { path: '/register', name: 'Register' },
    { path: '/edit-details/:id', name: 'Edit Details' },
    { path: '/settings', name: 'Settings' },
    { path: '/reset-password', name: 'Reset Password' },
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
    </div>
  );
}

export default Hero;