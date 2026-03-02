import Analytics from '../components/Analytics';

const Dashboard = () => {

  return (
    <>
      <div className="row gx-3">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-bar-chart fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Sales</h5>
                <h3 className="m-0 text-primary">3500</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-bag-check fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Orders</h5>
                <h3 className="m-0 text-primary">2900</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="arrow-label">+18%</div>
              <div className="mb-2">
                <i className="bi bi-box-seam fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Items</h5>
                <h3 className="m-0 text-primary">6500</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="arrow-label">+24%</div>
              <div className="mb-2">
                <i className="bi bi-bell fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Signups</h5>
                <h3 className="m-0 text-primary">7200</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Row end */}

      {/* Row start */}
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title">Statistics</h5>
            </div>
            <div className="card-body">
              {/* Visitors & Sales Charts */}
              <div className="row gx-3 mb-3">
                <div className="col-lg-12 col-sm-12 mb-3">
                  <h6 className="text-center mb-3">Overview</h6>
                <Analytics />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
