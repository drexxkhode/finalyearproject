
const BookingReport=()=>{
    return (
<>
						<div class="col-xxl-12">
								<div class="card mb-3">
									<div className="card-header d-flex justify-content-between align-items-center">
										<h5 className="card-title">Bookings Report</h5>
										<button className="btn btn-outline-primary btn-sm ms-auto">
											Download
										</button>
									</div>
									<div class="card-body">
										<div class="table-responsive">
											<table class="table table-bordered m-0">
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
															<span class="badge border border-danger text-danger">Open</span>
														</td>
														<td>Micheal</td>
														<td>
															<span class="badge border border-success text-success">High</span>
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
															<span class="badge border border-success text-success">In Progress</span>
														</td>
														<td>Donald</td>
														<td>
															<span class="badge border border-danger text-danger">Low</span>
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
															<span class="badge border border-danger text-danger">Open</span>
														</td>
														<td>Glory</td>
														<td>
															<span class="badge border border-success text-success">High</span>
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
															<span class="badge border border-success text-success">In Progress</span>
														</td>
														<td>Donald</td>
														<td>
															<span class="badge border border-danger text-danger">Low</span>
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
															<span class="badge border border-success text-success">In Progress</span>
														</td>
														<td>Glory</td>
														<td>
															<span class="badge border border-success text-success">High</span>
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
}
export default BookingReport;