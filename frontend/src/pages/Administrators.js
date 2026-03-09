import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API || "http://localhost:5000"; 

const Administrators = () => {
  const tableRef = useRef(null);
  const [admins, setAdmins] = useState([]);
  const [dataTableInitialized, setDataTableInitialized] = useState(false);

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/auth/admins",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    // Initialize DataTable only once after admins are loaded
    if (admins.length && !dataTableInitialized) {
      const $table = window.$(tableRef.current);
      $table.DataTable({
        paging: true,
        searching: true,
        dom: "Bfrtip",
        buttons: [
          {
            extend: "copy",
            className: "btn btn-primary btn-sm",
            text: '<i class="bi bi-clipboard"></i> Copy',
          },
          {
            extend: "excel",
            className: "btn btn-success btn-sm",
            text: '<i class="bi bi-file-earmark-excel"></i> Excel',
          },
          {
            extend: "pdf",
            className: "btn btn-danger btn-sm",
            text: '<i class="bi bi-filetype-pdf"></i> PDF',
          },
          {
            extend: "print",
            className: "btn btn-info btn-sm",
            text: '<i class="bi bi-printer"></i> Print',
          },
        ],
      });
      setDataTableInitialized(true);
    }
  }, [admins, dataTableInitialized]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdmins();
    } catch (err) {
      console.error("Failed to delete admin:", err);
    }
  };

  return (
    <div className="col-xxl-12">
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title">Administrators</h5>
          <Link
            className="btn btn-primary btn-sm ms-auto"
            to="/register"
            title="Register New User"
          >
            <i className="bi bi-plus" />
            Add New
          </Link>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table
              className="table align-middle table-hover m-0"
              ref={tableRef}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Photo</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr key={admin.id}>
                    <td>{index + 1}</td>
                     <td>
                      <img
                        src={
                          admin.photo || "/assets/images/admin/avatar.webp"
                        }
                        alt="Admin"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "20%",
                        }}
                      />
                    </td>
                    <td>{`${admin.firstName} ${admin.middleName || ""} ${admin.lastName}`}</td>
                    <td>{admin.email}</td>
                    <td>{admin.contact}</td>
                    <td>{admin.role}</td>
                   
                    <td>

                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="btn btn-sm btn-danger me-2"
                        title="Delete this record"
                      >

                        Del 
                        
                        <i className="bi bi-trash" />
                      </button>

                      <Link
                        to={`/profile/${admin.id}`}
                        className="btn btn-sm btn-primary"
                        title="View Profile"
                      >
                        View

                        <i className="bi bi-arrow-right-circle" />
                      </Link>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admins.length === 0 && <p className="mt-2">No admins found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administrators;
