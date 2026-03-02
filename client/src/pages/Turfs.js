import { useEffect } from "react";
import "aos/dist/aos.css";
import AOS from "aos";
import { Link} from "react-router-dom";
const Turfs =() => {
    
    return (
<>
 
    <div className="page-title">
      <div className="heading">
        <div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="heading-title">All Available Turfs</h1>
              <p className="mb-0">
                All Available Astro-Turfs within Dome Kwabenya and Ayawaso West Wuagon constituencies.
              </p>
            </div>
          </div>
        </div>
      </div>
      <nav className="breadcrumbs">
        <div className="container">
          <ol>
            <li><Link to={'/'} style={{textDecoration: "none"}}>Home</Link></li>
            <li className="current">Astro-Turfs Home</li>
          </ol>
        </div>
      </nav>
    </div>

    <section id="find-a-doctor" className="find-a-doctor section">

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="doctors-grid" data-aos="fade-up" data-aos-delay="300">
          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="100">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-2.webp" alt="Dr. Amanda Foster" className="img-fluid" />
                <div className="status-indicator available"></div>
              </div>
              <div className="doctor-details">
                <h4>Dr. Amanda Foster</h4>
                <span className="specialty-tag">Cardiology Specialist</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>14 years experience</span>
                </div>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <span className="rating-score">4.9</span>
              <span className="review-count">(127 reviews)</span>
            </div>
            <div className="action-buttons">
              <Link to={""} className="btn-secondary">View Details</Link>
              <a href="#!" className="btn-primary">Book Now</a>
            </div>
          </div>

          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="200">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-6.webp" alt="Dr. Marcus Johnson" className="img-fluid" />
                <div className="status-indicator busy"></div>
              </div>
              <div className="doctor-details">
                <h4>Legon Presec Astro-turf</h4>
                <span className="specialty-tag"><i className="bi bi-geo-alt" ></i> Legon</span>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-half"></i>
              </div>
              <span className="rating-score">4.8</span>
              <span className="review-count">(89 reviews)</span>
            </div>
            <div className="action-buttons">
              <Link to={"/view-turf"} className="btn-secondary">View Details</Link>
              <a href="#!" className="btn-primary">Make Enquiry</a>
            </div>
          </div>

          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="300">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-4.webp" alt="Dr. Rachel Williams" className="img-fluid" />
                <div className="status-indicator available"></div>
              </div>
              <div className="doctor-details">
                <h4>Dr. Rachel Williams</h4>
                <span className="specialty-tag">Pediatrics Care</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>11 years experience</span>
                </div>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <span className="rating-score">5.0</span>
              <span className="review-count">(203 reviews)</span>
            </div>
            <div className="action-buttons">
              <a href="#!" className="btn-secondary">View Details</a>
              <a href="#!" className="btn-primary">Book Now</a>
            </div>
          </div>

          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="400">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-8.webp" alt="Dr. David Chen" className="img-fluid" />
                <div className="status-indicator offline"></div>
              </div>
              <div className="doctor-details">
                <h4>Dr. David Chen</h4>
                <span className="specialty-tag">Orthopedic Surgery</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>22 years experience</span>
                </div>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-half"></i>
              </div>
              <span className="rating-score">4.7</span>
              <span className="review-count">(156 reviews)</span>
            </div>
            <div className="action-buttons">
              <a href="#!" className="btn-secondary">View Details</a>
              <a href="#!" className="btn-primary">Schedule</a>
            </div>
          </div>

          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="500">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-11.webp" alt="Dr. Victoria Torres" className="img-fluid" />
                <div className="status-indicator available"></div>
              </div>
              <div className="doctor-details">
                <h4>Dr. Victoria Torres</h4>
                <span className="specialty-tag">Dermatology Care</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>9 years experience</span>
                </div>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star"></i>
              </div>
              <span className="rating-score">4.5</span>
              <span className="review-count">(74 reviews)</span>
            </div>
            <div className="action-buttons">
              <a href="#!" className="btn-secondary">View Details</a>
              <a href="#!" className="btn-primary">Book Now</a>
            </div>
          </div>

          <div className="doctor-profile" data-aos="zoom-in" data-aos-delay="600">
            <div className="profile-header">
              <div className="doctor-avatar">
                <img src="assets/img/health/staff-14.webp" alt="Dr. Benjamin Lee" className="img-fluid" />
                <div className="status-indicator available"></div>
              </div>
              <div className="doctor-details">
                <h4>Dr. Benjamin Lee</h4>
                <span className="specialty-tag">Oncology Treatment</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>19 years experience</span>
                </div>
              </div>
            </div>
            <div className="rating-section">
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <span className="rating-score">4.9</span>
              <span className="review-count">(194 reviews)</span>
            </div>
            <div className="action-buttons">
              <a href="#!" className="btn-secondary">View Details</a>
              <a href="#!" className="btn-primary">Schedule</a>
            </div>
          </div>

        </div>

      </div>

    </section>
</>
    );
};
export default Turfs;