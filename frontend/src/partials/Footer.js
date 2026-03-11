import { Link } from "react-router-dom";

function Footer() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <>
      <div className="app-footer">
        <div className="d-flex align-items-center justify-content-end">
          <span className="text-primary fw-semibold">{user.role}</span>
        </div>
      </div>
    </>
  );
}

export default Footer;
