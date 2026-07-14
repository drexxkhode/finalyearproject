import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './partials/Navbar';
import Sidebar from './partials/Sidebar';
import Hero from './partials/Hero';
import Dashboard from './pages/Dashboard';
import Administrators from './pages/Layout/TurfManager/Administrators';
import Footer from './partials/Footer';
import ProfileRouter from './pages/Profile';
import Enquiries from './pages/Layout/TurfManager/Enquires';
import Bookings from './pages/Layout/TurfManager/Bookings';
import BookingHistory from './pages/Layout/TurfManager/BookingHistory';
import PaymentHistory from './pages/Layout/TurfManager/PaymentHistory';
import BookingReport from './pages/Layout/TurfManager/BookingReport';
import PaymentReport from './pages/Layout/TurfManager/PaymentReport';
import Slots from './pages/Layout/TurfManager/Slots';
import Login from './pages/Login';
import Register from './pages/Layout/TurfManager/Register';
import Update from './pages/Layout/TurfManager/ViewAdministrator';
import Settings from './pages/Layout/TurfManager/Settings';
import ForgotPassword from './pages/Layout/TurfManager/ForgotPassword';
import ResetPassword from './pages/Layout/TurfManager/ResetPassword';
import ProtectedRoute from './services/ProtectedRoute';
import SearchBox from './services/Meilisearch';
import { ToastContainer } from 'react-toastify';

// ── Super Admin pages ────────────────────────────────────────────────────
import Turfs from './pages/Layout/SuperAdmin/Turfs';
import TurfOwners from './pages/Layout/SuperAdmin/TurfOwners';
import SuperAdmins from './pages/Layout/SuperAdmin/SuperAdmins';
import SystemUsers from './pages/Layout/SuperAdmin/SystemUsers';
import SystemReviews from './pages/Layout/SuperAdmin/SystemReviews';
import RegisterTurf from './pages/Layout/SuperAdmin/RegisterTurf';
import RegisterSuperAdmin from './pages/Layout/SuperAdmin/RegisterSuperAdmin';
import RegisterTurfOwner from './pages/Layout/SuperAdmin/RegisterTurfOwner';

const MANAGER_ROLES     = ['Manager', 'Staff'];
const SUPER_ADMIN_ROLES = ['Super_admin'];

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword/>} />
        <Route path='/reset-password/:token' element={<ResetPassword/>} />
        <Route path='/search' element={<SearchBox/>} />

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
                        {/* Shared — self-route by role internally */}
                        <Route path="/" element={<Dashboard />} />
                       <Route path="/profile/:id" element={<ProfileRouter />} />
                     <Route path="/profile" element={<ProfileRouter />} />

                        {/* ── Manager / Staff only ── */}
                        <Route path="/enquiries" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Enquiries /></ProtectedRoute>
                        } />
                        <Route path="/bookings" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Bookings /></ProtectedRoute>
                        } />
                        <Route path="/history/bookings" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><BookingHistory /></ProtectedRoute>
                        } />
                        <Route path="/history/payments" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><PaymentHistory /></ProtectedRoute>
                        } />
                        <Route path="/report/bookings" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><BookingReport /></ProtectedRoute>
                        } />
                        <Route path="/report/payments" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><PaymentReport /></ProtectedRoute>
                        } />
                        <Route path="/users" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Administrators /></ProtectedRoute>
                        } />
                        <Route path="/edit-details/:id" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Update /></ProtectedRoute>
                        } />
                        <Route path='/register' element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Register /></ProtectedRoute>
                        } />
                        <Route path="/slots" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Slots /></ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute allowedRoles={MANAGER_ROLES}><Settings /></ProtectedRoute>
                        } />

                        {/* ── Super Admin only ── */}
                        <Route path="/super/turfs" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><Turfs /></ProtectedRoute>
                        } />
                        <Route path="/super/register" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><RegisterSuperAdmin /></ProtectedRoute>
                        } />
                        <Route path="/super/register-turf" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><RegisterTurf /></ProtectedRoute>
                        } />
                        <Route path="/super/register-turfowner" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><RegisterTurfOwner /></ProtectedRoute>
                        } />
                        <Route path="/super/turf-owners" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><TurfOwners /></ProtectedRoute>
                        } />
                        <Route path="/super/admins" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><SuperAdmins /></ProtectedRoute>
                        } />
                        <Route path="/super/system-users" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><SystemUsers /></ProtectedRoute>
                        } />
                        <Route path="/super/system-reviews" element={
                          <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><SystemReviews /></ProtectedRoute>
                        } />
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