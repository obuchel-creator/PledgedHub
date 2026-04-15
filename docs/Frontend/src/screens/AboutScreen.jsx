import React from 'react';
import './AboutScreen.css';

export default function AboutScreen() {
  return (
    <div className="about-screen">
      <main
        className="page page--narrow"
        aria-labelledby="about-title"
      >
        <header
          className="page-header"
        >
          <p className="page-header__eyebrow">
            About
          </p>
          <h1 id="about-title" className="page-header__title">
            PledgeHub Platform
          </h1>
          <p className="page-header__subtitle">
            A community-focused pledge and donation experience.
          </p>
        </header>

        <section
          className="section card"
          aria-labelledby="about-mission"
          style={{ background: '#fff', color: '#1f2937' }}
        >
          <h2
            id="about-mission"
            className="section__title"
          >
            What PledgeHub Does
          </h2>
          <p className="section__lead">
            We give organisations and teams a clear way to capture pledges, track progress, and
            celebrate the impact of every contribution.
          </p>
          <ul className="list list--divided">
            <li className="list-item">
              <div className="list-item__meta">
                <span className="list-item__title">
                  Create pledges
                </span>
                <span className="list-item__subtitle">
                  Organise campaigns with clear goals, descriptions, and suggested contribution
                  amounts.
                </span>
              </div>
            </li>
            <li className="list-item">
              <div className="list-item__meta">
                <span className="list-item__title">
                  Track participation
                </span>
                <span className="list-item__subtitle">
                  Monitor payments, pledge history, and supporter momentum at a glance.
                </span>
              </div>
            </li>
            <li className="list-item">
              <div className="list-item__meta">
                <span className="list-item__title">
                  Keep supporters informed
                </span>
                <span className="list-item__subtitle">
                  Send confirmation emails and updates so everyone knows how their pledge helps.
                </span>
              </div>
            </li>
          </ul>
        </section>

        <section
          className="section card"
          aria-labelledby="about-values"
          style={{ background: '#fff', color: '#1f2937' }}
        >
          <h2
            id="about-values"
            className="section__title"
          >
            Our Values
          </h2>
          <div className="content-grid">
            <div>
              <h3>
                Transparency
              </h3>
              <p>
                Every pledge is visible and trackable. We believe in open communication with all
                supporters.
              </p>
            </div>
            <div>
              <h3>
                Community
              </h3>
              <p>
                Building strong connections between organizations and their supporters through
                meaningful engagement.
              </p>
            </div>
            <div>
              <h3>
                Simplicity
              </h3>
              <p>
                Making pledge management easy and intuitive, so you can focus on what matters most.
              </p>
            </div>
          </div>
        </section>

        <section
          className="section card"
          aria-labelledby="about-impact"
          style={{ background: '#fff', color: '#1f2937' }}
        >
          <h2
            id="about-impact"
            className="section__title"
          >
            Making an Impact Together
          </h2>
          <p>
            Whether you're organizing a wedding, funding a community project, or running a
            fundraising campaign, PledgeHub provides the tools you need to manage
            contributions with confidence and transparency.
          </p>
        </section>

        <footer>
          <div>
            <p>
              Ready to get started?
            </p>
            <a href="/register" className="btn btn-primary">
              Create your account
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}



