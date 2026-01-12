import React from "react";

export default function WhatsAppIntegration({ messages = [] }) {
  return (
    <section aria-label="WhatsApp Integration" style={{marginBottom:'2rem'}}>
      <h3 style={{color:'#10b981',marginBottom:'0.5rem'}}>WhatsApp Messages</h3>
      {messages.length === 0 ? (
        <p style={{color:'#374151'}}>No recent WhatsApp messages.</p>
      ) : (
        <ul style={{listStyle:'none',padding:0}}>
          {messages.map((msg,i) => (
            <li key={i} style={{background:'#e6fff7',color:'#047857',borderRadius:8,padding:'0.75rem 1rem',marginBottom:'0.5rem',boxShadow:'0 1px 4px #0001'}}>
              <strong>{msg.sender}</strong>: {msg.text}
              <span style={{float:'right',fontSize:'0.9em',color:'#9ca3af'}}>{new Date(msg.timestamp).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
