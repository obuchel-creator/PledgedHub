import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * ExportTablePDF
 * Exports a table to PDF using jsPDF and autoTable
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Array of object key names to extract values from
 * @param {string[]} [columnHeaders] - Optional display labels for column headers (same length as columns)
 * @param {string} fileName - Name of the PDF file
 * @param {string} title - Optional title for the PDF
 */
export default function ExportTablePDF({ data, columns, columnHeaders, fileName = "export.pdf", title }) {
  const handleExport = () => {
    if (!Array.isArray(data) || data.length === 0) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();

    if (title) {
      doc.setFontSize(14);
      doc.text(title, 14, 16);
    }

    // Use columnHeaders for display if provided, otherwise humanise the key names
    const headers = columnHeaders
      ? columnHeaders
      : columns.map(col => col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));

    autoTable(doc, {
      head: [headers],
      body: data.map(row => columns.map(col => {
        const val = row[col];
        return val !== undefined && val !== null ? String(val) : "";
      })),
      startY: title ? 24 : 10,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [27, 34, 54] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(fileName);
  };

  return (
    <button
      onClick={handleExport}
      aria-label="Export table as PDF"
      style={{
        display: "inline-block",
        background: "#ef4444",
        color: "#fff",
        fontWeight: 700,
        borderRadius: "8px",
        padding: "0.5rem 1.25rem",
        border: "none",
        cursor: "pointer",
        fontSize: "1rem",
        boxShadow: "0 2px 8px #ef444422",
        letterSpacing: "0.5px",
      }}
    >
      Export PDF
    </button>
  );
}
