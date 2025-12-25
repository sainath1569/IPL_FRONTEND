import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire('Error', 'Please enter your email address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://ipl-server-dsy3.onrender.com/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: 'Reset Link Sent',
          html: `We've sent a password reset link to <b>${email}</b>. Please check your inbox.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
        navigate('/signin');
      } else {
        Swal.fire('Error', data.message || 'Failed to send reset email', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">IPL MOCK AUCTION</h1>
          <p className="auth-subtitle1">Forgot Password</p>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-input-container">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              className="auth-input"
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button
              className={`auth-button ${isSubmitting ? 'loading' : ''}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Remember your password?{' '}
            <a href="/signin" className="auth-link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;