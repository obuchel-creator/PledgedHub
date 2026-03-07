import React, { useState, useEffect } from "react";
import "../authOutlook.css";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import Logo from "../components/Logo";
import { socialLogos } from "../assets/social-logos";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (usePhone) {
        const res = await forgotPassword(undefined, phone);
        setLoading(false);
        if (res && res.success) {
          setStep("verify");
          setSuccess(true);
        } else {
          setError((res && res.error) || "Failed to send reset code.");
        }
      } else {
        const res = await forgotPassword(email, undefined);
        setLoading(false);
        if (res && res.success) {
          setSuccess(true);
          setCanResend(false);
          setCountdown(60);
        } else {
          setError((res && res.error) || "Failed to send reset link.");
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Failed to send reset link.");
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
        setError((res && res.error) || "Failed to reset password.");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to reset password.");
    }
  };

  const primaryLabel = usePhone ? "Send reset code" : "Send reset link";
  const displayLabel = loading ? "Sending..." : canResend ? primaryLabel : `Resend in ${countdown}s`;

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card" aria-label="Forgot Password Section">
          <div style={{ width: "100%", textAlign: "center", marginBottom: "32px" }}>
            <Logo size="large" showText={false} />
          </div>

          <h2 tabIndex="0">Reset your password</h2>
          <p className="subtitle" tabIndex="0">
            Forgot your password? Enter your email address or phone number to receive a reset link or code.
          </p>

          {error && <div className="error-message" role="alert">{error}</div>}
          {success && !error && step === "request" && (
            <div className="success-message" role="status">
              {usePhone ? "Reset code sent! Please check your phone." : "Reset link sent! Please check your email inbox."}
            </div>
          )}

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
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="e.g. 2567XXXXXXXX"
                      aria-required="true"
                      aria-label="Phone Number"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      aria-required="true"
                      aria-label="Email Address"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || (!email && !phone)}
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
                    onClick={() => setUsePhone(!usePhone)}
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
                {success && !error && <div className="success-message" role="status">Password reset successful! You can now log in.</div>}
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