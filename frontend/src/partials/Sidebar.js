import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Sidebar() {
  const location = useLocation();

  const [openTree, setOpenTree] = useState("");
  const [name, setName] = useState(""); // ✅ Added state

const getTurfName = async () =>{
  try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/turf/turf-name",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
     // ✅ Correct axios response structure
      setName(res?.data?.name || "");
    } catch (err) {
      console.log("Turf name Error", err);
    }
  };

   // ✅ Fetch turf name on mount
  useEffect(() => {
    getTurfName();
  }, []);


  // Auto-open the treeview based on route
  useEffect(() => {
    if (location.pathname.startsWith("/history")) {
      setOpenTree("invoices");
    } else if (location.pathname.startsWith("/report")) {
      setOpenTree("reports");
    } else {
      setOpenTree("");
    }
  }, [location.pathname]);

  const handleToggle = (tree) => {
    setOpenTree((prev) => (prev === tree ? "" : tree));
  };

  return (
    <nav id="sidebar" className="sidebar-wrapper">
      <div className="shop-profile">
        <p className="mb-1 fw-bold text-primary">Admin Dashboad</p>
        <p className="m-0">{name}</p>
      </div>

      <div className="sidebarMenuScroll">
        <ul className="sidebar-menu">
          <li
            className={location.pathname === "/" ? "active current-page" : ""}
          >
            <NavLink to="/">
              <i className="bi bi-house text-info"></i>
              <span className="menu-text">Dashboard</span>
            </NavLink>
          </li>

          <li
            className={
              location.pathname === "/bookings" ? "active current-page" : ""
            }
          >
            <NavLink to="/bookings">
              <i className="bi bi-journal-check text-dark"></i>
              <span className="menu-text">Bookings</span>
            </NavLink>
          </li>

          <li
            className={
              location.pathname === "/enquiries" ? "active current-page" : ""
            }
          >
            <NavLink to="/enquiries">
              <i className="bi bi-wechat text-success"></i>
              <span className="menu-text">Enquiries</span>
            </NavLink>
          </li>

          <li
            className={
              location.pathname === "/events" ? "active current-page" : ""
            }
          >
            <NavLink to="/events">
              <i className="bi bi-calendar-event text-danger"></i>
              <span className="menu-text">Events</span>
            </NavLink>
          </li>

          <li
            className={`treeview ${openTree === "invoices" ? "active current-page open" : ""}`}
          >
            <a
              onClick={() => handleToggle("invoices")}
              style={{ cursor: "pointer" }}
            >
<i className="bi bi-clock-history text-primary"></i>
              <span className="menu-text">History</span>
            </a>
            <ul className="treeview-menu">
              <li>
                <NavLink
                  to="/history/bookings"
                  className={({ isActive }) => (isActive ? "active-sub" : "")}
                >
                  Bookings History
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/history/payments"
                  className={({ isActive }) => (isActive ? "active-sub" : "")}
                >
                  Payment History
                </NavLink>
              </li>
            </ul>
          </li>
          <li
            className={`treeview ${openTree === "reports" ? "active current-page open" : ""}`}
          >
            <a
              onClick={() => handleToggle("reports")}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-bar-chart-line text-warning"></i>
              <span className="menu-text">Report</span>
            </a>
            <ul className="treeview-menu">
              <li>
                <NavLink
                  to="/report/bookings"
                  className={({ isActive }) => (isActive ? "active-sub" : "")}
                >
                  Booking Report
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/report/payments"
                  className={({ isActive }) => (isActive ? "active-sub" : "")}
                >
                  Payment Report
                </NavLink>
              </li>
            </ul>
          </li>
          <li
            className={
              location.pathname === "/administrators"
                ? "active current-page"
                : ""
            }
          >
            <NavLink to="/administrators">
              <i className="bi bi-person-fill-lock text-info" ></i>
              <span className="menu-text">Administrators</span>
            </NavLink>
          </li>
          <li
            className={
              location.pathname === "/settings"
                ? "active current-page"
                : ""
            }
          >
            <NavLink to="/settings">
              <i className="bi bi-gear text-danger" ></i>
              <span className="menu-text">Settings</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;
