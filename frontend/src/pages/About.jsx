import React from 'react';

export default function About() {
  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 800, margin: '0 auto' }}
    >
      <h1>About PledgeHub</h1>
      <p style={{ color: '#444' }}>
        PledgeHub is a simple pledge and donation platform. The frontend (this React app)
        talks to an Express + MySQL backend to manage users, pledges and payments.
      </p>

      <section>
        <h2>What it does</h2>
        <ul>
          <li>Create and list pledges (goals or requests for support).</li>
          <li>Allow users to make payments/pledges and track payment history.</li>
          <li>Send confirmation notifications (email) when payments succeed.</li>
        </ul>
      </section>

      <section>
        <h2>Tech stack</h2>
        <p style={{ marginTop: 0 }}>
          Frontend: React + Vite. Backend: Node (Express) + MySQL. Simple, minimal design for fast
          iteration.
        </p>
      </section>

      <section>
        <h2>Development notes</h2>
        <ol>
          <li>
            Set <code>VITE_API_URL</code> in frontend <code>.env</code> to point to the backend API root (e.g. <code>http://localhost:5001/api</code>), or leave empty to use the same origin.<br />
            The app uses <code>getViteEnv().API_URL</code> to access this value.
          </li>
          <li>Run backend from backend/ with npm install && npm start.</li>
          <li>This page is informational — use the app UI to create and view pledges.</li>
        </ol>
      </section>

      <footer style={{ marginTop: 20, color: '#666', fontSize: 13 }}>
        <div>Repository: PledgeHub-pledge</div>
        <div>Contact: (add maintainer email or link in backend/utils/sendEmail.js)</div>
      </footer>
    </main>
  );
}



