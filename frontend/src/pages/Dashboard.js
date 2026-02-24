import Chart from "react-apexcharts";

const Dashboard=()=>{

	  // ----- Visitors Chart -----
  const visitorSeries = [
    {
      name: "Visitors",
      data: [30, 40, 35, 50, 49, 60, 70], // example data
    },
  ];
  const visitorOptions = {
    chart: {
      id: "visitors-chart",
      toolbar: { show: false },
    },
    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    stroke: { curve: "smooth" },
    colors: ["#FF4560"],
  };

  // ----- Sales Chart -----
  const salesSeries = [
    {
      name: "Sales",
      data: [10, 20, 15, 25, 20, 30, 40], // example data
    },
  ];
  const salesOptions = {
    chart: {
      id: "sales-chart",
      toolbar: { show: false },
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    },
    stroke: { curve: "smooth" },
    colors: ["#008FFB"],
  };

  // ----- Tasks Chart (Pie example) -----
  const tasksSeries = [7, 9, 12]; // Ongoing, Pending, Completed
  const tasksOptions = {
    chart: { type: "donut" },
    labels: ["Ongoing", "Pending", "Completed"],
    colors: ["#FFC107", "#008FFB", "#FF4560"],
    legend: { position: "bottom" },
  };

  // ----- Income Chart (Bar example) -----
  const incomeSeries = [
    {
      name: "Income",
      data: [1600, 1200], // Income, Expenses
    },
  ];
  const incomeOptions = {
    chart: { id: "income-chart", toolbar: { show: false } },
    xaxis: {
      categories: ["Income", "Expenses"],
    },
    colors: ["#00E396", "#FF4560"],
    plotOptions: {
      bar: { borderRadius: 4 },
    },
  };


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
										<h5 className="card-title">Overview</h5>
										<button className="btn btn-outline-primary btn-sm ms-auto">
											Download
										</button>
									</div>
									<div className="card-body">
										
										 {/* Visitors & Sales Charts */}
      <div className="row gx-3 mb-3">
        <div className="col-lg-5 col-sm-12 mb-3">
          <h6 className="text-center mb-3">Visitors</h6>
          <Chart
            options={visitorOptions}
            series={visitorSeries}
            type="line"
            height={250}
          />
        </div>
		<div className="col-lg-2 col-sm-12 mb-3">
          <div className="border px-2 py-4 rounded-5 h-100 text-center">
            <h6 className="mt-3 mb-5">Monthly Average</h6>
            <div className="mb-5">
              <h2 className="text-primary">9600</h2>
              <h6 className="text-secondary fw-light">Visitors</h6>
            </div>
            <div className="mb-4">
              <h2 className="text-danger">$450<sup>k</sup></h2>
              <h6 className="text-secondary fw-light">Sales</h6>
            </div>
          </div>
        </div>
        <div className="col-lg-5 col-sm-12 mb-3">
          <h6 className="text-center mb-3">Sales</h6>
          <Chart
            options={salesOptions}
            series={salesSeries}
            type="line"
            height={250}
          />
        </div>
      </div>

									</div>
								</div>
							</div>
						</div>
						

						<div className="row gx-3">
							<div className="col-xl-8 col-lg-12">
								<div className="card mb-3">
									<div className="card-header">
										<h5 className="card-title">Team Activity</h5>
									</div>
									<div className="card-body">
										<ul className="m-0 p-0">
											<li className="team-activity d-flex flex-wrap">
												<div className="activity-time py-2 me-3">
													<p className="m-0">10:30AM</p>
													<span className="badge bg-primary">New</span>
												</div>
												<div className="d-flex flex-column py-2">
													<h6>Earth - Admin Dashboard</h6>
													<p className="m-0 text-secondary">by Elnathan Lois</p>
												</div>
												<div className="ms-auto mt-4">
													<div className="progress small mb-1">
														<div className="progress-bar" role="progressbar" style={{width: "25%"}} aria-valuenow="25"
															aria-valuemin="0" aria-valuemax="100"></div>
													</div>
													<p className="text-secondary">(225 of 700gb)</p>
												</div>
											</li>
											<li className="team-activity d-flex flex-wrap">
												<div className="activity-time py-2 me-3">
													<p className="m-0">11:30AM</p>
													<span className="badge bg-primary">Task</span>
												</div>
												<div className="d-flex flex-column py-2">
													<h6>Bootstrap Gallery Admin Templates</h6>
													<p className="m-0 text-secondary">by Patrobus Nicole</p>
												</div>
												<div className="ms-auto mt-4">
													<div className="progress small mb-1">
														<div className="progress-bar" role="progressbar" style={{width: "90%"}} aria-valuenow="90"
															aria-valuemin="0" aria-valuemax="100"></div>
													</div>
													<p className="text-secondary">90% completed</p>
												</div>
											</li>
											<li className="team-activity d-flex flex-wrap">
												<div className="activity-time py-2 me-3">
													<p className="m-0">12:50PM</p>
													<span className="badge bg-danger">Closed</span>
												</div>
												<div className="d-flex flex-column py-2">
													<h6>Bootstrap Admin Themes</h6>
													<p className="m-0 text-secondary">by Abilene Omega</p>
												</div>
												<div className="ms-auto mt-3">
													<div id="sparkline1"></div>
												</div>
											</li>
										</ul>
									</div>
								</div>
							</div>
							<div className="col-xl-4 col-lg-12">
								<div className="card mb-3">
									<div className="card-header">
										<h5 className="card-title">Tasks</h5>
									</div>
									<div className="card-body">
										<div className="auto-align-graph">
											<div id="tasks"></div>
										</div>
										<div className="grid text-center">
											<div className="g-col-4">
												<i className="bi bi-triangle text-warning"></i>
												<h3 className="m-0 mt-1">7</h3>
												<p className="text-secondary m-0">Ongoing</p>
											</div>
											<div className="g-col-4">
												<i className="bi bi-triangle text-primary"></i>
												<h3 className="m-0 mt-1 fw-bolder">9</h3>
												<p className="text-secondary m-0">Pending</p>
											</div>
											<div className="g-col-4">
												<i className="bi bi-triangle text-danger"></i>
												<h3 className="m-0 mt-1">12</h3>
												<p className="text-secondary m-0">Completed</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>


						<div className="row gx-3">
							<div className="col-xl-4 col-sm-6">
								<div className="card mb-3">
									<div className="card-header">
										<h5 className="card-title">Events</h5>
									</div>
									<div className="card-body">
										<div className="bg-light px-3 py-2 d-flex justify-content-between align-items-center">
											<div id="todays-date" className="fw-semibold"></div>
											<div className="badge rounded-pill bg-primary fs-6">
												<span>21</span> Events
											</div>
										</div>
										<div className="event-list mt-3">
											<div className="d-flex align-items-center mb-4">
												<img src="assets/images/checked.svg" alt="Bootstrap Gallery" className="img-2x" />
												<div className="ms-3">
													<h6 className="text-primary mb-1 fw-bold">11:30AM</h6>
													<h6 className="m-0 text-secondary fw-normal">
														Product Launch
													</h6>
												</div>
											</div>
											<div className="d-flex align-items-center mb-4">
												<img src="assets/images/checked.svg" alt="Bootstrap Gallery" className="img-2x" />
												<div className="ms-3">
													<h6 className="text-primary mb-1 fw-bold">2:30PM</h6>
													<h6 className="m-0 text-secondary fw-normal">
														Code review
													</h6>
												</div>
											</div>
											<div className="d-flex align-items-center">
												<img src="assets/images/not-checked.svg" alt="Bootstrap Gallery" className="img-2x" />
												<div className="ms-3">
													<h6 className="text-primary mb-1 fw-bold">03:30PM</h6>
													<h6 className="m-0 text-secondary fw-normal">
														Product meeting with dev team
													</h6>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="col-xl-4 col-sm-6">
								<div className="card mb-3">
									<div className="card-header">
										<h5 className="card-title">Income</h5>
									</div>
									<div className="card-body p-0">
										<div id="income"></div>
										<div className="p-3 mt-n3">
											<div className="d-flex gap-3">
												<div className="">
													<h4 className="fw-semibold mb-1">1600k</h4>
													<p className="text-secondary m-0">
														<span className="bi bi-record-fill text-primary me-1"></span>Overall Income
													</p>
												</div>

												<div className="">
													<h4 className="fw-semibold mb-1">1200k</h4>
													<p className="text-secondary m-0">
														<span className="bi bi-record-fill text-danger me-1"></span>Overall Expenses
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="col-xl-4 col-sm-12">
								<div className="card mb-3">
									<div className="card-header">
										<h5 className="card-title">Activity</h5>
									</div>
									<div className="card-body">
										<div className="my-2 d-flex flex-column gap-3">
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">Server down</h6>
												<div className="badge bg-danger">High</div>
											</div>
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">Notification from bank</h6>
												<div className="badge bg-primary">Low</div>
											</div>
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">Transaction success alert</h6>
												<div className="badge bg-primary">Low</div>
											</div>
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">Critical issue</h6>
												<div className="badge bg-danger">High</div>
											</div>
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">Bug fix</h6>
												<div className="badge bg-danger">High</div>
											</div>
											<div className="d-flex align-items-center justify-content-between">
												<h6 className="m-0 fw-normal">OS update</h6>
												<div className="badge bg-primary">Low</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					
</>
    );
}
export default Dashboard;

