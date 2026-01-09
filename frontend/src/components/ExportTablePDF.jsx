import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import PropTypes from "prop-types";

/**
 * ExportTablePDF
 * Exports a table to PDF using jsPDF and autoTable
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Array of column headers
 * @param {string} fileName - Name of the PDF file
 * @param {string} title - Optional title for the PDF
 */
export default function ExportTablePDF({ data, columns, fileName = "export.pdf", title }) {
  const handleExport = () => {
    const doc = new jsPDF();
    if (title) {
      doc.text(title, 14, 16);
    }
    doc.autoTable({
      head: [columns],
      body: data.map(row => columns.map(col => row[col] ?? "")),
      startY: title ? 22 : 10,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [27, 34, 54] }, // Brand navy
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    doc.save(fileName);
  };

  return (
    <button className="export-btn" onClick={handleExport} aria-label="Export table as PDF">
      PDF
    </button>
  );
}

ExportTablePDF.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  fileName: PropTypes.string,
  title: PropTypes.string,
};
