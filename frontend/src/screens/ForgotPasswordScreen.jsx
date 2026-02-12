import React, { useState, useEffect } from "react";
import "../styles/quickbooks-auth.css";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import Logo from "../components/Logo";

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
          <div>
            <Logo size="large" showText={false} />
          </div>

          <h2>Reset your password</h2>
          <p className="subtitle">
            Enter your email or phone number to receive a reset link or code
          </p>

          {error && <div className="error-message" role="alert">{error}</div>}
          {success && !error && step === "request" && (
            <div className="success-message" role="status">
              {usePhone ? "✓ Reset code sent! Check your phone." : "✓ Reset link sent! Check your email."}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleSubmit}>
              {/* Tab Navigation */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${!usePhone ? 'active' : ''}`}
                  onClick={() => setUsePhone(false)}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`auth-tab ${usePhone ? 'active' : ''}`}
                  onClick={() => setUsePhone(true)}
                >
                  Phone
                </button>
              </div>

              {usePhone ? (
                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 771 234567"
                    required
                    disabled={loading}
                    aria-required="true"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="email">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    disabled={loading}
                    aria-required="true"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!email && !phone)}
                aria-busy={loading}
              >
                <span className="btn-icon">📧</span>
                {displayLabel}
              </button>

              <p className="form-footer-text">
                <Link to="/login">Back to sign in</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handlePhoneReset}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', textAlign: 'center' }}>
                Enter the code and create a new password
              </h3>

              <div className="form-group">
                <label htmlFor="code">Reset Code <span className="required">*</span></label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength="6"
                  required
                  disabled={loading}
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password <span className="required">*</span></label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength="8"
                  required
                  disabled={loading}
                  aria-required="true"
                />
              </div>

              {success && !error && (
                <div className="success-message" role="status">
                  ✓ Password reset successful! Redirecting to login...
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code || !newPassword}
                aria-busy={loading}
              >
                <span className="btn-icon">✓</span>
                {loading ? 'Resetting password...' : 'Reset password'}
              </button>

              <p className="form-footer-text">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setNewPassword("");
                    setSuccess(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--qb-primary)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: '600',
                    padding: 0
                  }}
                >
                  ← Back
                </button>
              </p>
            </form>
          )}

          <p className="auth-footer">
            <Link to="/help">Help</Link>
            <span> • </span>
            <Link to="/privacy">Privacy</Link>
            <span> • </span>
            <Link to="/terms">Terms</Link>
          </p>
        </section>
      </main>
    </div>
  );
}