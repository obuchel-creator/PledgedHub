import React, { useState, useEffect } from "react";
import "../authOutlook.css";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import Logo from "../components/Logo";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState("request"); // request | verify | done
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => document.body.classList.remove('auth-bg');
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) setCanResend(true);
  }, [countdown]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (usePhone) {
        const res = await forgotPassword(undefined, phone);
        if (res?.success) {
          setStep("verify");
        } else {
          setError(res?.error || res?.message || "Failed to send reset code.");
        }
      } else {
        const res = await forgotPassword(email, undefined);
        if (res?.success) {
          setEmailSent(true);
          setCanResend(false);
          setCountdown(60);
        } else {
          setError(res?.error || res?.message || "Failed to send reset link.");
        }
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(undefined, phone, code, newPassword);
      if (res?.success) {
        setStep("done");
      } else {
        setError(res?.error || res?.message || "Failed to reset password. Check your code.");
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email ? email : undefined, phone ? phone : undefined);
      if (res?.success) {
        setCanResend(false);
        setCountdown(60);
      } else {
        setError(res?.error || "Failed to resend.");
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── DONE state ─── */
  if (step === "done") {
    return (
      <div className="auth-bg">
        <main>
          <section className="auth-center-card" aria-label="Password reset successful">
            <div style={{ width: "100%", textAlign: "center", marginBottom: "28px" }}>
              <Logo size="medium" showText={false} />
            </div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(16,185,129,0.15)",
                border: "2px solid #10b981",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 28,
              }}>✓</div>
              <h2 style={{ color: "#10b981", marginBottom: 8 }}>Password Reset!</h2>
              <p className="subtitle" style={{ color: '#e2e8f0' }}>Your password has been updated successfully. You can now sign in with your new password.</p>
            </div>
            <Link
              to="/login"
              style={{
                display: "block", textAlign: "center",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#0f0f0f", borderRadius: 8, padding: "12px 24px",
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                marginBottom: 16, boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}
            >
              Sign in to PledgedHub
            </Link>
            <div className="auth-meta-links">
              <Link to="/help" className="auth-footer-link-light">Help</Link>
              <Link to="/privacy" className="auth-footer-link-light">Privacy</Link>
              <Link to="/terms" className="auth-footer-link-light">Terms</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ─── VERIFY (phone OTP) state ─── */
  if (step === "verify") {
    return (
      <div className="auth-bg">
        <main>
          <section className="auth-center-card" aria-label="Verify code and reset password">
            <div style={{ width: "100%", textAlign: "center", marginBottom: "28px" }}>
              <Logo size="medium" showText={false} />
            </div>

            {/* Step indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {["Request code", "Reset password"].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: i === 1 ? "#f59e0b" : "rgba(245,158,11,0.3)",
                    color: i === 1 ? "#0f0f0f" : "#f59e0b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: i === 1 ? "#f59e0b" : "#9ca3af", fontWeight: 600 }}>{label}</span>
                  {i < 1 && <div style={{ width: 24, height: 1, background: "#333" }} />}
                </div>
              ))}
            </div>

            <h2>Enter your reset code</h2>
            <p className="subtitle" style={{ color: '#e2e8f0' }}>A 6-digit code was sent to <strong style={{ color: "#f59e0b" }}>{phone}</strong>. Enter it below along with your new password.</p>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span className="auth-alert-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndReset} noValidate>
              <div>
                <label htmlFor="code">6-Digit Reset Code</label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  disabled={loading}
                  maxLength={6}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="6-digit reset code"
                  style={{
                    textAlign: "center", fontSize: 28, fontWeight: 700,
                    letterSpacing: 12, fontFamily: "monospace",
                  }}
                />
              </div>

              <div>
                <label htmlFor="newPassword">New Password</label>
                <div className="auth-password-wrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className="auth-password-input"
                  />
                  <button
                    type="button"
                    className="auth-toggle-btn"
                    onClick={() => setShowNewPassword(v => !v)}
                    disabled={loading}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              {newPassword.length > 0 && (
                <div style={{
                  background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 14,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>Password strength</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {[8, 10, 12].map((len, i) => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 4,
                        background: newPassword.length >= len
                          ? i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#10b981"
                          : "#333",
                      }} />
                    ))}
                  </div>
                  <ul style={{ background: "transparent", border: "none", padding: "0 0 0 16px", fontSize: 11, margin: 0, color: "#9ca3af" }}>
                    {[
                      { label: "At least 8 characters", met: newPassword.length >= 8 },
                      { label: "Contains a number", met: /\d/.test(newPassword) },
                      { label: "Contains uppercase", met: /[A-Z]/.test(newPassword) },
                    ].map((req, i) => (
                      <li key={i} style={{ color: req.met ? "#10b981" : "#9ca3af", marginBottom: 2 }}>
                        {req.met ? "✓" : "○"} {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || code.length < 6 || newPassword.length < 8}
                aria-busy={loading}
                style={{ padding: "13px 24px", fontSize: 15, marginTop: 4 }}
              >
                {loading ? "Resetting password…" : "Reset password"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  type="button"
                  className="auth-text-btn"
                  onClick={() => { setStep("request"); setCode(""); setNewPassword(""); setError(""); }}
                >
                  ← Back to request
                </button>
              </div>
            </form>

            <div className="auth-meta-links" style={{ marginTop: 24 }}>
              <Link to="/help" className="auth-footer-link-light">Help</Link>
              <Link to="/privacy" className="auth-footer-link-light">Privacy</Link>
              <Link to="/terms" className="auth-footer-link-light">Terms</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ─── REQUEST state (default) ─── */
  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card" aria-label="Forgot Password">
          <div style={{ width: "100%", textAlign: "center", marginBottom: "28px" }}>
            <Logo size="medium" showText={false} />
          </div>

          <h2>Reset your password</h2>
          <p className="subtitle" style={{ color: '#e2e8f0' }}>
            {usePhone
              ? "Enter your phone number and we'll send a 6-digit reset code via SMS."
              : "Enter your email and we'll send a secure reset link to your inbox."}
          </p>

          {/* Email sent success card */}
          {emailSent && !error && (
            <div style={{
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 10, padding: "16px 18px", marginBottom: 20,
              display: "flex", alignItems: "flex-start", gap: 12,
            }} role="status">
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(16,185,129,0.2)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "#10b981",
              }}>✉</div>
              <div>
                <div style={{ fontWeight: 700, color: "#10b981", fontSize: 14, marginBottom: 4 }}>Reset link sent!</div>
                <div style={{ color: "#e2e8f0", fontSize: 12, lineHeight: 1.5 }}>
                  Check your inbox at <strong style={{ color: "#f59e0b" }}>{email}</strong>. The link expires in 30 minutes.
                </div>
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    style={{ fontSize: 12 }}
                  >
                    {canResend ? "Resend email" : `Resend in ${countdown}s`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="auth-alert-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRequestReset} noValidate>
            {/* Toggle pill: Email / Phone */}
            <div style={{
              display: "flex", background: "#2a2a2a", borderRadius: 10,
              padding: 4, marginBottom: 20, gap: 4,
            }}>
              {["Email", "Phone"].map((method, i) => {
                const active = (method === "Email") === !usePhone;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => { setUsePhone(method === "Phone"); setError(""); setEmailSent(false); }}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                      background: active ? "#f59e0b" : "transparent",
                      color: active ? "#0f0f0f" : "#9ca3af",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      transition: "all 0.2s", boxShadow: active ? "0 2px 8px rgba(245,158,11,0.3)" : "none",
                    }}
                    aria-pressed={active}
                  >
                    {method === "Email" ? "📧 Email" : "📱 Phone"}
                  </button>
                );
              })}
            </div>

            {usePhone ? (
              <div>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g. +2567XXXXXXXX"
                  autoComplete="tel"
                  aria-required="true"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading || emailSent}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || (!email.trim() && !phone.trim())}
              aria-busy={loading}
              style={{ padding: "13px 24px", fontSize: 15, marginTop: 4 }}
            >
              {loading
                ? (usePhone ? "Sending code…" : "Sending link…")
                : (usePhone ? "Send reset code" : emailSent ? "Reset link sent" : "Send reset link")}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
              ← Back to Sign In
            </Link>
          </div>

          <div style={{
            borderTop: "1px solid #333", paddingTop: 20, marginTop: 24,
            display: "flex", justifyContent: "center", gap: 20,
          }}>
            <Link to="/help" className="auth-footer-link-light">Help</Link>
            <Link to="/privacy" className="auth-footer-link-light">Privacy</Link>
            <Link to="/terms" className="auth-footer-link-light">Terms</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
