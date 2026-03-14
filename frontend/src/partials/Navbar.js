import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

// ── Notification sound (Web Audio API — no file needed) ───────────────────
function playNotifSound(type = "enquiry") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "enquiry") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // AudioContext not supported — fail silently
  }
}

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

function Navbar() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) ?? null;
    } catch {
      return null;
    }
  });

  const [enquiries, setEnquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [unreadEnq, setUnreadEnq] = useState(0);
  const [unreadBk, setUnreadBk] = useState(0);

  const socketRef = useRef(null);
  const idRef = useRef(0); // ← safe booking ID counter (no Date.now() collision)
  const [photoTs] = useState(() => Date.now()); // ← stable timestamp, not re-created on every render

  // ── Sidebar toggle (replaces jQuery) ──────────────────────────────────
  useEffect(() => {
    // Defer by one tick so all sibling components have mounted
    // and .page-wrapper / #overlay are guaranteed to exist in the DOM
    const timer = setTimeout(() => {
      const pageWrapper = document.querySelector(".page-wrapper");
      const sidebar     = document.getElementById("sidebar");
      const toggleBtn   = document.getElementById("toggle-sidebar");
      const pinBtn      = document.getElementById("pin-sidebar");
      const overlay     = document.getElementById("overlay");

      // Guard — if layout elements aren't present yet, bail out
      if (!pageWrapper) return;

      // ── Toggle sidebar open/close (mobile + desktop) ─────────────────
      const handleToggle = () => {
        pageWrapper.classList.toggle("toggled");
      };

      // ── Sidebar hover (only active when pinned) ───────────────────────
      const handleMouseEnter = () =>
        pageWrapper.classList.add("sidebar-hovered");
      const handleMouseLeave = () =>
        pageWrapper.classList.remove("sidebar-hovered");

      // ── Pin sidebar ───────────────────────────────────────────────────
      const handlePin = () => {
        if (pageWrapper.classList.contains("pinned")) {
          pageWrapper.classList.remove("pinned");
          sidebar?.removeEventListener("mouseenter", handleMouseEnter);
          sidebar?.removeEventListener("mouseleave", handleMouseLeave);
        } else {
          pageWrapper.classList.add("pinned");
          sidebar?.addEventListener("mouseenter", handleMouseEnter);
          sidebar?.addEventListener("mouseleave", handleMouseLeave);
        }
      };

      // ── Overlay tap — closes sidebar on mobile ────────────────────────
      const handleOverlay = () => {
        pageWrapper.classList.toggle("toggled");
      };

      // ── Responsive resize ─────────────────────────────────────────────
      const handleResize = () => {
        if (window.innerWidth <= 768) {
          pageWrapper.classList.remove("pinned");
        } else {
          pageWrapper.classList.remove("toggled");
        }
      };

      toggleBtn?.addEventListener("click", handleToggle);
      pinBtn?.addEventListener("click", handlePin);
      overlay?.addEventListener("click", handleOverlay);
      window.addEventListener("resize", handleResize);

      // Run once on mount to set correct initial state for current viewport
      handleResize();

      // ── Cleanup — critical: removes stale listeners on every re-mount ─
      return () => {
        toggleBtn?.removeEventListener("click", handleToggle);
        pinBtn?.removeEventListener("click", handlePin);
        overlay?.removeEventListener("click", handleOverlay);
        window.removeEventListener("resize", handleResize);
        sidebar?.removeEventListener("mouseenter", handleMouseEnter);
        sidebar?.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, 0);

    // Also clean up the timer itself if the component unmounts before it fires
    return () => clearTimeout(timer);
  }, []); // ← Navbar never unmounts in an SPA, so [] is correct here

  // ── Sync user (same-tab photo update + cross-tab) ─────────────────────
  useEffect(() => {
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")) ?? null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncUser);
    window.addEventListener("user:updated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user:updated", syncUser);
    };
  }, []);

  // ── Socket connection ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?.turf_id) return;

    const socket = io(API, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("admin:get-unread"));

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

    // Restore counts + dropdown items on connect / page refresh
    socket.on(
      "admin:unread-counts",
      ({ enquiries, bookings, enquiryItems, bookingItems }) => {
        setUnreadEnq(enquiries);
        setUnreadBk(bookings);
        if (enquiryItems?.length) setEnquiries(enquiryItems);
        if (bookingItems?.length) setBookings(bookingItems);
      }
    );

    socket.on("enquiry:new", ({ enquiry, preview }) => {
      playNotifSound("enquiry");
      setEnquiries((prev) =>
        [
          {
            id: enquiry.id,
            name: enquiry.name,
            preview,
            time: new Date(enquiry.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ].slice(0, 5)
      );
      setUnreadEnq((n) => n + 1);
    });

    socket.on("booking:new", ({ user: userName, slots, amount, date }) => {
      playNotifSound("booking");
      setBookings((prev) =>
        [
          {
            id: ++idRef.current, // ← collision-safe ID
            name: userName,
            slots,
            amount,
            date,
            time: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ].slice(0, 5)
      );
      setUnreadBk((n) => n + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null; // ← clear stale ref
    };
  }, [user?.turf_id]);

  // ── Derived values ─────────────────────────────────────────────────────
  const photoSrc = user?.photo
    ? `${user.photo}?t=${photoTs}` // ← stable timestamp, won't reload on every render
    : "/assets/images/admin/avatar.webp";

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : "Guest";

  // ── Notification bell shared renderer ─────────────────────────────────
  const NotifBadge = ({ count }) =>
    count > 0 ? (
      <span
        className="position-absolute badge rounded-pill bg-danger"
        style={{ fontSize: 9, padding: "2px 5px", top: 10, left: 28 }}
      >
        {count > 9 ? "9+" : count}
      </span>
    ) : null;

  return (
    <div className="app-header d-flex align-items-center">
      {/* ── Sidebar toggle buttons ───────────────────────────────────── */}
      <div className="d-flex">
        <button className="toggle-sidebar" id="toggle-sidebar">
          <i className="bi bi-list lh-1"></i>
        </button>
        <button className="pin-sidebar" id="pin-sidebar">
          <i className="bi bi-list lh-1"></i>
        </button>
      </div>

      {/* ── Brand logo ──────────────────────────────────────────────── */}
      <div className="app-brand py-2 ms-3">
        <Link to="/" className="d-sm-block d-none">
          <img src="/assets/images/logo.svg" className="logo" alt="LOGO" />
        </Link>
        <Link to="/" className="d-sm-none d-block">
          <img src="/assets/images/logo-sm.svg" className="logo" alt="LOGO" />
        </Link>
      </div>

      <div className="header-actions col">
        <div className="d-lg-flex d-none">

          {/* ── Bell — Bookings ──────────────────────────────────────── */}
          <div className="dropdown border-start">
            <button
              className="dropdown-toggle d-flex px-3 py-4 position-relative btn btn-link text-decoration-none border-0 shadow-none"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              onClick={() => setUnreadBk(0)}
            >
              <i className="bi bi-bell fs-4 lh-1 text-secondary"></i>
              <NotifBadge count={unreadBk} />
            </button>
            <div
              className="dropdown-menu dropdown-menu-end shadow-lg"
              style={{ minWidth: 300 }}
            >
              <h5 className="fw-semibold px-3 py-2 text-primary d-flex justify-content-between align-items-center">
                New Bookings
                {unreadBk > 0 && (
                  <span className="badge bg-danger">{unreadBk}</span>
                )}
              </h5>
              {bookings.length === 0 ? (
                <p className="text-muted small text-center py-3 mb-0">
                  No new bookings
                </p>
              ) : (
                bookings.map((b) => (
                  <div className="dropdown-item px-3 py-2" key={b.id}>
                    <div className="d-flex align-items-start gap-2 border-bottom pb-2">
                      <div
                        className="rounded-circle bg-success d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 36, height: 36 }}
                      >
                        <i
                          className="bi bi-calendar-check text-white"
                          style={{ fontSize: 14 }}
                        ></i>
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 13 }}>
                          {b.name}
                        </div>
                        <div className="text-muted small">
                          {b.slots} slot{b.slots > 1 ? "s" : ""} · ₵{b.amount}{" "}
                          · {b.date}
                        </div>
                        <div
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          {b.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="d-grid mx-3 my-2">
                <Link
                  to="/bookings"
                  className="btn btn-outline-primary btn-sm"
                >
                  View all bookings
                </Link>
              </div>
            </div>
          </div>

          {/* ── Envelope — Enquiries ─────────────────────────────────── */}
          <div className="dropdown border-start">
            <button
              className="dropdown-toggle d-flex px-3 py-4 position-relative btn btn-link text-decoration-none border-0 shadow-none"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              onClick={() => setUnreadEnq(0)}
            >
              <i className="bi bi-envelope-open fs-4 lh-1 text-secondary"></i>
              <NotifBadge count={unreadEnq} />
            </button>
            <div
              className="dropdown-menu dropdown-menu-end shadow-lg"
              style={{ minWidth: 300 }}
            >
              <h5 className="fw-semibold px-3 py-2 text-primary d-flex justify-content-between align-items-center">
                Enquiries
                {unreadEnq > 0 && (
                  <span className="badge bg-danger">{unreadEnq}</span>
                )}
              </h5>
              {enquiries.length === 0 ? (
                <p className="text-muted small text-center py-3 mb-0">
                  No new enquiries
                </p>
              ) : (
                enquiries.map((e) => (
                  <div className="dropdown-item px-3 py-2" key={e.id}>
                    <div className="d-flex align-items-start gap-2 border-bottom pb-2">
                      <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 36, height: 36 }}
                      >
                        <span
                          className="fw-bold text-white"
                          style={{ fontSize: 13 }}
                        >
                          {e.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-semibold" style={{ fontSize: 13 }}>
                          {e.name}
                        </div>
                        <div
                          className="text-muted small text-truncate"
                          style={{ maxWidth: 210 }}
                        >
                          {e.preview}
                        </div>
                        <div
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          {e.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="d-grid mx-3 my-2">
                <Link
                  to="/enquiries"
                  className="btn btn-outline-primary btn-sm"
                >
                  View all enquiries
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── User dropdown ────────────────────────────────────────────── */}
        <div className="dropdown ms-2">
          <button
            id="userSettings"
            className="dropdown-toggle d-flex py-2 align-items-center text-decoration-none btn btn-link border-0 shadow-none"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img
              src={photoSrc}
              alt="Admin"
              className="rounded-2 img-3x"
              onError={(e) => {
                e.target.src = "/assets/images/admin/avatar.webp";
              }}
            />
            <span className="ms-2 text-truncate d-lg-block d-none">
              {fullName}
            </span>
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow-lg">
            <div className="header-action-links mx-3 gap-2">
              <Link className="dropdown-item" to="/profile">
                <i className="bi bi-person text-primary"></i> Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                <i className="bi bi-gear text-danger"></i> Settings
              </Link>
            </div>
            <div className="mx-3 mt-2 d-grid">
              <button onClick={logout} className="btn btn-danger btn-sm">
                Logout <i className="bi bi-power"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;