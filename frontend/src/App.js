
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './partials/Navbar';
import Sidebar from './partials/Sidebar';
import Hero from './partials/Hero';
import Dashboard from './pages/Dashboard';
import Administrators from './pages/Administrators';
import Footer from './partials/Footer';
import Profile from './pages/Profile';
import Enquiries from './pages/Enquires';
import Bookings from './pages/Bookings';
import BookingHistory from './pages/BookingHistory';
import PaymentHistory from './pages/PaymentHistory';
import BookingReport from './pages/BookingReport';
import PaymentReport from './pages/PaymentReport';
import Events from './pages/Events';
import Login from './pages/Login';
import Register from './pages/Register';
import Update from './pages/ViewAdministrator';
import Settings from './pages/Settings';
import ProtectedRoute from './services/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="page-wrapper">
                <Navbar />
                <div className="main-container">
                  <Sidebar />

                  <div className="app-container">
                    <Hero />
                    <div className="app-body">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/enquiries" element={<Enquiries />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/history/bookings" element={<BookingHistory />} />
                        <Route path="/history/payments" element={<PaymentHistory />} />
                        <Route path="/report/bookings" element={<BookingReport />} />
                        <Route path="/report/payments" element={<PaymentReport />} />
                        <Route path="/administrators" element={<Administrators />} />
                        <Route path="/edit-details/:id" element={<Update />} />
                        <Route path='/register' element={<Register />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/profile/:id" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </div>
                    <Footer />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;