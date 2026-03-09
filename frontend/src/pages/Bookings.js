import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API;

const Bookings = () => {
  const tableRef = useRef(null);
  const [bookings, setBookings] = useState([]);
const formatDateForInput = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";
//time format function
const formatTime = (time) => {
  const date = new Date(`1970-01-01T${time}`);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};
  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/get-bookings`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBookings();
  }, []);

  // Initialize DataTable AFTER data loads
  useEffect(() => {
    if (bookings.length === 0) return;

    const $table = window.$(tableRef.current);

    if (!window.$.fn.DataTable.isDataTable(tableRef.current)) {
      $table.DataTable({
        paging: true,
        searching: true,
      });
    }

    return () => {
      if (window.$.fn.DataTable.isDataTable(tableRef.current)) {
        $table.DataTable().destroy();
      }
    };
  }, [bookings]);

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title">Bookings</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle table-hover m-0" ref={tableRef}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking.id}>
                    <td>{index + 1}</td>
                    <td>{booking.name}</td>
                    <td>{booking.email}</td>
                    <td>{booking.contact}</td>
                    <td>{formatDateForInput(booking.booking_date)}</td>
                    <td>{formatTime(booking.start_time) + "-" + formatTime(booking.end_time)}</td>
                    <td>${booking.amount}</td>
                    <td>pending</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;