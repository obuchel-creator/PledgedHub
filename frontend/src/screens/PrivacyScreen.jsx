import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '48px 32px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ color: '#f97316', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px', textAlign: 'center' }}>LEGAL</p>
          <h1 style={{ color: '#1a202c', fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center', margin: '0 0 8px 0' }}>Privacy Policy</h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', textAlign: 'center', margin: '0' }}>Last updated: December 7, 2025</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>Introduction</h2>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', marginBottom: '16px' }}>At PledgeHub, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information.</p>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', margin: '0' }}>By using PledgeHub, you agree to the collection and use of information in accordance with this policy.</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>Information We Collect</h2>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a202c', marginTop: '24px', marginBottom: '12px' }}>Personal Information</h3>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', marginBottom: '12px' }}>When you create an account, we collect:</p>
          <ul style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', paddingLeft: '24px', marginBottom: '20px' }}>
            <li>Your full name</li><li>Email address or phone number</li><li>Password (stored securely using encryption)</li>
          </ul>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a202c', marginTop: '24px', marginBottom: '12px' }}>Pledge Data</h3>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', marginBottom: '12px' }}>When you create pledges, we collect donor information, amounts, and dates.</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>How We Use Your Information</h2>
          <ul style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', paddingLeft: '24px', margin: '0' }}>
            <li style={{ marginBottom: '8px' }}><strong>Service Delivery:</strong> To provide pledge management services</li>
            <li style={{ marginBottom: '8px' }}><strong>Security:</strong> To protect against fraud and unauthorized access</li>
            <li><strong>Communication:</strong> To send updates and notifications</li>
          </ul>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>Data Protection</h2>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', marginBottom: '12px' }}>We implement industry-standard security measures including SSL/TLS encryption, secure password hashing, and regular security audits.</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>Your Rights</h2>
          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '1rem', marginBottom: '12px' }}>You have the right to access, correct, delete, or port your data. Contact us at privacy@PledgeHub.com to exercise these rights.</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ color: '#1a202c', fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px', margin: '0 0 16px 0' }}>Contact Us</h2>
          <div style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px', color: '#1a202c', fontWeight: '600' }}>PledgeHub Support</p>
            <p style={{ margin: '0', color: '#4a5568' }}>Email: privacy@PledgeHub.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

