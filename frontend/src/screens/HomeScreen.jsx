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
        // Debug: log suggested_amount and goal_amount for each campaign
        items.forEach((c, i) => {
          console.log(`[DEBUG] Campaign #${i+1} id=${c.id} title=${c.title} suggested_amount=`, c.suggested_amount, 'goal_amount=', c.goal_amount);
        });
        setCampaigns(items); // Show all campaigns for testing
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
            onClick: () => window.open('/sample-templates/pledgehub-sample-kit.zip', '_blank'),
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

    // Debug: log campaign data and suggested/goal amounts
    if (campaigns && campaigns.length > 0) {
      const suggestedValues = campaigns.map(c => c.suggested_amount);
      const goalValues = campaigns.map(c => c.goal_amount);
      console.log('[DEBUG] All suggested_amounts:', suggestedValues);
      console.log('[DEBUG] All goal_amounts:', goalValues);
    }

    const totalGoal = campaigns.reduce(
      (sum, campaign) => sum + safeNumber(campaign.goal_amount),
      0,
    );
    const suggestedSum = campaigns.reduce(
      (sum, campaign) => sum + safeNumber(campaign.suggested_amount),
      0,
    );
    const averageSuggested = campaigns.length ? suggestedSum / campaigns.length : 0;

    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });

    return {
      count: campaigns.length,
      totalGoal: campaigns.length ? formatter.format(totalGoal) : '--',
      averageSuggested: campaigns.length ? formatter.format(averageSuggested) : '--',
    };
  }, [campaigns]);

    return (
      <main className="page page--wide" aria-labelledby="home-title" style={{ paddingTop: '1rem', background: 'linear-gradient(135deg, #f5f7fa 0%, #e3ecfa 100%)', minHeight: '100vh' }}>
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
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1.5px solid rgba(255,255,255,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                >
                  {/* Overlay for better text visibility */}
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15,23,42,0.48)',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }} />
                </span>
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
                      color: '#fff',
                      textShadow: '0 2px 12px rgba(0,0,0,0.32), 0 1px 1px rgba(30,41,59,0.18)',
                    }}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className="hero-slide__subtitle"
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      color: '#fff',
                      textShadow: '0 2px 12px rgba(0,0,0,0.32), 0 1px 1px rgba(30,41,59,0.18)',
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
                        {slide.stats.map((stat, idx) => (
                          <React.Fragment key={`${stat.label || 'stat'}-${idx}`}>
                          <dt
                            className="hero-slide__stat-value"
                          >
                            {stat.value}
                          </dt>
                          <dd
                            className="hero-slide__stat-label"
                          >
                            {stat.label}
                          </dd>
                        </React.Fragment>
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

          {/* Navigation controls removed - clean slider view */}
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
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1.5px solid rgba(255,255,255,0.28)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#1e293b',
              textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.10)',
              transition: 'background 0.3s',
            }}
          >
            <p
              id="snapshot-count"
              className="stat-card__label"
              style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#0f172a',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
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
                fontSize: campaignStats.count && campaignStats.count.toString().length > 8 ? '2.1rem' : '3rem',
                fontWeight: '700',
                color: '#0f172a',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
                marginBottom: '0.5rem',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                lineHeight: 1.1,
                display: 'block',
              }}
            >
              {campaignStats.count}
            </p>
            <p
              className="stat-card__meta"
              style={{
                fontSize: '0.9rem',
                color: '#334155',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
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
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1.5px solid rgba(255,255,255,0.28)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#1e293b',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.10)',
              transition: 'background 0.3s',
            }}
          >
            <p
              id="snapshot-goal"
              className="stat-card__label"
              style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#0f172a',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
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
                fontSize: campaignStats.totalGoal && campaignStats.totalGoal.length > 8 ? '2.1rem' : '3rem',
                fontWeight: '700',
                color: '#0f172a',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
                marginBottom: '0.5rem',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                lineHeight: 1.1,
                display: 'block',
              }}
            >
              {campaignStats.totalGoal}
            </p>
            <p
              className="stat-card__meta"
              style={{
                fontSize: '0.9rem',
                color: '#334155',
                textShadow: '0 1px 6px rgba(255,255,255,0.7), 0 1px 1px rgba(30,41,59,0.12)',
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
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1.5px solid rgba(255,255,255,0.28)',
              padding: '2rem',
              borderRadius: '16px',
              color: '#1e293b',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.10)',
              transition: 'background 0.3s',
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
                fontSize: campaignStats.averageSuggested && campaignStats.averageSuggested.length > 8 ? '2.1rem' : '3rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '0.5rem',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                lineHeight: 1.1,
                display: 'block',
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
              color: '#16a34a', // Green like the buttons
              border: '1.5px solid #16a34a',
              background: 'rgba(34,197,94,0.08)',
              boxShadow: '0 2px 8px rgba(16,185,129,0.10)',
              transition: 'background 0.2s, color 0.2s',
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
          <div
            className="campaigns-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              marginTop: '1.5rem',
            }}
          >
            {campaigns.map((campaign, index) => {
              const id = campaign?.id ?? campaign?._id ?? index;
              const title = campaign?.title ?? 'Untitled Campaign';
              let description = campaign?.description || 'No description provided yet.';
              const goalAmount = campaign?.goalAmount || campaign?.goal_amount || 0;
              const currentAmount = campaign?.currentAmount || campaign?.current_amount || 0;
              const pledgeCount = campaign?.pledgeCount || campaign?.pledge_count || 0;
              const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
              return (
                <div
                  key={id}
                  className="campaign-card campaign-card--pro campaign-card--fixed-height campaign-card--align-actions"
                >
                  <div className="campaign-card-content-area">
                    <span className="campaign-title">{title}</span>
                    <span className="campaign-description-pro">{description}</span>
                    <div className="campaign-stats-pro">
                      <span>🎯 Goal: <span className="campaign-goal">{formatter.format(goalAmount)}</span></span>
                      <span>💰 Raised: <span className="campaign-raised">{formatter.format(currentAmount)}</span></span>
                      <span>🤝 {pledgeCount} pledge{pledgeCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="campaign-action-row-horizontal campaign-action-row-bottom">
                    <Link
                      to={`/campaigns/${id}`}
                      className="btn btn-primary btn--small"
                      style={{
                        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.95) 0%, rgba(34, 197, 94, 0.9) 45%, rgba(16, 185, 129, 0.85) 100%)',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(22,163,74,0.08)',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        transition: 'background 0.2s',
                      }}
                    >
                      View & Pledge
                    </Link>
                    <div className="share-btn-container">
                      <ShareButton
                        contentType="campaign"
                        contentData={{
                          title: title,
                          goalAmount: goalAmount,
                          raisedAmount: currentAmount,
                        }}
                        contentId={id}
                        shareUrl={`${window.location.origin}/campaigns/${id}`}
                        style={{
                          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.95) 0%, rgba(34, 197, 94, 0.9) 45%, rgba(16, 185, 129, 0.85) 100%)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          boxShadow: '0 2px 8px rgba(22,163,74,0.08)',
                          padding: '0.5rem 1.2rem',
                          borderRadius: '6px',
                          minWidth: '90px',
                          minHeight: '36px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}



