import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HelpScreen() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'pledges', name: 'Managing Pledges', icon: '💰' },
    { id: 'account', name: 'Account & Settings', icon: '👤' },
    { id: 'payments', name: 'Payments & Tracking', icon: '💳' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security & Privacy', icon: '🔒' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
    { id: 'contact', name: 'Contact Support', icon: '📧' },
  ];

  const faqData = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: `Click the "Sign Up" button and choose to register with email or use OAuth (Google/Facebook). Fill in your details and verify your email address. You can also sign in with your existing Google or Facebook account for faster access.`,
      },
      {
        question: 'What is PledgeHub?',
        answer:
          'PledgeHub is a comprehensive platform for managing pledges, donations, and commitments. It helps organizations and individuals track pledge fulfillment, send automated reminders, and maintain donor relationships.',
      },
      {
        question: 'How do I navigate the dashboard?',
        answer:
          'Your dashboard shows an overview of all pledges, recent activity, and quick actions. Use the navigation menu to access different sections like creating pledges, viewing reports, and managing settings.',
      },
    ],
    pledges: [
      {
        question: 'How do I create a new pledge?',
        answer: `Navigate to "Create Pledge" and fill in the required information: donor details, pledge amount, purpose, collection date, and any special notes. You can also set up automatic reminders.`,
      },
      {
        question: 'Can I edit a pledge after creating it?',
        answer:
          'Yes, you can edit pledge details by clicking on any pledge in your dashboard. You can modify amounts, dates, and add notes. Some changes may trigger notification updates to the donor.',
      },
      {
        question: 'How do I track pledge fulfillment?',
        answer:
          'Each pledge has a status (Pending, Paid, Overdue, Cancelled). Update the status manually or use the payment tracking features to automatically mark pledges as fulfilled.',
      },
      {
        question: 'What happens to overdue pledges?',
        answer:
          'Overdue pledges are automatically flagged in your dashboard. The system can send gentle reminder emails and provide reports on collection rates to help you follow up appropriately.',
      },
    ],
    account: [
      {
        question: 'How do I change my password?',
        answer: `Go to Settings > Account Security and click "Change Password". You'll need to enter your current password and choose a new one. For OAuth users, manage your password through your Google/Facebook account.`,
      },
      {
        question: 'How do I update my profile information?',
        answer:
          'Visit your Profile page to update your name, email, phone number, and other personal information. Some changes may require email verification.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes, you can delete your account from Settings > Account. This will permanently remove all your data. Consider exporting your pledge data first if you need to keep records.',
      },
    ],
    payments: [
      {
        question: 'How do I record a payment?',
        answer:
          "Click on a pledge and use the 'Record Payment' button. Enter the payment amount, date, and method. Partial payments are supported for tracking progress toward the full pledge amount.",
      },
      {
        question: 'Can I set up automatic payment tracking?',
        answer:
          'Yes, you can integrate with payment processors or manually update payment status. The system will automatically calculate balances and update pledge statuses.',
      },
    ],
    security: [
      {
        question: 'Is my data secure?',
        answer:
          'Yes, we use industry-standard encryption, secure authentication, and regular security updates. Your data is protected both in transit and at rest.',
      },
      {
        question: 'What data do you collect?',
        answer: `We collect only the information necessary to provide our service. See our Privacy Policy for complete details about data collection, usage, and your rights.`,
      },
    ],
    troubleshooting: [
      {
        question: "The page won't load or shows an error",
        answer:
          'Try refreshing the page with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to clear your cache. Make sure you have a stable internet connection. If the problem persists, try clearing your browser cache completely or using a different browser (Chrome, Firefox, or Safari).',
      },
      {
        question: "I can't log in to my account",
        answer:
          "First, verify you're using the correct email address and password. If you've forgotten your password, click 'Forgot password?' on the login page. For OAuth users (Google/Facebook), ensure you're using the same account you registered with. Clear your browser cookies if you continue experiencing issues.",
      },
      {
        question: 'My pledges are not showing up',
        answer:
          "Try refreshing your dashboard. If pledges are still missing, check if you're logged in with the correct account. Each user can only see their own pledges. If you recently created pledges, wait a few seconds and refresh the page.",
      },
      {
        question: "I'm getting a 'Network Error' message",
        answer:
          'This usually indicates a connection problem. Check your internet connection and try again. If the issue persists, our servers might be temporarily unavailable - please wait a few minutes and retry. You can also check your browser console (F12) for specific error details.',
      },
      {
        question: 'The dashboard looks broken or misaligned',
        answer:
          "This could be a caching issue. Clear your browser cache and refresh the page. Make sure you're using an up-to-date browser version. If you're using browser extensions (ad blockers, etc.), try disabling them temporarily to see if they're causing conflicts.",
      },
      {
        question: 'I forgot my password',
        answer:
          "Click 'Forgot password?' on the login page and enter your email address. You'll receive a password reset link via email. Note: OAuth users (Google/Facebook login) don't have a password - manage your credentials through your OAuth provider.",
      },
      {
        question: 'Email notifications are not working',
        answer:
          "Check your spam/junk folder first. Then verify your email notification settings in Settings > Preferences. Make sure your email address is correct in your profile. If you're still not receiving emails, contact support - there might be a server configuration issue.",
      },
      {
        question: "Can't upload or images won't display",
        answer:
          'Ensure your file size is under the limit (usually 5MB). Supported formats are JPG, PNG, and GIF. Check your internet connection speed - slow connections can cause upload failures. Try using a different image file if one particular file keeps failing.',
      },
      {
        question: 'The site is very slow',
        answer:
          'Slow performance can be caused by: slow internet connection, too many browser tabs open, outdated browser version, or high server load. Try closing unused tabs, updating your browser, or accessing the site during off-peak hours. Clear your browser cache to improve loading times.',
      },
      {
        question: "I'm seeing 'Access Denied' or 'Unauthorized' errors",
        answer:
          "This means you're trying to access a feature that requires specific permissions. Some features are admin-only or require you to be logged in. Log out and log back in to refresh your session. If you believe you should have access, contact your administrator or support.",
      },
      {
        question: 'Changes I made are not being saved',
        answer:
          "Make sure you click the 'Save' or 'Submit' button after making changes. Check if you see a success message after saving. If changes still don't persist, try logging out and back in. Your browser might be blocking cookies - check your browser privacy settings.",
      },
      {
        question: 'Mobile app/site not working properly',
        answer:
          "Ensure you're using a modern mobile browser (Chrome, Safari, Firefox). Clear your mobile browser cache and cookies. Check if you have the latest browser version installed. Some features work best in portrait mode on mobile devices.",
      },
    ],
    notifications: [
      {
        question: 'How do I enable email notifications?',
        answer:
          "Go to Settings > Preferences and toggle on 'Email Notifications'. You'll receive updates about pledge activities, reminders, and important account changes.",
      },
      {
        question: 'Can I customize which notifications I receive?',
        answer:
          'Yes, in your notification preferences you can choose to receive notifications for specific events like new pledges, payment confirmations, and reminders.',
      },
      {
        question: 'Why am I not receiving reminder emails?',
        answer:
          "Check your spam/junk folder first. Verify your email address is correct in your profile and that email notifications are enabled in Settings. Contact support if emails still aren't arriving.",
      },
    ],
  };

  const filteredFAQs =
    faqData[activeCategory]?.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Header Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px 32px',
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#f97316', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
              SUPPORT
            </p>
            <h1 style={{ color: '#1a202c', fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Help Center
            </h1>
            <p style={{ color: '#4a5568', fontSize: '1.1rem', margin: '0', lineHeight: '1.6' }}>
              Find answers to common questions and learn how to make the most of PledgeHub.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ marginTop: '32px', maxWidth: '600px', margin: '32px auto 0' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                }}
              >
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Categories Sidebar */}
        <div
          style={{
            minWidth: '250px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a202c',
            }}
          >
            Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeCategory === category.id ? '#eff6ff' : 'transparent',
                  color: activeCategory === category.id ? '#1d4ed8' : '#374151',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: activeCategory === category.id ? '600' : '500',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '16px' }}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        <div style={{ flex: 1 }}>
          {activeCategory !== 'contact' ? (
            <section style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb' }}>
              <h2
                style={{
                  color: '#1a202c',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '24px' }}>
                  {categories.find((c) => c.id === activeCategory)?.icon}
                </span>
                {categories.find((c) => c.id === activeCategory)?.name}
              </h2>

              {filteredFAQs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {filteredFAQs.map((faq, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#1a202c',
                          marginBottom: '12px',
                          lineHeight: '1.4',
                        }}
                      >
                        {faq.question}
                      </h3>
                      <p
                        style={{
                          color: '#374151',
                          lineHeight: '1.6',
                          margin: '0',
                          fontSize: '15px',
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                  }}
                >
                  <p>No results found for "{searchQuery}"</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Try a different search term or browse categories
                  </p>
                </div>
              )}
            </section>
          ) : (
            /* Contact Support Section */
            <section style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb' }}>
              <h2
                style={{
                  color: '#1a202c',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '24px' }}>ðŸ“§</span>
                Contact Support
              </h2>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f0f9ff',
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#0369a1', fontWeight: '600' }}>
                    ðŸ“§ Email Support
                  </h3>
                  <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>
                    Get help with your account, technical issues, or general questions.
                  </p>
                  <a
                    href="mailto:support@PledgeHub.org"
                    style={{
                      color: '#0369a1',
                      textDecoration: 'none',
                      fontWeight: '600',
                    }}
                  >
                    support@PledgeHub.org
                  </a>
                </div>

                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f0fdf4',
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#059669', fontWeight: '600' }}>
                    ðŸ“š Help Center
                  </h3>
                  <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>
                    Browse all help topics and find answers to common questions.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('getting-started');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#059669',
                      textDecoration: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Browse Help Topics â†’
                  </button>
                </div>

                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fef7ff',
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#a21caf', fontWeight: '600' }}>
                    ðŸ› Report a Bug
                  </h3>
                  <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>
                    Found an issue? Help us improve by reporting bugs.
                  </p>
                  <a
                    href="mailto:bugs@PledgeHub.org?subject=Bug Report"
                    style={{
                      color: '#a21caf',
                      textDecoration: 'none',
                      fontWeight: '600',
                    }}
                  >
                    Report Bug â†’
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Quick Links */}
          <section
            style={{
              marginTop: '2rem',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a202c',
              }}
            >
              Quick Links
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <Link
                to="/privacy"
                style={{
                  color: '#1a202c',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🔒 Privacy Policy
              </Link>
              <Link
                to="/terms"
                style={{
                  color: '#1a202c',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📋 Terms of Service
              </Link>
              <Link
                to="/about"
                style={{
                  color: '#1a202c',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ℹ️ About Us
              </Link>
            </div>
          </section>

          <section style={{ background: 'white', marginBottom: '2rem', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                What information do I need to collect from pledgers?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                At minimum, you'll need the pledger's name, contact information (email or phone),
                pledge amount, and purpose. Optional fields include pledge date and expected
                collection date to help you track timelines.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="managing-pledges"
            style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}
          >
            <h2
              id="managing-pledges"
              style={{
                color: '#1a202c',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}
            >
              Managing Pledges
            </h2>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                How do I view all my pledges?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Visit your{' '}
                <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  Dashboard
                </Link>{' '}
                to see a comprehensive view of all pledges. You'll see summary metrics at the top
                showing total amounts, number of pledges, and average contributions. Below that, you
                can browse through all individual pledges.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                Can I edit or delete a pledge?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Currently, pledges are stored permanently once created to maintain an accurate
                record. If you need to make corrections, you can create a new pledge with the
                correct information. For technical assistance with data modifications, please
                contact support.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                How do I track payments?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                The payments section on your dashboard shows all recorded payments linked to
                pledges. You can see who paid, how much they paid, and when the payment was
                received. This helps you track fulfillment rates and follow up with pending
                pledgers.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="account-settings"
            style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}
          >
            <h2
              id="account-settings"
              style={{
                color: '#1a202c',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}
            >
              Account & Settings
            </h2>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                How do I update my profile?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Go to your{' '}
                <Link to="/profile" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  Profile
                </Link>{' '}
                page to view and update your account information including your name and contact
                details.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                Can I change my notification preferences?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Yes! Visit the{' '}
                <Link to="/settings" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  Settings
                </Link>{' '}
                page to control your email notifications, theme preferences, and display name. Your
                preferences are saved automatically.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                Is my data secure?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Absolutely. We take data security seriously. All connections are encrypted,
                passwords are securely hashed, and your personal information is never shared with
                third parties. Read our{' '}
                <Link to="/privacy" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>{' '}
                for more details.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="technical-help"
            style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}
          >
            <h2
              id="technical-help"
              style={{
                color: '#1a202c',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}
            >
              Technical Support
            </h2>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                The page won't load. What should I do?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Try refreshing the page with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to clear your
                cache. Make sure you have a stable internet connection. If the problem persists, try
                using a different browser or clearing your browser cache.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                I forgot my password. How do I reset it?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                On the login page, click the "Forgot password?" link. Enter your email address or
                phone number, and you'll receive instructions to reset your password.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '0.5rem',
                }}
              >
                Still need help?
              </h3>
              <p
                style={{
                  color: '#4a5568',
                  lineHeight: '1.7',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                If you can't find the answer to your question, feel free to reach out to our support
                team. We're here to help! Check the{' '}
                <Link to="/about" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  About
                </Link>{' '}
                page for contact information.
              </p>
            </div>
          </section>

          <div
            style={{
              textAlign: 'center',
              marginTop: '3rem',
              padding: '2rem',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <p
              style={{
                margin: '0 0 1rem',
                fontSize: '1.1rem',
                color: '#1a202c',
                fontWeight: '600',
              }}
            >
              Ready to get started?
            </p>
            <Link 
              to="/register" 
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                backgroundColor: '#f97316',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}



