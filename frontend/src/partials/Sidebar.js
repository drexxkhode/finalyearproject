import{Link} from 'react-router-dom';

function Header() {
  return (
    <>
    <nav id="sidebar" className="sidebar-wrapper">

					<div className="shop-profile">
						<p className="mb-1 fw-bold text-primary">Walmart</p>
						<p className="m-0">Los Angeles, California</p>
					</div>
					<div className="sidebarMenuScroll">
						<ul className="sidebar-menu">
							<li className="active current-page">
								<Link to={'/'} >
									<i className="bi bi-pie-chart"></i>
									<span className="menu-text">Dashboard</span>
								</Link>
							</li>
							<li>
								<a href="analytics.html">
									<i className="bi bi-bar-chart-line"></i>
									<span className="menu-text">Analytics</span>
								</a>
							</li>
							<li>
								<a href="widgets.html">
									<i className="bi bi-box"></i>
									<span className="menu-text">Widgets</span>
								</a>
							</li>
							<li>
								<a href="calendar.html">
									<i className="bi bi-calendar2"></i>
									<span className="menu-text">Calendar</span>
								</a>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-stickies"></i>
									<span className="menu-text">Components</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="accordions.html">Accordions</a>
									</li>
									<li>
										<a href="alerts.html">Alerts</a>
									</li>
									<li>
										<a href="buttons.html">Buttons</a>
									</li>
									<li>
										<a href="badges.html">Badges</a>
									</li>
									<li>
										<a href="carousel.html">Carousel</a>
									</li>
									<li>
										<a href="list-items.html">List Items</a>
									</li>
									<li>
										<a href="progress.html">Progress Bars</a>
									</li>
									<li>
										<a href="popovers.html">Popovers</a>
									</li>
									<li>
										<a href="tooltips.html">Tooltips</a>
									</li>
								</ul>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-ui-checks-grid"></i>
									<span className="menu-text">Forms</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="form-inputs.html">Form Inputs</a>
									</li>
									<li>
										<a href="form-checkbox-radio.html">Checkbox &amp; Radio</a>
									</li>
									<li>
										<a href="form-file-input.html">File Input</a>
									</li>
									<li>
										<a href="form-validations.html">Validations</a>
									</li>
									<li>
										<a href="date-time-pickers.html">Date Time Pickers</a>
									</li>
									<li>
										<a href="form-layouts.html">Form Layouts</a>
									</li>
								</ul>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-window-sidebar"></i>
									<span className="menu-text">Invoices</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="create-invoice.html">Create Invoice</a>
									</li>
									<li>
										<a href="view-invoice.html">View Invoice</a>
									</li>
									<li>
										<a href="invoice-list.html">Invoice List</a>
									</li>
								</ul>
							</li>
							<li>
								<a href="tables.html">
									<i className="bi bi-border-all"></i>
									<span className="menu-text">Tables</span>
								</a>
							</li>
							<li>
								<a href="events.html">
									<i className="bi bi-calendar4"></i>
									<span className="menu-text">Events</span>
								</a>
							</li>
							<li>
								<a href="subscribers.html">
									<i className="bi bi-check-circle"></i>
									<span className="menu-text">Subscribers</span>
								</a>
							</li>
							<li>
								<a href="contacts.html">
									<i className="bi bi-wallet2"></i>
									<span className="menu-text">Contacts</span>
								</a>
							</li>
							<li>
								<a href="settings.html">
									<i className="bi bi-gear"></i>
									<span className="menu-text">Settings</span>
								</a>
							</li>
							<li>
								<a href="profile.html">
									<i className="bi bi-person-square"></i>
									<span className="menu-text">Profile</span>
								</a>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-code-square"></i>
									<span className="menu-text">Cards</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="cards.html">Cards</a>
									</li>
									<li>
										<a href="advanced-cards.html">Advanced Cards</a>
									</li>
								</ul>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-pie-chart"></i>
									<span className="menu-text">Graphs</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="apex.html">Apex</a>
									</li>
									<li>
										<a href="morris.html">Morris</a>
									</li>
								</ul>
							</li>
							<li>
								<a href="maps.html">
									<i className="bi bi-pin-map"></i>
									<span className="menu-text">Maps</span>
								</a>
							</li>
							<li>
								<a href="tabs.html">
									<i className="bi bi-slash-square"></i>
									<span className="menu-text">Tabs</span>
								</a>
							</li>
							<li>
								<a href="modals.html">
									<i className="bi bi-terminal"></i>
									<span className="menu-text">Modals</span>
								</a>
							</li>
							<li>
								<a href="icons.html">
									<i className="bi bi-textarea"></i>
									<span className="menu-text">Icons</span>
								</a>
							</li>
							<li>
								<a href="typography.html">
									<i className="bi bi-explicit"></i>
									<span className="menu-text">Typography</span>
								</a>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-upc-scan"></i>
									<span className="menu-text">Login/Signup</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="login.html">Login</a>
									</li>
									<li>
										<a href="signup.html">Signup</a>
									</li>
									<li>
										<a href="forgot-password.html">Forgot Password</a>
									</li>
								</ul>
							</li>
							<li>
								<a href="page-not-found.html">
									<i className="bi bi-exclamation-diamond"></i>
									<span className="menu-text">Page Not Found</span>
								</a>
							</li>
							<li>
								<a href="maintenance.html">
									<i className="bi bi-exclamation-octagon"></i>
									<span className="menu-text">Maintenance</span>
								</a>
							</li>
							<li className="treeview">
								<a href="#!">
									<i className="bi bi-code-square"></i>
									<span className="menu-text">Multi Level</span>
								</a>
								<ul className="treeview-menu">
									<li>
										<a href="#!">Level One Link</a>
									</li>
									<li>
										<a href="#!">
											Level One Menu
											<i className="bi bi-chevron-right"></i>
										</a>
										<ul className="treeview-menu">
											<li>
												<a href="#!">Level Two Link</a>
											</li>
											<li>
												<a href="#!">Level Two Menu
													<i className="bi bi-chevron-right"></i>
												</a>
												<ul className="treeview-menu">
													<li>
														<a href="#!">Level Three Link</a>
													</li>
													<li>
														<a href="#!">Level Three Link</a>
													</li>
												</ul>
											</li>
										</ul>
									</li>
									<li>
										<a href="#!">Level One Link</a>
									</li>
								</ul>
							</li>
						</ul>
					</div>
					
				</nav>
				
    </>
  );
}

export default Header;
