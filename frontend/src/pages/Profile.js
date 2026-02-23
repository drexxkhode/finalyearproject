const Profile = ()=>{
    return (
<>
<div className="container my-5">

  <div className="profile-header mb-4">
  <div className="camera-btn shadow">
    <i className="bi bi-camera-fill text-black" style={{fontSize: '1.5rem'}}  ></i>
  </div>

  <div className="d-flex align-items-center gap-4">
    <img src="https://via.placeholder.com/150" className="profile-img" alt="Profile Image"></img>

    <div>
      <h2 className="fw-bold mb-1">YOUR NAME</h2>
      <p className="mb-2"><i className="bi bi-person-badge"></i> Member ID: MEM20260001</p>
      <span className="badge bg-success rounded-pill px-3">Active</span>
    </div>
  </div>
</div>
  <div className="stats-wrapper">
  <div className="row g-4">
    <div className="col-md-3">
      <div className="card stat-card">
        <div className="stat-icon text-primary">
          <i className="bi bi-calendar-check"></i>
        </div>
        <small className="text-muted">Member Since</small>
        <h6 className="fw-bold mt-2">01 Jan 2024</h6>
      </div>
    </div>

    <div className="col-md-3">
      <div className="card stat-card">
        <div className="stat-icon text-success">
          <i className="bi bi-percent"></i>
        </div>
        <small className="text-muted">Age</small>
        <h6 className="fw-bold mt-2">30 Years</h6>
      </div>
    </div>

    <div className="col-md-3">
      <div className="card stat-card">
        <div className="stat-icon text-danger">
          <i className="bi bi-heart"></i>
        </div>
        <small className="text-muted">Marital Status</small>
        <h6 className="fw-bold mt-2">Single</h6>
      </div>
    </div>

    <div className="col-md-3">
      <div className="card stat-card">
        <div className="stat-icon text-warning">
          <i className="bi bi-briefcase"></i>
        </div>
        <small className="text-muted">Occupation</small>
        <h6 className="fw-bold mt-2">Developer</h6>
      </div>
    </div>
  </div>
</div>
 {/* <!-- PERSONAL INFORMATION -->  */}
   <hr />
  <div className="card info-card p-4">
    <h5 className="fw-bold mb-4">
      <i className="bi bi-person-lines-fill text-primary"></i>
      Personal Information
    </h5>

    <div className="row g-4">
      <div className="col-md-6">
        <div className="info-label">Full Name</div>
        <div className="fw-semibold">Your Name</div>
      </div>

      <div className="col-md-6">
        <div className="info-label">Date of Birth</div>
        <div className="fw-semibold">01 January 1995</div>
      </div>

      <div className="col-md-6">
        <div className="info-label">Gender</div>
        <div className="fw-semibold">Male</div>
      </div>

      <div className="col-md-6">
        <div className="info-label">Email</div>
        <div className="fw-semibold">youremail@example.com</div>
      </div>

      <div className="col-md-6">
        <div className="info-label">Phone</div>
        <div className="fw-semibold">+123 456 7890</div>
      </div>

      <div className="col-md-6">
        <div className="info-label">Address</div>
        <div className="fw-semibold">Your Address Here</div>
      </div>
    </div>
  </div>

</div>


</>
    );
}
export default Profile;