import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/signup.css";

function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      Swal.fire("Missing Fields", "Please fill in all required fields", "warning");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire("Password Mismatch", "Passwords do not match", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://ipl-server-dsy3.onrender.com/api/user/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await Swal.fire("Registration Successful!", "Your account has been created", "success");
        navigate("/signin");
      } else {
        Swal.fire("Registration Failed", data.message || "Unable to create account", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Network Error", "Please check your connection", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">IPL Mock Auction</h1>
          <h2 className="signup-subtitle">Create Your Account</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="signup-input-container">
            <label className="signup-label" htmlFor="username">Username</label>
            <input
              className="signup-input"
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="signup-input-container">
            <label className="signup-label" htmlFor="email">Email</label>
            <input
              className="signup-input"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="signup-input-container">
            <label className="signup-label" htmlFor="password">Password</label>
            <input
              className="signup-input"
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="signup-input-container">
            <label className="signup-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="signup-input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="signup-actions">
            <button
              className={`signup-button ${isSubmitting ? "loading" : ""}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="signup-footer">
          <p className="signup-login-text">
            Already have an account?{" "}
            <Link to="/signin" className="signup-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;