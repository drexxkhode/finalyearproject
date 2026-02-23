import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Navbar from './partials/Navbar';
import Sidebar from './partials/Sidebar';
import Hero from './partials/Hero';
import Dashboard from './pages/Dashboard';
import Footer from './partials/Footer';
import Profile from './pages/Profile';


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
<Route  path='profile' element={<Profile />} />

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
