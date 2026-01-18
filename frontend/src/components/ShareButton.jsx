/**
 * ShareButton Component
 * Reusable social sharing component for PledgeHub
 */

import React, { useState } from 'react';
import {
  shareViaWhatsApp,
  shareViaSMS,
  shareViaFacebook,
  shareViaTwitter,
  shareViaLinkedIn,
  shareViaEmail,
  copyToClipboard,
  shareViaNative,
  generateShareUrl,
  generateShareMessage,
  trackShare,
  isMobileDevice,
} from '../utils/shareHelpers';

const ShareButton = ({ 
  contentType = 'campaign',
  contentData = {},
  contentId = null,
  shareUrl = null,
  style = 'button', // 'button' | 'dropdown' | 'inline'
  size = 'medium', // 'small' | 'medium' | 'large'
  className = '',
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Generate share content
  const shareContent = generateShareMessage(contentType, contentData);
  const url = shareUrl || generateShareUrl(window.location.pathname, 'share_button', contentId);

  // Debug logging
  console.log('🔵 ShareButton props:', { contentType, contentData, contentId, shareUrl, url });
  console.log('🔵 ShareButton state - showDropdown:', showDropdown);

  // Handle share action
  const handleShare = async (channel, e) => {
    if (e) e.stopPropagation();
    console.log('🟢 Share clicked for platform:', channel, 'URL:', url);
    // Track the share
    await trackShare(contentType, contentId, channel);

    let shouldClose = true;
    switch (channel) {
      case 'whatsapp':
        shareViaWhatsApp(shareContent.text, url);
        break;
      case 'sms':
        shareViaSMS(shareContent.text, url);
        break;
      case 'facebook':
        shareViaFacebook(url);
        break;
      case 'twitter':
        shareViaTwitter(shareContent.text, url, shareContent.hashtags);
        break;
      case 'linkedin':
        shareViaLinkedIn(url);
        break;
      case 'email':
        shareViaEmail(shareContent.title, shareContent.text, url);
        break;
      case 'copy': {
        const result = await copyToClipboard(url);
        if (result.success) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          shouldClose = false;
        }
        // Delay closing dropdown for copy feedback
        setTimeout(() => setShowDropdown(false), 400);
        return;
      }
      case 'native': {
        const nativeResult = await shareViaNative(shareContent.title, shareContent.text, url);
        if (nativeResult.success) {
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
        } else {
          shouldClose = false;
        }
        // Delay closing dropdown for native share feedback
        setTimeout(() => setShowDropdown(false), 400);
        return;
      }
      default:
        break;
    }
    if (shouldClose) setShowDropdown(false);
  };

  // Size styles
  const sizeStyles = {
    small: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      dropdown: 'text-sm',
    },
    medium: {
      button: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      dropdown: 'text-base',
    },
    large: {
      button: 'px-6 py-3 text-lg',
      icon: 'w-6 h-6',
      dropdown: 'text-lg',
    },
  };

  const currentSize = sizeStyles[size];

  // Button style
  if (style === 'button') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('🔵 ShareButton clicked, showDropdown was:', showDropdown);
            setShowDropdown(!showDropdown);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowDropdown((v) => !v);
            }
          }}
          aria-haspopup="menu"
          aria-expanded={showDropdown}
          className={`${currentSize.button} bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 ${className}`}
          style={{
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => {
                setShowDropdown(false);
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
            
            {/* Dropdown Menu */}
            <div
              className={currentSize.dropdown}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
                border: '1px solid #e5e7eb',
                padding: '12px',
                minWidth: '240px',
                maxWidth: '280px',
                zIndex: 999,
                display: 'block',
              }}
            >
              {/* Native Share (mobile only) */}
              {isMobileDevice() && navigator.share && (
                <ShareOption
                  icon="📱"
                  label="Share..."
                  onClick={(e) => handleShare('native', e)}
                />
              )}

              {/* WhatsApp */}
              <ShareOption
                icon="💬"
                label="WhatsApp"
                color="#25D366"
                onClick={(e) => handleShare('whatsapp', e)}
              />

              {/* SMS (mobile only) */}
              {isMobileDevice() && (
                <ShareOption
                  icon="📲"
                  label="SMS"
                  color="#4CAF50"
                  onClick={(e) => handleShare('sms', e)}
                />
              )}

              {/* Facebook */}
              <ShareOption
                icon="📘"
                label="Facebook"
                color="#1877F2"
                onClick={(e) => handleShare('facebook', e)}
              />

              {/* Twitter */}
              <ShareOption
                icon="🐦"
                label="Twitter / X"
                color="#1DA1F2"
                onClick={(e) => handleShare('twitter', e)}
              />

              {/* LinkedIn */}
              <ShareOption
                icon="💼"
                label="LinkedIn"
                color="#0A66C2"
                onClick={(e) => handleShare('linkedin', e)}
              />

              {/* Email */}
              <ShareOption
                icon="✉️"
                label="Email"
                color="#EA4335"
                onClick={(e) => handleShare('email', e)}
              />

              <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

              {/* Copy Link */}
              <ShareOption
                icon={copySuccess ? "✅" : "🔗"}
                label={copySuccess ? "Copied!" : "Copy Link"}
                color={copySuccess ? "#10B981" : "#6B7280"}
                onClick={(e) => handleShare('copy', e)}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Inline style - show all buttons
  if (style === 'inline') {
    return (
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {/* WhatsApp */}
        <InlineButton
          icon="💬"
          label="WhatsApp"
          color="#25D366"
          size={size}
          onClick={() => handleShare('whatsapp')}
        />

        {/* SMS (mobile only) */}
        {isMobileDevice() && (
          <InlineButton
            icon="📲"
            label="SMS"
            color="#4CAF50"
            size={size}
            onClick={() => handleShare('sms')}
          />
        )}

        {/* Facebook */}
        <InlineButton
          icon="📘"
          label="Facebook"
          color="#1877F2"
          size={size}
          onClick={() => handleShare('facebook')}
        />

        {/* Twitter */}
        <InlineButton
          icon="🐦"
          label="X"
          color="#1DA1F2"
          size={size}
          onClick={() => handleShare('twitter')}
        />

        {/* Copy */}
        <InlineButton
          icon={copySuccess ? "✅" : "🔗"}
          label={copySuccess ? "Copied!" : "Copy"}
          color={copySuccess ? "#10B981" : "#6B7280"}
          size={size}
          onClick={() => handleShare('copy')}
        />
      </div>
    );
  }

  return null;
};


// SVG Icon components for each platform
const icons = {
  whatsapp: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.366.71.306 1.263.489 1.695.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/></svg>
  ),
  facebook: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path d="M15.117 8.667h-1.2c-.15 0-.317.2-.317.45v.9h1.517l-.2 1.517h-1.317v4.05h-1.7v-4.05h-1.05v-1.517h1.05v-.95c0-.85.517-1.7 1.7-1.7h1.317v1.35z" fill="#fff"/></svg>
  ),
  twitter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1DA1F2"/><path d="M19.633 7.997c-.508.226-1.054.379-1.626.448a2.825 2.825 0 001.24-1.555 5.657 5.657 0 01-1.793.685 2.822 2.822 0 00-4.807 2.572A8.012 8.012 0 015.67 7.149a2.822 2.822 0 00.873 3.77c-.45-.014-.874-.138-1.244-.344v.035a2.825 2.825 0 002.263 2.768c-.21.057-.432.088-.66.088-.162 0-.318-.016-.47-.045a2.825 2.825 0 002.637 1.96A5.66 5.66 0 015 17.027a7.978 7.978 0 004.29 1.257c5.148 0 7.967-4.267 7.967-7.967 0-.121-.003-.242-.009-.362a5.69 5.69 0 001.395-1.457z" fill="#fff"/></svg>
  ),
  linkedin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#0A66C2"/><path d="M8.5 17h-2v-6h2v6zm-1-7.1c-.69 0-1.25-.56-1.25-1.25S6.81 7.4 7.5 7.4s1.25.56 1.25 1.25S8.19 9.9 7.5 9.9zm9.5 7.1h-2v-3c0-.72-.28-1.2-.97-1.2-.53 0-.84.36-.98.71-.05.13-.06.31-.06.49v3h-2s.03-4.87 0-6h2v.85c.27-.42.76-1.02 1.85-1.02 1.35 0 2.36.88 2.36 2.77v3.4z" fill="#fff"/></svg>
  ),
  email: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#EA4335"/><path d="M6 8h12v8H6V8zm6 5l6-4H6l6 4z" fill="#fff"/></svg>
  ),
  copy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4" fill="#6B7280"/><rect x="8" y="8" width="8" height="8" rx="2" fill="#fff"/></svg>
  ),
  sms: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#4CAF50"/><path d="M6 8h12v8H6V8zm6 5l6-4H6l6 4z" fill="#fff"/></svg>
  ),
  native: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#6366F1"/><path d="M12 7v10m5-5H7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#10B981"/><path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

// Share Option Component (for dropdown)
const ShareOption = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '12px 14px',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      textAlign: 'left',
      fontWeight: 600,
      fontSize: '1.08rem',
      color: color || '#374151',
      outline: 'none',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f3f4f6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', fontSize: '22px' }}>{icons[icon] || icon}</span>
    <span>{label}</span>
  </button>
);

// Inline Button Component
const InlineButton = ({ icon, label, color, size, onClick }) => {
  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-5 py-2.5 text-base',
  };
  return (
    <button
      onClick={onClick}
      className={`${sizeStyles[size]} rounded-lg font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2`}
      style={{
        backgroundColor: color,
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', fontSize: '20px' }}>{icons[icon] || icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default ShareButton;


