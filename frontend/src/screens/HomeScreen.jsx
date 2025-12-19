import React, { useEffect, useMemo, useState } from 'react';
import { getViteEnv } from '../utils/getViteEnv';
import { Link } from 'react-router-dom';
import { getCampaigns } from '../services/api';
import AIFeatureBanner from '../components/AIFeatureBanner';
import FeedbackButton from '../components/FeedbackButton';
import ShareButton from '../components/ShareButton';

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    console.log('HomeScreen: Starting to fetch campaigns...');
    getCampaigns()
      .then((data) => {
        console.log('HomeScreen: Received data:', data);
        if (!mounted) return;
        // Handle response format: { success: true, data: [...] } or just [...]
        const items = data?.success ? data.data || [] : Array.isArray(data) ? data : [];
        console.log('HomeScreen: Processed items:', items);
        setCampaigns(items.slice(0, 5));
        setError(null);
      })
      .catch((err) => {
        console.error('HomeScreen: Error fetching campaigns:', err);
        if (!mounted) return;
        setError(err?.message ?? err?.toString() ?? 'Failed to load campaigns');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const heroSlides = useMemo(
    () => [
      {
        id: 'giving-circle',
        eyebrow: 'Spotlight pledge',
        title: 'Launch a giving circle in your community',
        subtitle:
          'Coordinate pledges with live progress tracking, accountability updates, and instant thank-you notes.',
        background:
          'linear-gradient(135deg, rgba(37, 99, 235, 0.92) 0%, rgba(59, 130, 246, 0.88) 45%, rgba(14, 165, 233, 0.8) 100%)',
        actions: [
          { label: 'Start a pledge', to: '/create', variant: 'primary' },
          { label: 'Tour the dashboard', to: '/dashboard', variant: 'ghost' },
        ],
        stats: [
          { label: 'Avg. fulfilment', value: '92%' },
          { label: 'Active circles', value: '1,284' },
        ],
      },
      {
        id: 'real-time-tracking',
        eyebrow: 'Product highlight',
        title: 'Track donations in real time with built-in alerts',
        subtitle:
          'See contributions land the moment they are pledged and share milestones with supporters instantly.',
        background:
          'linear-gradient(140deg, rgba(15, 23, 42, 0.96) 0%, rgba(79, 70, 229, 0.88) 50%, rgba(59, 130, 246, 0.85) 100%)',
        actions: [
          { label: 'Open live dashboard', to: '/dashboard', variant: 'primary' },
          { label: 'Invite teammates', to: '/register', variant: 'secondary' },
        ],
        stats: [
          { label: 'Alerts sent', value: '3.4k' },
          { label: 'Response time', value: 'Sub-5s' },
        ],
      },
      {
        id: 'impact-updates',
        eyebrow: 'Success story',
        title: 'Share impact updates that keep supporters engaged',
        subtitle:
          'Use PledgeHub templates to publish progress stories, photo recaps, and budget transparency in minutes.',
        background:
          'linear-gradient(135deg, rgba(22, 163, 74, 0.95) 0%, rgba(34, 197, 94, 0.9) 45%, rgba(16, 185, 129, 0.85) 100%)',
        actions: [
          { label: 'See storytelling tips', to: '/about', variant: 'primary' },
          {
            label: 'Download sample kit',
            onClick: () => window.open('/sample-kit/index.html', '_blank'),
            variant: 'ghost',
          },
        ],
        stats: [
          { label: 'Avg. engagement lift', value: '3.2x' },
          { label: 'Stories published', value: '540+' },
        ],
      },
    ],
    [],
  );

  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = heroSlides.length;

  useEffect(() => {
    if (totalSlides <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((previous) => (previous + 1) % totalSlides);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [totalSlides]);

  const handlePrev = () => {
    setActiveSlide((previous) => (previous - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setActiveSlide((previous) => (previous + 1) % totalSlides);
  };

  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  const campaignStats = useMemo(() => {
    const safeNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const totalGoal = campaigns.reduce(
      (sum, campaign) => sum + safeNumber(campaign.goalAmount || campaign.goal_amount),
      0,
    );
    const averageSuggested = campaigns.length
      ? campaigns.reduce(
          (sum, campaign) =>
            sum + safeNumber(campaign.suggestedAmount || campaign.suggested_amount),
          0,
        ) / campaigns.length
      : 0;

    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });

    return {
      count: campaigns.length,
      totalGoal: totalGoal > 0 ? formatter.format(totalGoal) : '--',
      averageSuggested: averageSuggested > 0 ? formatter.format(averageSuggested) : '--',
    };
  }, [campaigns]);

  return (
    <main className="page page--wide" aria-labelledby="home-title" style={{ paddingTop: '1rem' }}>
      <FeedbackButton />

      <section
        className="hero hero--carousel"
        aria-labelledby="home-title"
        style={{ marginBottom: '3rem' }}
      >
        <h1 id="home-title" className="visually-hidden">
          {heroSlides[activeSlide]?.title || 'PledgeHub highlights'}
        </h1>
        <div
          className="hero-slider"
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured PledgeHub highlights"
          aria-live="polite"
          style={{
            minHeight: '500px',
            maxHeight: '600px',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 40px 90px -48px rgba(15, 23, 42, 0.42)',
          }}
        >
          {heroSlides.map((slide, index) => {
            const isActive = index === activeSlide;
            return (
              <article
                key={slide.id}
                className={`hero-slide${isActive ? ' hero-slide--active' : ''}`}
                aria-hidden={isActive ? 'false' : 'true'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '2rem 2rem 2rem 3rem',
                  paddingRight: '5rem',
                }}
              >
                <span
                  className="hero-slide__background"
                  style={{
                    background: slide.background,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                  }}
                />
                <div
                  className="hero-slide__content"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '620px',
                    width: '100%',
                  }}
                >
                  <p
                    className="hero-slide__eyebrow"
                    style={{
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {slide.eyebrow}
                  </p>
                  <h2
                    className="hero-slide__title"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                      fontWeight: '700',
                      lineHeight: '1.2',
                      marginBottom: '0.875rem',
                      color: '#ffffff',
                    }}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className="hero-slide__subtitle"
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {slide.subtitle}
                  </p>
                  {Array.isArray(slide.stats) && slide.stats.length > 0 && (
                    <dl
                      className="hero-slide__stats"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.875rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      {slide.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="hero-slide__stat"
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '0.875rem',
                          }}
                        >
                          <dt
                            className="hero-slide__stat-value"
                            style={{
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              color: '#ffffff',
                              marginBottom: '0.25rem',
                            }}
                          >
                            {stat.value}
                          </dt>
                          <dd
                            className="hero-slide__stat-label"
                            style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.8)',
                            }}
                          >
                            {stat.label}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {Array.isArray(slide.actions) && slide.actions.length > 0 && (
                    <div
                      className="hero-slide__actions"
                      role="group"
                      aria-label="Slide actions"
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {slide.actions.map((action) => {
                        const variantClass =
                          action.variant === 'secondary'
                            ? 'btn btn-secondary'
                            : action.variant === 'ghost'
                              ? 'btn btn-ghost'
                              : 'btn btn-primary';

                        // Special styling for ghost buttons on colored backgrounds
                        const ghostStyles =
                          action.variant === 'ghost'
                            ? {
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                color: '#ffffff',
                                border: '2px solid rgba(255, 255, 255, 0.5)',
                              }
                            : {};

                        const commonStyles = {
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          boxShadow:
                            action.variant === 'primary' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                          ...ghostStyles,
                        };

                        const mouseHandlers = {
                          onMouseEnter: (e) => {
                            if (action.variant === 'ghost') {
                              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                              e.target.style.border = '2px solid rgba(255, 255, 255, 0.7)';
                            }
                          },
                          onMouseLeave: (e) => {
                            if (action.variant === 'ghost') {
                              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                            }
                          },
                        };

                        // If action has onClick, render as button, otherwise render as Link
                        if (action.onClick) {
                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={action.onClick}
                              className={variantClass}
                              style={{
                                ...commonStyles,
                                cursor: 'pointer',
                                textDecoration: 'none',
                              }}
                              {...mouseHandlers}
                            >
                              {action.label}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={action.label}
                            to={action.to}
                            className={variantClass}
                            style={commonStyles}
                            {...mouseHandlers}
                          >
                            {action.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {totalSlides > 1 && (
            <>
              <button
                type="button"
                className="hero-slider__control hero-slider__control--prev"
                onClick={handlePrev}
                aria-label="Previous highlight"
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  transition: 'all 0.2s ease',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  opacity: 0.85,
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(-50%) scale(1.15)';
                  e.target.style.textShadow = '0 3px 12px rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.85';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                  e.target.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.4)';
                }}
              >
                {'‹'}
              </button>
              <button
                type="button"
                className="hero-slider__control hero-slider__control--next"
                onClick={handleNext}
                aria-label="Next highlight"
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  transition: 'all 0.2s ease',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  opacity: 0.85,
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(-50%) scale(1.15)';
                  e.target.style.textShadow = '0 3px 12px rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.85';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                  e.target.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.4)';
                }}
              >
                {'›'}
              </button>
              <div
                className="hero-slider__bullets"
                role="tablist"
                aria-label="Carousel navigation"
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.75rem',
                  zIndex: 10,
                }}
              >
                {heroSlides.map((slide, index) => {
                  const isActive = index === activeSlide;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      className={`hero-slider__bullet${isActive ? ' hero-slider__bullet--active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Show slide ${index + 1}: ${slide.title}`}
                      aria-pressed={isActive}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: 'none',
                        background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.3s ease',
                        transform: isActive ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section
        className="section"
        aria-labelledby="home-overview"
        style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2
          id="home-overview"
          className="section__title"
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '0.5rem',
          }}
        >
          Quick snapshot
        </h2>
        <p
          className="section__lead"
          style={{
            fontSize: '1.1rem',
            color: '#64748b',
            marginBottom: '2rem',
          }}
        >
          Check in on recent activity and use the dashboard for deeper reporting.
        </p>
        <div
          className="content-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <article
            className="stat-card"
            aria-labelledby="snapshot-count"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)',
            }}
          >
            <p
              id="snapshot-count"
              className="stat-card__label"
              style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Active campaigns
            </p>
            <p
              className="stat-card__value"
              style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              {campaignStats.count}
            </p>
            <p
              className="stat-card__meta"
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5',
              }}
            >
              Showing the latest {campaignStats.count || 'few'} campaigns you can support.
            </p>
          </article>

          <article
            className="stat-card"
            aria-labelledby="snapshot-goal"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <p
              id="snapshot-goal"
              className="stat-card__label"
              style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Combined goal
            </p>
            <p
              className="stat-card__value"
              style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              {campaignStats.totalGoal}
            </p>
            <p
              className="stat-card__meta"
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5',
              }}
            >
              Total fundraising goal across all active campaigns.
            </p>
          </article>

          <article
            className="stat-card"
            aria-labelledby="snapshot-suggested"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
            }}
          >
            <p
              id="snapshot-suggested"
              className="stat-card__label"
              style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Avg. suggested gift
            </p>
            <p
              className="stat-card__value"
              style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              {campaignStats.averageSuggested}
            </p>
            <p
              className="stat-card__meta"
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5',
              }}
            >
              Use this to communicate a starting point to new supporters.
            </p>
          </article>
        </div>
      </section>

      {/* AI Feature Banner */}
      <AIFeatureBanner />

      <section
        className="section card card--muted"
        aria-labelledby="recent-campaigns-heading"
        style={{
          padding: '2.5rem',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              id="recent-campaigns-heading"
              className="section__title"
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '0.5rem',
              }}
            >
              Active campaigns
            </h2>
            <p
              className="section__body"
              style={{
                fontSize: '1rem',
                color: '#64748b',
              }}
            >
              Browse active fundraising campaigns and make a pledge to support them.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="btn btn-ghost btn--small"
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '10px',
            }}
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="loading-state" aria-live="polite">
            Loading active campaigns...
          </div>
        ) : error ? (
          <div
            className="alert alert--error"
            role="alert"
            style={{
              padding: '1.5rem',
              background: '#fee',
              borderRadius: '12px',
              color: '#b91c1c',
            }}
          >
            <p style={{ marginBottom: '1rem', fontWeight: '600' }}>
              Unable to load campaigns: {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.95rem',
              }}
            >
              Try Again
            </button>
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>API URL: {getViteEnv().API_URL || 'http://localhost:5001/api'}</p>
              <p>Frontend Port: {window.location.port}</p>
              <p>
                Error Type:{' '}
                {error.includes('Network') ? 'Cannot connect to backend' : 'Other error'}
              </p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state" aria-live="polite">
            <p style={{ marginBottom: '0.75rem' }}>No active campaigns yet.</p>
            <div className="empty-state__actions">
              <Link to="/login" className="btn btn-primary">
                Login to create a campaign
              </Link>
            </div>
          </div>
        ) : (
          <ul className="list list--divided" aria-live="polite" style={{ marginTop: '1.5rem' }}>
            {campaigns.map((campaign, index) => {
              const id = campaign?.id ?? campaign?._id ?? index;
              const title = campaign?.title ?? 'Untitled Campaign';
              const description = campaign?.description || 'No description provided yet.';
              const goalAmount = campaign?.goalAmount || campaign?.goal_amount || 0;
              const currentAmount = campaign?.currentAmount || campaign?.current_amount || 0;
              const pledgeCount = campaign?.pledgeCount || campaign?.pledge_count || 0;

              const formatter = new Intl.NumberFormat(undefined, {
                maximumFractionDigits: 0,
              });

              return (
                <li key={id} className="list-item">
                  <div className="list-item__meta">
                    <span
                      className="list-item__title"
                      style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.15rem' }}
                    >
                      {title}
                    </span>
                    <span
                      className="list-item__subtitle"
                      style={{ color: '#334155', fontSize: '0.98rem' }}
                    >
                      {description}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#64748b',
                      }}
                    >
                      <span>Goal: {formatter.format(goalAmount)}</span>
                      <span>Raised: {formatter.format(currentAmount)}</span>
                      <span>
                        {pledgeCount} pledge{pledgeCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="list-item__actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link to={`/campaigns/${id}`} className="btn btn-primary btn--small">
                        View &amp; Pledge
                      </Link>
                      <ShareButton
                        contentType="campaign"
                        contentData={{
                          title: title,
                          goalAmount: goalAmount,
                          raisedAmount: currentAmount,
                        }}
                        contentId={id}
                        shareUrl={`${window.location.origin}/campaigns/${id}`}
                        style="button"
                        size="small"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}



