import React from 'react';
import QRCode from 'qrcode.react';

export default function PledgeQRCode({ url }) {
  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <h3 style={{ color: '#2563eb', marginBottom: '1rem' }}>Scan to Pledge</h3>
      <QRCode value={url} size={192} fgColor="#2563eb" bgColor="#fff" level="H" />
      <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#64748b' }}>{url}</div>
    </div>
  );
}


