import React from "react";
import PropTypes from "prop-types";

/**
 * CustomWidget
 * Render a custom widget card with title, value, icon, and optional children
 * @param {string} title
 * @param {string|number|React.ReactNode} value
 * @param {React.ReactNode} icon
 * @param {string} color
 * @param {React.ReactNode} children
 */
export default function CustomWidget({ title, value, icon, color = "#2563eb", children }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 16px #0001",
      padding: "1.5rem 2rem",
      minWidth: 220,
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      borderLeft: `6px solid ${color}`,
      margin: "0.5rem 0"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && <span style={{ fontSize: 32, color }}>{icon}</span>}
        <div style={{ fontWeight: 700, fontSize: 18, color }}>{title}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, margin: "0.5rem 0 0.25rem 0" }}>{value}</div>
      {children && <div style={{ marginTop: 8, width: "100%" }}>{children}</div>}
    </div>
  );
}

CustomWidget.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  icon: PropTypes.node,
  color: PropTypes.string,
  children: PropTypes.node,
};
