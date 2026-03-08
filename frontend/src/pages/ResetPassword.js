import { useState } from "react";
import axios from "axios";
import { useParams,useNavigate } from "react-router-dom";
const ResetPassword = () => {
  const [newPassword, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      "https://finalyearproject-fjo8.onrender.com/api/auth/reset-password",
      {
        token,
        newPassword,
      }
    );

    setMessage(res?.data?.message);
    setPassword("");

    setTimeout(() => {
      navigate("/login");
    }, 2500);

  } catch (err) {
    setMessage(err?.response?.data?.message || "Something went wrong");
    console.log(err);
  }
};
  return (
    <>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-sm-6 col-12">
            <div  className="my-5">
              <div className="border rounded-2 p-4 mt-5">
                <div className="login-form">
                  <a href="#" className="mb-4 d-flex">
                    <img
                      src="/assets/images/logo.svg"
                      className="img-fluid login-logo"
                      alt="Earth Admin Dashboard"
                    />
                  </a>
                  <h5 className="fw-light mb-5 lh-2">
                    In order to complete password reset, please enter
                    new Password to finish the password resetting process.
                  </h5>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Your Password
                    </label>
                    <form onSubmit={handleSubmit}>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className="form-control"
                          placeholder="Password"
                          value={newPassword}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />

                        <span
                          className="input-group-text"
                          style={{ cursor: "pointer" }}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          <i
                            className={`bi ${
                              showPassword ? "bi-eye-slash" : "bi-eye"
                            }`}
                          ></i>
                        </span>
                      </div>

                      <div className="d-grid py-3 mt-4">
                        <button
                          type="submit"
                          className="btn btn-lg btn-primary"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                    <p className="text-info fw-bold">{message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;

