import React from "react";
import PropTypes from "prop-types";

/**
 * NotificationToast
 * Simple notification toast for success/error/info messages
 * @param {string} message - The message to display
 * @param {string} type - success | error | info | warning
 * @param {function} onClose - Close handler
 */
export default function NotificationToast({ message, type = "info", onClose }) {
  if (!message) return null;
  let bg = "#fbbf24", color = "#0f172a";
  if (type === "success") { bg = "#10b981"; color = "#fff"; }
  if (type === "error") { bg = "#ef4444"; color = "#fff"; }
  if (type === "info") { bg = "#2563eb"; color = "#fff"; }
  if (type === "warning") { bg = "#f59e0b"; color = "#fff"; }
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      background: bg, color, padding: "1rem 2rem", borderRadius: 8,
      boxShadow: "0 4px 24px #0002", fontWeight: 600, fontSize: "1.1rem",
      display: "flex", alignItems: "center", gap: 16
    }} role="alert" aria-live="polite">
      <span>{message}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", color, fontSize: 24, cursor: "pointer", marginLeft: 8
      }} aria-label="Close notification">&times;</button>
    </div>
  );
}

NotificationToast.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]),
  onClose: PropTypes.func.isRequired,
};
