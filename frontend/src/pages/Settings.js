import { Link } from "react-router-dom";
const Settings = () => {
  return (
    <>
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="custom-tabs-container">
                <ul className="nav nav-tabs" id="customTab2" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a
                      className="nav-link active"
                      id="tab-oneA"
                      data-bs-toggle="tab"
                      href="#oneA"
                      role="tab"
                      aria-controls="oneA"
                      aria-selected="true"
                    >
                      General
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a
                      className="nav-link"
                      id="tab-twoA"
                      data-bs-toggle="tab"
                      href="#twoA"
                      role="tab"
                      aria-controls="twoA"
                      aria-selected="false"
                    >
                      Settings
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a
                      className="nav-link"
                      id="tab-threeA"
                      data-bs-toggle="tab"
                      href="#threeA"
                      role="tab"
                      aria-controls="threeA"
                      aria-selected="false"
                    >
                      Turf Photos
                    </a>
                  </li>
                </ul>
                <div className="tab-content">
                  <div
                    className="tab-pane fade show active"
                    id="oneA"
                    role="tabpanel"
                  >
                    <div className="row gx-3 justify-content-between">
                      <div className="col-sm-8 col-12">
                        <div className="card mb-3">
                          <div className="card-header">
                            <h5 className="card-title">Personal Details</h5>
                          </div>
                          <div className="card-body">
                            <div className="row gx-3">
                              <div className="col-6">
                                <div className="mb-3">
                                  <label for="fullName" className="form-label">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="fullName"
                                    placeholder="Full Name"
                                  />
                                </div>

                                <div className="mb-3">
                                  <label
                                    for="contactNumber"
                                    className="form-label"
                                  >
                                    Contact
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="contactNumber"
                                    placeholder="Contact"
                                  />
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="mb-3">
                                  <label for="emailId" className="form-label">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    className="form-control"
                                    id="emailId"
                                    placeholder="Email ID"
                                    value="info@email.com"
                                  />
                                </div>

                                <div className="mb-3">
                                  <label for="birthDay" className="form-label">
                                    Birthday
                                  </label>
                                  <div className="input-group">
                                    <input
                                      type="text"
                                      className="form-control datepicker-opens-left"
                                      id="birthDay"
                                      placeholder="DD/MM/YYYY"
                                    />
                                    <span className="input-group-text">
                                      <i className="bi bi-calendar4"></i>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="mb-3">
                                  <label className="form-label">About</label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                  ></textarea>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-4 col-12">
                        <div className="card mb-3">
                          <div className="card-header">
                            <h5 className="card-title">Reset Password</h5>
                          </div>
                          <div className="card-body">
                            <div className="row gx-3">
                              <div className="col-12">
                                <div className="mb-3">
                                  <label
                                    for="currentPassword"
                                    className="form-label"
                                  >
                                    Current Password
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="currentPassword"
                                    placeholder="Enter Current Password"
                                  />
                                </div>

                                <div className="mb-3">
                                  <label
                                    for="newPassword"
                                    className="form-label"
                                  >
                                    New Password
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="newPassword"
                                    placeholder="Enter New Password"
                                  />
                                </div>

                                <div className="mb-3">
                                  <label
                                    for="confirmNewPassword"
                                    className="form-label"
                                  >
                                    Confirm New Password
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="confirmNewPassword"
                                    placeholder="Confirm New Password"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                      >
                        Reset
                      </button>
                      <button type="button" className="btn btn-success">
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="twoA" role="tabpanel">
                    <div className="row gx-3">
                      <div className="col-sm-6 col-12">
                        <div className="card">
                          <div className="card-body">
                            <ul className="list-group">
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show desktop notifications
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchOne"
                                  />
                                </div>
                              </li>
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show email notifications
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchTwo"
                                    checked
                                  />
                                </div>
                              </li>
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show chat notifications
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchThree"
                                  />
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="card">
                          <div className="card-body">
                            <ul className="list-group">
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show purchase history
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchFour"
                                  />
                                </div>
                              </li>
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show orders
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchFive"
                                  />
                                </div>
                              </li>
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Show alerts
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="switchSix"
                                  />
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                      >
                        Cancel
                      </button>
                      <button type="button" className="btn btn-success">
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="tab-pane fade" id="threeA" role="tabpanel">
                    <div className="row gx-3">
                      <div className="col-12">
                        <div class="card mb-3">
                          <div class="card-header">
                            <h5 class="card-title">Gallery</h5>
                          </div>
                          <div class="card-body">
                            <div class="row g-1 row-cols-3">
                              <div className="col-3">
                                <div className="dropdown ms-2">
                                  <a
                                    id="userSettings"
                                    className="dropdown-toggle d-flex py-2 align-items-center text-decoration-none"
                                    href="#!"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <img
                                      src="assets/images/user.png"
                                      class="img-fluid rounded-2"
                                      alt="Bootstrap Themes"
                                    />
                                  </a>
                                  <div className="dropdown-menu dropdown-menu-end shadow-lg">
                                    <div className="header-action-links mx-3 gap-2">
                                      <input
                                        type="file"
                                        className="form-control col-1"
                                      />
                                    </div>
                                    <div className="mx-3 mt-2 d-grid">
                                      <input
                                        className="form-control col-1"
                                        value={"uid"}
                                        type="hidden"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div class="col-3">
                                <img
                                  src="assets/images/user2.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Dashboard"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user1.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user3.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user4.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Dashboards"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user5.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Themes"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user1.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Dashboards"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user3.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Themes"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user2.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin Themes"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                      >
                        Cancel
                      </button>
                      <button type="button" className="btn btn-success">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Settings;
