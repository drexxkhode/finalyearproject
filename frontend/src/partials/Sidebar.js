import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";


function Sidebar() {
  const location = useLocation();

  const [openTree, setOpenTree] = useState("");

  // Auto-open the treeview based on route
  useEffect(() => {
    if (location.pathname.startsWith("/history")) {
      setOpenTree("invoices");
    } else if (location.pathname.startsWith("/report")){
      setOpenTree("reports");
    }else{
      setOpenTree("");
    }
  }, [location.pathname]);

  const handleToggle = (tree) => {
    setOpenTree((prev) => (prev === tree ? "" : tree));
  };

  return (
    <nav id="sidebar" className="sidebar-wrapper">
      <div className="shop-profile">
        <p className="mb-1 fw-bold text-primary">Walmart</p>
        <p className="m-0">Los Angeles, California</p>
      </div>

      <div className="sidebarMenuScroll">
        <ul className="sidebar-menu">

          <li className={location.pathname === "/" ? "active current-page" : ""}>
            <NavLink to="/">
              <i className="bi bi-pie-chart"></i>
              <span className="menu-text">Dashboard</span>
            </NavLink>
          </li>

          <li className={location.pathname === "/bookings" ? "active current-page" : ""}>
            <NavLink to="/bookings">
              <i className="bi bi-bar-chart-line"></i>
              <span className="menu-text">Bookings</span>
            </NavLink>
          </li>

          <li className={location.pathname === "/enquiries" ? "active current-page" : ""}>
            <NavLink to="/enquiries">
              <i className="bi bi-calendar2"></i>
              <span className="menu-text">Enquiries</span>
            </NavLink>
          </li>

          <li className={location.pathname === "/events" ? "active current-page" : ""}>
            <NavLink to="/events">
              <i className="bi bi-calendar2"></i>
              <span className="menu-text">Events</span>
            </NavLink>
          </li>

          <li className={`treeview ${openTree === "invoices" ? "active current-page open" : ""}`}>
  <a 
              onClick={() => handleToggle("invoices")}
              style={{ cursor: "pointer" }}>
                <i className="bi bi-window-sidebar"></i>
    <span className="menu-text">Invoices</span>
    
  </a>
  <ul className="treeview-menu">
    <li>
      <NavLink 
        to="/history/bookings"
        className={({ isActive }) => isActive ? "active-sub" : ""}
      >Create Invoice</NavLink>
    </li>
    <li>
      <NavLink 
        to="/history/payments"
        className={({ isActive }) => isActive ? "active-sub" : ""}
      >View Invoice</NavLink>
    </li>
    <li>
      <NavLink 
        to="/history/list"
        className={({ isActive }) => isActive ? "active-sub" : ""}
      >Invoice List</NavLink>
    </li>
  </ul>
</li>
  <li className={`treeview ${openTree === "reports" ? "active current-page open" : ""}`}>
  <a 
              onClick={() => handleToggle("reports")}
              style={{ cursor: "pointer" }}>
                <i className="bi bi-window-sidebar"></i>
    <span className="menu-text">Invoices</span>
    
  </a>
  <ul className="treeview-menu">
    <li>
      <NavLink 
        to="/report/bookings"
        className={({ isActive }) => isActive ? "active-sub" : ""}
      >Booking Report</NavLink>
    </li>
    <li>
      <NavLink 
        to="/report/payments"
        className={({ isActive }) => isActive ? "active-sub" : ""}
      >Payment Report</NavLink>
    </li>
  </ul>
</li>
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;