import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
const API = process.env.REACT_APP_URL || "http://localhost:5000";

function Sidebar() {
  const location = useLocation();
  const [openTree, setOpenTree] = useState("");
  const [name, setName] = useState("");

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  const isSuperAdmin = user?.role === "Super_admin";

  const getTurfName = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/turf/turf-name`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setName(res?.data?.name || "");
    } catch (err) {
      console.log("Turf name Error", err);
    }
  };

  useEffect(() => {
    // Super Admin has no turf_id — this endpoint would fail for them
    if (!isSuperAdmin) getTurfName();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (location.pathname.startsWith("/history")) setOpenTree("invoices");
    else if (location.pathname.startsWith("/report")) setOpenTree("reports");
    else setOpenTree("");
  }, [location.pathname]);

  const handleToggle = (tree) => {
    setOpenTree((prev) => (prev === tree ? "" : tree));
  };

  return (
    <nav id="sidebar" className="sidebar-wrapper">
      <div className="shop-profile">
        <p className="mb-1 fw-bold text-primary">
          {isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
        </p>
        <p className="m-0">{isSuperAdmin ? "TurfArena Platform" : name}</p>
      </div>

      <div className="sidebarMenuScroll">
        <ul className="sidebar-menu">
          <li className={location.pathname === "/" ? "active current-page" : ""}>
            <NavLink to="/">
              <i className="bi bi-house text-info"></i>
              <span className="menu-text">Dashboard</span>
            </NavLink>
          </li>

          {isSuperAdmin ? (
            <>
              <li className={location.pathname === "/super/turfs" ? "active current-page" : ""}>
                <NavLink to="/super/turfs">
                  <i className="bi bi-geo-alt text-danger"></i>
                  <span className="menu-text">All Turfs</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/super/register-turf" ? "active current-page" : ""}>
                <NavLink to="/super/register-turf">
                  <i className="bi bi-plus-square text-success"></i>
                  <span className="menu-text">Register Turf</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/super/turf-owners" ? "active current-page" : ""}>
                <NavLink to="/super/turf-owners">
                  <i className="bi bi-person-badge text-warning"></i>
                  <span className="menu-text">Turf Managers</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/super/admins" ? "active current-page" : ""}>
                <NavLink to="/super/admins">
                  <i className="bi bi-person-fill-lock text-info"></i>
                  <span className="menu-text">Super Admins</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/super/system-users" ? "active current-page" : ""}>
                <NavLink to="/super/system-users">
                  <i className="bi bi-people text-primary"></i>
                  <span className="menu-text">App Users</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/super/system-reviews" ? "active current-page" : ""}>
                <NavLink to="/super/system-reviews">
                  <i className="bi bi-star text-warning"></i>
                  <span className="menu-text">System Reviews</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li className={location.pathname === "/bookings" ? "active current-page" : ""}>
                <NavLink to="/bookings">
                  <i className="bi bi-journal-check text-dark"></i>
                  <span className="menu-text">Bookings</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/enquiries" ? "active current-page" : ""}>
                <NavLink to="/enquiries">
                  <i className="bi bi-wechat text-success"></i>
                  <span className="menu-text">Enquiries</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/slots" ? "active current-page" : ""}>
                <NavLink to="/slots">
                  <i className="bi bi-calendar-event text-danger"></i>
                  <span className="menu-text">Manage Slots</span>
                </NavLink>
              </li>

              <li className={`treeview ${openTree === "invoices" ? "active current-page open" : ""}`}>
                <a onClick={() => handleToggle("invoices")} style={{ cursor: "pointer" }}>
                  <i className="bi bi-clock-history text-primary"></i>
                  <span className="menu-text">History</span>
                </a>
                <ul className="treeview-menu">
                  <li>
                    <NavLink to="/history/bookings" className={({ isActive }) => (isActive ? "active-sub" : "")}>
                      Bookings History
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/history/payments" className={({ isActive }) => (isActive ? "active-sub" : "")}>
                      Payment History
                    </NavLink>
                  </li>
                </ul>
              </li>

              <li className={`treeview ${openTree === "reports" ? "active current-page open" : ""}`}>
                <a onClick={() => handleToggle("reports")} style={{ cursor: "pointer" }}>
                  <i className="bi bi-bar-chart-line text-warning"></i>
                  <span className="menu-text">Report</span>
                </a>
                <ul className="treeview-menu">
                  <li>
                    <NavLink to="/report/bookings" className={({ isActive }) => (isActive ? "active-sub" : "")}>
                      Booking Report
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/report/payments" className={({ isActive }) => (isActive ? "active-sub" : "")}>
                      Payment Report
                    </NavLink>
                  </li>
                </ul>
              </li>

              <li className={location.pathname === "/users" ? "active current-page" : ""}>
                <NavLink to="/users">
                  <i className="bi bi-person-fill-lock text-info"></i>
                  <span className="menu-text">Users</span>
                </NavLink>
              </li>
              <li className={location.pathname === "/settings" ? "active current-page" : ""}>
                <NavLink to="/settings">
                  <i className="bi bi-gear text-danger"></i>
                  <span className="menu-text">Settings</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;