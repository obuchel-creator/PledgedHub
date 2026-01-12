import React from "react";

export default function SecurityWidget({ events = [] }) {
  return (
    <section aria-label="Security & Audit Events" style={{marginBottom:'2rem'}}>
      <h3 style={{color:'#d97706',marginBottom:'0.5rem'}}>Security & Audit Events</h3>
      {events.length === 0 ? (
        <p style={{color:'#374151'}}>No recent security events.</p>
      ) : (
        <ul style={{listStyle:'none',padding:0}}>
          {events.map((ev,i) => (
            <li key={i} style={{background:'#fffbe6',color:'#b45309',borderRadius:8,padding:'0.75rem 1rem',marginBottom:'0.5rem',boxShadow:'0 1px 4px #0001'}}>
              <strong>{ev.type}</strong> &mdash; {ev.message}
              <span style={{float:'right',fontSize:'0.9em',color:'#9ca3af'}}>{new Date(ev.timestamp).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
