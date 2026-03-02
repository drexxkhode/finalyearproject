import { Link, useLocation } from 'react-router-dom';

function Hero() {
  const location = useLocation();

  // Map paths to breadcrumb names
  const breadcrumbMap = {
    '/': 'Dashboard',
    '/events': 'Events Callendar',
    '/profile': 'Profile',
    '/bookings': 'Bookings',
    '/enquiries': 'Enquiries',
    '/administrators': 'Administrators',
    '/history/bookings': 'Booking History',
    '/history/payments': 'Payment History',
    '/report/payments': 'Payment Report',
    '/report/bookings': 'Booking Report',
    '/register': 'Register',
    '/edit-details': 'Edit Details',
    '/settings': 'Settings',
    // add more routes as needed
  };

  // Get the current page name, fallback to empty string
  const currentPage = breadcrumbMap[location.pathname] || '';

  return (
    <div className="app-hero-header d-flex align-items-center">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <i className="bi bi-house lh-1 pe-3 me-3 border-end border-dark"></i>
          <Link to={"/"} className="text-decoration-none">Home</Link>
        </li>
        <li className="breadcrumb-item text-secondary" aria-current="page">
          {currentPage}
        </li>
      </ol>
    </div>
  );
}

export default Hero;