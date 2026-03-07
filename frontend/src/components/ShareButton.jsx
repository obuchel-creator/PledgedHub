/**
 * ShareButton Component
 * Reusable social sharing component for PledgedHub
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
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
import { shareViaTelegram, shareViaReddit } from '../utils/shareHelpersExtra';

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

  // Handle share action
  const handleShare = async (channel, e) => {
    if (e) e.stopPropagation();
    // Track the share
    await trackShare(contentType, contentId, channel);

    let shouldClose = true;
    let fallbackError = null;
    try {
      switch (channel) {
                case 'telegram':
                  shareViaTelegram(shareContent.text, url);
                  break;
                case 'reddit':
                  shareViaReddit(shareContent.title, url);
                  break;
        case 'whatsapp':
          shareViaWhatsApp(shareContent.text, url);
          break;
        case 'sms':
          if (!isMobileDevice()) {
            toast.info('SMS sharing is only available on mobile devices.');
            shouldClose = false;
            break;
          }
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
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopySuccess(false), 2000);
          } else {
            toast.error('Failed to copy link.');
            shouldClose = false;
          }
          // Delay closing dropdown for copy feedback
          setTimeout(() => setShowDropdown(false), 400);
          return;
        }
        case 'native': {
          if (!navigator.share) {
            toast.info('Native sharing is not supported on this device/browser.');
            shouldClose = false;
            break;
          }
          const nativeResult = await shareViaNative(shareContent.title, shareContent.text, url);
          if (nativeResult.success) {
            setShareSuccess(true);
            toast.success('Shared successfully!');
            setTimeout(() => setShareSuccess(false), 2000);
          } else {
            toast.error(nativeResult.message || 'Failed to share.');
            shouldClose = false;
          }
          // Delay closing dropdown for native share feedback
          setTimeout(() => setShowDropdown(false), 400);
          return;
        }
        default:
          fallbackError = 'This share option is not supported.';
          break;
      }
    } catch (err) {
      fallbackError = err?.message || 'An error occurred while sharing.';
    }
    if (fallbackError) {
      toast.error(fallbackError);
      shouldClose = false;
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

              {/* Telegram */}
              <ShareOption
                icon="✈️"
                label="Telegram"
                color="#229ED9"
                onClick={(e) => handleShare('telegram', e)}
              />

              {/* Reddit */}
              <ShareOption
                icon="👽"
                label="Reddit"
                color="#FF4500"
                onClick={(e) => handleShare('reddit', e)}
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

        {/* Telegram */}
        <InlineButton
          icon="✈️"
          label="Telegram"
          color="#229ED9"
          size={size}
          onClick={() => handleShare('telegram')}
        />

        {/* Reddit */}
        <InlineButton
          icon="👽"
          label="Reddit"
          color="#FF4500"
          size={size}
          onClick={() => handleShare('reddit')}
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

// Share Option Component (for dropdown)
const ShareOption = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f3f4f6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <span style={{ color: color || '#374151', fontWeight: '500' }}>{label}</span>
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
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default ShareButton;


