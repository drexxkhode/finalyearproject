import{Link} from 'react-router-dom';

function Hero() {
  return (
		<>
        	<div className="app-hero-header d-flex align-items-center">
						
						<ol className="breadcrumb">
							<li className="breadcrumb-item">
								<i className="bi bi-house lh-1 pe-3 me-3 border-end border-dark"></i>
								<a href="index.html" className="text-decoration-none">Home</a>
							</li>
							<li className="breadcrumb-item text-secondary" aria-current="page">
								Dashboard
							</li>
						</ol>
					
						<div className="ms-auto d-lg-flex d-none flex-row">
							<div className="d-flex flex-row gap-2">
								<button className="btn btn-sm btn-primary">Today</button>
								<button className="btn btn-sm btn-white">7d</button>
								<button className="btn btn-sm btn-white">2w</button>
								<button className="btn btn-sm btn-white">1m</button>
								<button className="btn btn-sm btn-white">3m</button>
								<button className="btn btn-sm btn-white">6m</button>
								<button className="btn btn-sm btn-white">1y</button>
							</div>
						</div>
					

					</div>
		
        </>
  );
}

export default Hero;
