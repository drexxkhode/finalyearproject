import { useRef, useEffect } from "react";
const API = process.env.REACT_APP_URL || "http://localhost:5000";
const PaymentHistory = () => {
  const tableRef = useRef(null);

  useEffect(() => {
    const $table = window.$(tableRef.current);

    // Initialize DataTable
    $table.DataTable({
      destroy: true, // avoids re-initialization errors
      paging: true,
      searching: true,
    });

    // Cleanup on unmount
    return () => {
      if (window.$.fn.DataTable.isDataTable(tableRef.current)) {
        $table.DataTable().destroy();
      }
    };
  }, []);

  return (
    <>

      <div className="row gx-3">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-calendar-check fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total Bookings</h5>
                <h3 className="m-0 text-primary">0</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-cash-stack fs-1 text-danger lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Refunded</h5>
                <h3 className="m-0 text-primary">₡ 000.00</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-people fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total</h5>
                <h3 className="m-0 text-primary">0</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-chat fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Completed</h5>
                <h3 className="m-0 text-primary">0</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Row end */}
      <div class="col-xxl-12">
        <div class="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title">Payment History</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table align-middle table-hover m-0" ref={tableRef}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Module</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Severity</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>App crashes</td>
                    <td>Main App</td>
                    <td>Lewis</td>
                    <td>
                      <span class="badge border border-danger text-danger">
                        Open
                      </span>
                    </td>
                    <td>Micheal</td>
                    <td>
                      <span class="badge border border-success text-success">
                        High
                      </span>
                    </td>
                    <td>Aug-10, 2022</td>
                    <td>Sep-14, 2022</td>
                    <td>Oct-20, 2022</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Saving file</td>
                    <td>Form Screen</td>
                    <td>James</td>
                    <td>
                      <span class="badge border border-success text-success">
                        In Progress
                      </span>
                    </td>
                    <td>Donald</td>
                    <td>
                      <span class="badge border border-danger text-danger">
                        Low
                      </span>
                    </td>
                    <td>Aug-10, 2022</td>
                    <td>Sep-14, 2022</td>
                    <td>Oct-20, 2022</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Login fail</td>
                    <td>Main App</td>
                    <td>Powell</td>
                    <td>
                      <span class="badge border border-danger text-danger">
                        Open
                      </span>
                    </td>
                    <td>Glory</td>
                    <td>
                      <span class="badge border border-success text-success">
                        High
                      </span>
                    </td>
                    <td>Aug-10, 2022</td>
                    <td>Sep-14, 2022</td>
                    <td>Oct-20, 2022</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>Saving file</td>
                    <td>Form Screen</td>
                    <td>James</td>
                    <td>
                      <span class="badge border border-success text-success">
                        In Progress
                      </span>
                    </td>
                    <td>Donald</td>
                    <td>
                      <span class="badge border border-danger text-danger">
                        Low
                      </span>
                    </td>
                    <td>Aug-10, 2022</td>
                    <td>Sep-14, 2022</td>
                    <td>Oct-20, 2022</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>Login fail</td>
                    <td>Main App</td>
                    <td>Powell</td>
                    <td>
                      <span class="badge border border-success text-success">
                        In Progress
                      </span>
                    </td>
                    <td>Glory</td>
                    <td>
                      <span class="badge border border-success text-success">
                        High
                      </span>
                    </td>
                    <td>Aug-10, 2022</td>
                    <td>Sep-14, 2022</td>
                    <td>Oct-20, 2022</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default PaymentHistory;
