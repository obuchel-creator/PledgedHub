import React from 'react';
import '../styles/SampleKit.css';

const baseUrl = import.meta.env.BASE_URL;

const templates = [
  {
    name: 'Email Templates',
    file: `${baseUrl}sample-templates/email-templates.md`,
    emoji: '📧'
  },
  {
    name: 'Social Media Templates',
    file: `${baseUrl}sample-templates/social-media-templates.md`,
    emoji: '📱'
  },
  {
    name: 'Budget Transparency Template',
    file: `${baseUrl}sample-templates/budget-transparency.md`,
    emoji: '💰'
  },
  {
    name: 'Photo Recap Layout Guide',
    file: `${baseUrl}sample-templates/photo-recap-layout.md`,
    emoji: '📸'
  },
  {
    name: 'Thank You Letter Templates',
    file: `${baseUrl}sample-templates/thank-you-letters.md`,
    emoji: '💌'
  },
  {
    name: 'Milestone Announcement Templates',
    file: `${baseUrl}sample-templates/milestone-announcements.md`,
    emoji: '🎯'
  }
];

export default function SampleKitDownload() {
  return (
    <div className="sample-kit">
      <h2>🎉 PledgeHub Sample Kit</h2>
      <p>Your Complete Supporter Engagement Toolkit</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {templates.map(t => (
          <li key={t.file} style={{ marginBottom: '1rem' }}>
            <span className="emoji" aria-label={t.name}>{t.emoji}</span>
            {t.name}
            {/* Use anchor tag for download */}
            <a
              href={t.file}
              download
              className="download-btn"
              style={{ marginLeft: '1rem' }}
              tabIndex={0}
            >
              Markdown Download
            </a>
          </li>
        ))}
      </ul>
      {/* Anchor tag for ZIP download */}
      <a
        href={`${baseUrl}sample-templates/pledgehub-sample-kit.zip`}
        download
        className="download-btn"
        style={{ display: 'block', marginTop: '2rem', fontWeight: 'bold' }}
        tabIndex={0}
      >
        🚀 Download All Templates (ZIP)
      </a>
    </div>
  );
}
