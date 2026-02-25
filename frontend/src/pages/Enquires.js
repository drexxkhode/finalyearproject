import { useRef, useEffect } from "react"
const Enquiries=()=>{

  const tableRef = useRef(null)

  useEffect(() => {
	const $table = window.$(tableRef.current)

	// Initialize DataTable
	$table.DataTable({
	  destroy: true, // avoids re-initialization errors
	  paging: true,
	  searching: true,
	})

	// Cleanup on unmount
	return () => {
	  if (window.$.fn.DataTable.isDataTable(tableRef.current)) {
		$table.DataTable().destroy()
	  }
	}
  }, [])

    return (
<>
				{/* Row end */}
						<div className="col-xxl-12">
								<div className="card mb-3">
									<div className="card-header d-flex justify-content-between align-items-center">
										<h5 className="card-title">Enquiries</h5>
										<button className="btn btn-outline-primary btn-sm ms-auto">
											Download
										</button>
									</div>
									<div className="card-body">
										<div className="table-responsive">
											<table className="table align-middle table-hover m-0" ref={tableRef}>
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
															<span className="badge border border-danger text-danger">Open</span>
														</td>
														<td>Micheal</td>
														<td>
															<span className="badge border border-success text-success">High</span>
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
															<span className="badge border border-success text-success">In Progress</span>
														</td>
														<td>Donald</td>
														<td>
															<span className="badge border border-danger text-danger">Low</span>
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
															<span className="badge border border-danger text-danger">Open</span>
														</td>
														<td>Glory</td>
														<td>
															<span className="badge border border-success text-success">High</span>
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
															<span className="badge border border-success text-success">In Progress</span>
														</td>
														<td>Donald</td>
														<td>
															<span className="badge border border-danger text-danger">Low</span>
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
															<span className="badge border border-success text-success">In Progress</span>
														</td>
														<td>Glory</td>
														<td>
															<span className="badge border border-success text-success">High</span>
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
export default Enquiries;