import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Home from "./pages/Home";
import Footer from "./partials/Footer";
import Navbar from "./partials/Navbar";
import Turfs from "./pages/Turfs";
import Map from "./pages/Map";
import ViewTurf from "./pages/ViewTurf";
function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return <div id="preloader" className="preloader"></div>;
  }
  return (
      <BrowserRouter>
    <div className="index-page">
        <Navbar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/all-turfs" element={<Turfs />} />
            <Route path="/map" element={<Map />} />
            <Route path="/view-turf" element={<ViewTurf />} />
          </Routes>
        </main>
        <Footer />
    </div>
      </BrowserRouter>
  );
}
export default App;
