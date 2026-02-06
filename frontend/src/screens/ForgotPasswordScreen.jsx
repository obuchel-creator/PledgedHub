import React, { useState, useEffect } from "react";
import "../authOutlook.css";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import Logo from "../components/Logo";
import { socialLogos } from "../assets/social-logos";
import { formatFormErrorMessage } from "../utils/formErrors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState("request"); // request, verify
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Email validation handler
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Please enter a valid email address (e.g., user@example.com)");
    } else {
      setEmailError("");
    }
  };

  // Phone validation handler
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    
    if (value && value.trim().length > 0 && value.trim().length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (usePhone) {
        // Phone validation
        if (!phone || phone.trim().length < 10) {
          setLoading(false);
          setError("Please enter a valid phone number (at least 10 digits).");
          return;
        }
        
        const res = await forgotPassword(undefined, phone);
        setLoading(false);
        if (res && res.success) {
          setStep("verify");
          setSuccess(true);
        } else {
          setError(formatFormErrorMessage((res && res.error) || "Failed to send reset code.", "Unable to send reset code. Please try again."));
        }
      } else {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          setLoading(false);
          setError("Please enter a valid email address (e.g., user@example.com).");
          return;
        }
        
        const res = await forgotPassword(email, undefined);
        setLoading(false);
        if (res && res.success) {
          setSuccess(true);
          setCanResend(false);
          setCountdown(60);
        } else {
          setError(formatFormErrorMessage((res && res.error) || "Failed to send reset link.", "Unable to send reset link. Please try again."));
        }
      }
    } catch (err) {
      setLoading(false);
      setError(formatFormErrorMessage(err?.message || "Failed to send reset link.", "Unable to send reset link. Please try again."));
    }
  };

  const handlePhoneReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await forgotPassword(undefined, phone, code, newPassword);
      setLoading(false);
      if (res && res.success) {
        setSuccess(true);
      } else {
        setError(formatFormErrorMessage((res && res.error) || "Failed to reset password.", "Unable to reset password. Please try again."));
      }
    } catch (err) {
      setLoading(false);
      setError(formatFormErrorMessage("Failed to reset password.", "Unable to reset password. Please try again."));
    }
  };

  const primaryLabel = usePhone ? "Send reset code" : "Send reset link";
  const displayLabel = loading ? "Sending..." : canResend ? primaryLabel : `Resend in ${countdown}s`;

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card" aria-label="Forgot Password Section">
          {/* Toast Success Notification */}
          {success && (
            <div className="toast-notification success-toast" role="status" aria-live="polite">
              <div className="toast-icon">✓</div>
              <div className="toast-content">
                <div className="toast-title">Success!</div>
                <div className="toast-message">
                  {usePhone ? "Reset code sent! Check your phone." : "Reset link sent! Check your email."}
                </div>
              </div>
            </div>
          )}

          <div style={{ width: "100%", textAlign: "center", marginBottom: "32px" }}>
            <Logo size="large" showText={false} />
          </div>

          <h2 tabIndex="0">Reset your password</h2>
          <p className="subtitle" tabIndex="0">
            Forgot your password? Enter your email address or phone number to receive a reset link or code.
          </p>

          {error && <div className="error-message" role="alert">{error}</div>}

          <div className="forgot-password-container">
            {step === "request" ? (
              <form onSubmit={handleSubmit} className="forgot-password-form" aria-label="Request password reset">
                {usePhone ? (
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      disabled={loading}
                      placeholder="e.g. 2567XXXXXXXX"
                      aria-required="true"
                      aria-label="Phone Number"
                    />
                    {phoneError && <div className="field-error" style={{color: '#ff6b6b', fontSize: '12px', marginTop: '4px'}}>{phoneError}</div>}
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                      required
                      disabled={loading}
                      placeholder="e.g. user@example.com"
                      aria-required="true"
                      aria-label="Email Address"
                    />
                    {emailError && <div className="field-error" style={{color: '#ff6b6b', fontSize: '12px', marginTop: '4px'}}>{emailError}</div>}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || (!email && !phone) || emailError || phoneError}
                  aria-busy={loading}
                  aria-label={displayLabel}
                >
                  {displayLabel}
                </button>

                <div className="switch-method">
                  <span>or</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setUsePhone(!usePhone);
                      setError("");
                      setEmailError("");
                      setPhoneError("");
                      setSuccess(false);
                    }}
                    aria-label={usePhone ? "Switch to email reset" : "Switch to phone reset"}
                  >
                    {usePhone ? "Use email instead" : "Use phone instead"}
                  </button>
                </div>
                <div className="back-to-login">
                  <Link to="/login" aria-label="Back to login">Back to login</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePhoneReset} className="forgot-password-form" aria-label="Verify code and reset password">
                <h2 tabIndex="0">Enter the code sent to your phone</h2>
                <div className="form-group">
                  <label htmlFor="code">Reset Code</label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={6}
                    aria-required="true"
                    aria-label="Reset Code"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    aria-required="true"
                    aria-label="New Password"
                  />
                </div>
                {error && <div className="error-message" role="alert">{error}</div>}
                <button type="submit" className="btn-primary" disabled={loading || !code || !newPassword} aria-busy={loading} aria-label="Reset password">
                  {loading ? "Resetting..." : "Reset password"}
                </button>
                <div className="switch-method">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setStep("request");
                      setCode("");
                      setNewPassword("");
                      setSuccess(false);
                    }}
                    aria-label="Back to request"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

          <div style={{ justifyContent: "center", gap: "24px", fontSize: "12px", flexWrap: "wrap" }}>
            <Link to="/help" style={{ color: "#5f6368", textDecoration: "none" }} aria-label="Help">Help</Link>
            <Link to="/privacy" style={{ color: "#5f6368", textDecoration: "none" }} aria-label="Privacy">Privacy</Link>
            <Link to="/terms" style={{ color: "#5f6368", textDecoration: "none" }} aria-label="Terms">Terms</Link>
          </div>
        </section>
      </main>
      <style>{`
        @media (max-width: 768px) {
          .auth-center-card {
            max-width: 98vw !important;
            min-width: 0 !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}