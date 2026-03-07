import React from 'react';
import './HeroBanner.css';

const slides = [
  {
    image: '/Rwenzori-mountains-scaled.jpg',
    title: 'Welcome to PledgedHub',
    subtitle: 'Smart Pledge Management for Africa',
    description: 'Automate, track, and grow your fundraising with AI, mobile money, and analytics.',
    cta: { text: 'Get Started', link: '/register' }
  },
  {
    image: '/bg-outlook.jpg',
    title: 'Seamless Mobile Money Integration',
    subtitle: 'MTN, Airtel, PayPal & More',
    description: 'Collect payments instantly and securely from anywhere.',
    cta: { text: 'View Campaigns', link: '/campaigns' }
  },
  {
    image: '/logo.png',
    title: 'AI-Powered Reminders',
    subtitle: 'Boost Collection Rates',
    description: 'Automated SMS, WhatsApp, and email reminders with Gemini AI.',
    cta: { text: 'Learn More', link: '/features' }
  }
];

export default function HeroBanner() {
  const [current, setCurrent] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);
  const slide = slides[current];
  return (
    <div className="hero-banner" style={{ backgroundImage: `url(${slide.image})` }}>
      <div className="hero-banner__gradient" />
      <div className="hero-banner__overlay animate-fade-in">
        <h1 className="hero-banner__title pro-title">{slide.title}</h1>
        <h2 className="hero-banner__subtitle pro-subtitle">{slide.subtitle}</h2>
        <p className="hero-banner__desc pro-desc">{slide.description}</p>
        {slide.cta && (
          <a href={slide.cta.link} className="hero-banner__cta" tabIndex={0}>
            {slide.cta.text}
          </a>
        )}
        <div className="hero-banner__dots">
          {slides.map((_, i) => (
            <span key={i} className={i === current ? 'active' : ''} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}
