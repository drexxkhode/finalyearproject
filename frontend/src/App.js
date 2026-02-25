import { BrowserRouter,Routes,Route } from 'react-router-dom';
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


function App() {
  return (
    <div className='page-wrapper' >
      <BrowserRouter>
      
   <Navbar />
   <div className='main-container' >
    <Sidebar />
   
<div className='app-container' >
  <Hero />
  <div className='app-body' >
    <Routes>
<Route path='/' element={<Dashboard/>}  />
<Route  path='/enquiries' element={<Enquiries />} />
<Route  path='/bookings' element={<Bookings />} />
<Route path="/history/bookings" element={<BookingHistory />} />
<Route path="/history/payments" element={<PaymentHistory />} />
<Route path="/report/bookings" element={<BookingReport />} />
<Route path="/report/payments" element={<PaymentReport />} />
<Route path='/administrators' element={< Administrators/>}  />
<Route  path='/events' element={<Events />} />
<Route  path='/profile' element={<Profile />} />

    </Routes>
  </div>
  <  Footer />
  </div>
</div>

      </BrowserRouter>
    </div>
    
  );
}

export default App;
