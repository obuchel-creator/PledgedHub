import React from "react";

export default function CalendarIntegration({ events = [] }) {
  return (
    <section aria-label="Calendar Integration" style={{marginBottom:'2rem'}}>
      <h3 style={{color:'#2563eb',marginBottom:'0.5rem'}}>Upcoming Events</h3>
      {events.length === 0 ? (
        <p style={{color:'#374151'}}>No upcoming events.</p>
      ) : (
        <ul style={{listStyle:'none',padding:0}}>
          {events.map((ev,i) => (
            <li key={i} style={{background:'#e0f2fe',color:'#2563eb',borderRadius:8,padding:'0.75rem 1rem',marginBottom:'0.5rem',boxShadow:'0 1px 4px #0001'}}>
              <strong>{ev.title}</strong> &mdash; {ev.date}
              <span style={{float:'right',fontSize:'0.9em',color:'#9ca3af'}}>{ev.location}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
