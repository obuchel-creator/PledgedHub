import React from "react";

export default function QuickBooksIntegration({ syncStatus = "Idle" }) {
  return (
    <section aria-label="QuickBooks Integration" style={{marginBottom:'2rem'}}>
      <h3 style={{color:'#2563eb',marginBottom:'0.5rem'}}>QuickBooks Sync</h3>
      <div style={{background:'#f3f4f6',color:'#2563eb',borderRadius:8,padding:'0.75rem 1rem',marginBottom:'0.5rem',boxShadow:'0 1px 4px #0001'}}>
        <strong>Status:</strong> {syncStatus}
      </div>
      <button style={{background:'#2563eb',color:'#fff',borderRadius:8,padding:'0.5rem 1.5rem',border:'none',cursor:'pointer'}} aria-label="Sync with QuickBooks">Sync Now</button>
    </section>
  );
}
