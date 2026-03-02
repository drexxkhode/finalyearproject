import { useState } from "react";
import { NavLink,useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({}); // track open dropdowns

  // Toggle mobile menu
  const toggleMobileNav = () => {
    setMobileOpen((prev) => !prev);
  };

  // Toggle a specific dropdown
  const toggleDropdown = (index) => {
    setDropdowns((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <header id="header" className={`header fixed-top ${mobileOpen ? "mobile-nav-active" : ""}`}>
      <div className="topbar d-flex align-items-center dark-background">
      </div>

      <div className="branding d-flex align-items-center">
        <div className="container position-relative d-flex align-items-center justify-content-between">
          <a href="index.html" className="logo d-flex align-items-center">
            <img src="assets/img/logo.webp" alt="" />
            <h1 className="sitename">Clinic</h1>
          </a>

          <nav id="navmenu" className="navmenu">
            <ul>
              <li><NavLink to={'/'} className={location.pathname==='/'? "active" : ""} onClick={handleLinkClick}>Home</NavLink></li>
              <li><NavLink to={'/all-turfs'}  className={location.pathname==='/all-turfs'? "active" : ""} onClick={handleLinkClick}>All Turfs</NavLink></li>
              <li><NavLink to="/map" className={location.pathname==='/map'? "active" : ""} onClick={handleLinkClick}>Show Turfs on Map</NavLink></li>
              
              {/* Dropdown example */}
              <li className={`dropdown ${dropdowns[0] ? "active" : ""}`}>
                <a href="#!" onClick={() => toggleDropdown(0)}>
                  <span>More Pages</span> <i className="bi bi-chevron-down toggle-dropdown"></i>
                </a>
                <ul className={`dropdown ${dropdowns[0] ? "dropdown-active" : ""}`}>
                  <li><a href="depNavigatorLoginrtment-detNavigatorLoginils.html" onClick={handleLinkClick}>Department Details</a></li>
                  <li><a href="service-details.html" onClick={handleLinkClick}>Service Details</a></li>
                  <li><a href="appointment.html" onClick={handleLinkClick}>Appointment</a></li>
                  <li><a href="testimonials.html" onClick={handleLinkClick}>Testimonials</a></li>
                  <li><a href="faq.html" onClick={handleLinkClick}>FAQ</a></li>
                  <li><a href="gallery.html" onClick={handleLinkClick}>Gallery</a></li>
                  <li><a href="terms.html" onClick={handleLinkClick}>Terms</a></li>
                  <li><a href="privacy.html" onClick={handleLinkClick}>Privacy</a></li>
                  <li><a href="404.html" onClick={handleLinkClick}>404</a></li>
                </ul>
              </li>

              {/* Second Dropdown */}
              <li className={`dropdown ${dropdowns[1] ? "active" : ""}`}>
                <a href="#!" onClick={() => toggleDropdown(1)}>
                  <span>Dropdown</span> <i className="bi bi-chevron-down toggle-dropdown"></i>
                </a>
                <ul className={`dropdown ${dropdowns[1] ? "dropdown-active" : ""}`}>
                  <li><a href="#">Dropdown 1</a></li>
                  <li className={`dropdown ${dropdowns[2] ? "active" : ""}`}>
                    <a href="#!" onClick={() => toggleDropdown(2)}>
                      <span>Deep Dropdown</span> <i className="bi bi-chevron-down toggle-dropdown"></i>
                    </a>
                    <ul className={`dropdown ${dropdowns[2] ? "dropdown-active" : ""}`}>
                      <li><a href="#">Deep Dropdown 1</a></li>
                      <li><a href="#">Deep Dropdown 2</a></li>
                      <li><a href="#">Deep Dropdown 3</a></li>
                      <li><a href="#">Deep Dropdown 4</a></li>
                      <li><a href="#">Deep Dropdown 5</a></li>
                    </ul>
                  </li>
                  <li><a href="#">Dropdown 2</a></li>
                  <li><a href="#">Dropdown 3</a></li>
                  <li><a href="#">Dropdown 4</a></li>
                </ul>
              </li>

              <li><a href="contact.html" onClick={handleLinkClick}>Contact</a></li>
            </ul>

            {/* Mobile toggle button */}
            <i
              className={`mobile-nav-toggle d-xl-none bi ${mobileOpen ? "bi-x" : "bi-list"}`}
              onClick={toggleMobileNav}
            ></i>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;