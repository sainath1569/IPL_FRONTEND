import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/signin.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      Swal.fire("Missing Fields", "Please enter both email and password", "warning");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        "https://ipl-server-dsy3.onrender.com/api/user/signin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        localStorage.setItem("username", data.username);

        await Swal.fire("Login Successful!", `Welcome back, ${data.username}!`, "success");
        navigate("/dashboard"); 
      } else {
        Swal.fire("Login Failed", data.message || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Network Error", "Please check your connection", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">IPL Mock Auction</h1>
          <h2 className="signin-subtitle">Sign In to Your Account</h2>
        </div>

        <div className="signin-input-container">
          <label className="signin-label" htmlFor="email">Email</label>
          <input
            className="signin-input"
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="signin-input-container">
          <label className="signin-label" htmlFor="password">Password</label>
          <input
            className="signin-input"
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="signin-actions">
          <button
            className={`signin-button ${isLoggingIn ? "loading" : ""}`}
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </button>
          <Link className="signin-forgot-password" to="/forgot-password">
            Forgot Password?
          </Link>
        </div>

        <div className="signin-footer">
          <p className="signin-signup-text">
            Don't have an account?{" "}
            <Link to="/signup" className="signin-signup-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;