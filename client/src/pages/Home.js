
import { useEffect } from "react";
import "aos/dist/aos.css";
import AOS from "aos";
const Home = () =>{

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800,
    });
  }, []);


return (
<>
     <section id="hero" className="hero section">

      <div className="container" data-aos="fade-up" data-aos-delay="100">

        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="hero-content">

              <h1 data-aos="fade-right" data-aos-delay="300">
                Excellence in <span className="highlight">Healthcare</span> With Compassionate Care
              </h1>

              <p className="hero-description" data-aos="fade-right" data-aos-delay="400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>

              <div className="hero-stats mb-4" data-aos="fade-right" data-aos-delay="500">
                <div className="stat-item">
                  <h3><span data-purecounter-start="0" data-purecounter-end="15" data-purecounter-duration="2"
                      className="purecounter"></span>+</h3>
                  <p>Years Experience</p>
                </div>
                <div className="stat-item">
                  <h3><span data-purecounter-start="0" data-purecounter-end="5000" data-purecounter-duration="2"
                      className="purecounter"></span>+</h3>
                  <p>Patients Treated</p>
                </div>
                <div className="stat-item">
                  <h3><span data-purecounter-start="0" data-purecounter-end="50" data-purecounter-duration="2"
                      className="purecounter"></span>+</h3>
                  <p>Medical Experts</p>
                </div>
              </div>

              <div className="hero-actions" data-aos="fade-right" data-aos-delay="600">
                <a href="appointment.html" className="btn btn-primary">Book Appointment</a>
                <a href="https://www.youtube.com/watch?v=Y7f98aduVJ8" className="btn btn-outline glightbox">
                  <i className="bi bi-play-circle me-2"></i>
                  Watch Our Story
                </a>
              </div>

              <div className="emergency-contact" data-aos="fade-right" data-aos-delay="700">
                <div className="emergency-icon">
                  <i className="bi bi-telephone-fill"></i>
                </div>
                <div className="emergency-info">
                  <small>Emergency Hotline</small>
                  <strong>+1 (555) 911-2468</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-visual" data-aos="fade-left" data-aos-delay="400">
              <div className="main-image">
                <img src="assets/img/turf/astroturf.webp" alt="Modern Healthcare Facility" className="img-fluid" />
                <div className="floating-card appointment-card">
                  <div className="card-icon">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <div className="card-content">
                    <h6>Next Available</h6>
                    <p>Today 2:30 PM</p>
                    <small>Dr. Sarah Johnson</small>
                  </div>
                </div>
                <div className="floating-card rating-card">
                  <div className="card-content">
                    <div className="rating-stars">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                    <h6>4.9/5</h6>
                    <small>1,234 Reviews</small>
                  </div>
                </div>
              </div>
              <div className="background-elements">
                <div className="element element-1"></div>
                <div className="element element-2"></div>
                <div className="element element-3"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </section>
    
 <section id="find-a-doctor" className="find-a-doctor section">

      <div className="container section-title" data-aos="fade-up">
        <h2>Find A Doctor</h2>
        <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">

        <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="200">
          <div className="col-lg-8 text-center">
            <div className="search-section">
              <h3 className="search-title">Find Your Perfect Healthcare Provider</h3>
              <p className="search-subtitle">Search through our comprehensive directory of experienced medical professionals
              </p>
              <form className="search-form" action="#!" method="#">
                <div className="search-input-group">
                  <div className="input-wrapper">
                    <i className="bi bi-person"></i>
                    <input type="text" className="form-control" name="doctor_name" placeholder="Enter doctor name" />
                  </div>
                  <div className="select-wrapper">
                    <i className="bi bi-heart-pulse"></i>
                    <select className="form-select" name="specialty">
                      <option value="">All Specialties</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="neurology">Neurology</option>
                      <option value="orthopedics">Orthopedics</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="dermatology">Dermatology</option>
                      <option value="oncology">Oncology</option>
                    </select>
                  </div>
                  <button type="submit" className="search-btn">
                    <i className="bi bi-search"></i>
                    Find Doctors
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

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
              <a href="#!" className="btn-secondary">View Details</a>
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
                <h4>Dr. Marcus Johnson</h4>
                <span className="specialty-tag">Neurology Expert</span>
                <div className="experience-info">
                  <i className="bi bi-award"></i>
                  <span>16 years experience</span>
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
              <span className="rating-score">4.8</span>
              <span className="review-count">(89 reviews)</span>
            </div>
            <div className="action-buttons">
              <a href="#!" className="btn-secondary">View Details</a>
              <a href="#!" className="btn-primary">Schedule</a>
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

        <div className="text-center mt-5" data-aos="fade-up" data-aos-delay="700">
          <a href="doctors.html" className="btn-view-all">
            View All Doctors
            <i className="bi bi-arrow-right"></i>
          </a>
        </div>

      </div>

    </section>
</>


);

};
export default Home;