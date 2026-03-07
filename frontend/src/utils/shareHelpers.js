/**
 * Share Helpers for PledgedHub
 * Provides URL builders and sharing functionality for multiple platforms
 */

/**
 * Generate shareable URLs with tracking parameters
 */
export const generateShareUrl = (path, source, campaignId = null) => {
  const baseUrl = window.location.origin;
  const url = new URL(path, baseUrl);
  
  // Add tracking parameters
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'social_share');
  
  if (campaignId) {
    url.searchParams.set('campaign_id', campaignId);
  }
  
  return url.toString();
};

/**
 * WhatsApp share URL builder
 * Works on mobile and desktop (web.whatsapp.com)
 */
export const shareViaWhatsApp = (message, url = null) => {
  let text = message;
  if (url) {
    text += `\n\n${url}`;
  }
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank', 'width=600,height=700');
};

/**
 * SMS share (mobile only)
 * Opens native SMS app with pre-filled message
 */
export const shareViaSMS = (message, url = null) => {
  let text = message;
  if (url) {
    text += ` ${url}`;
  }
  
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
  window.location.href = smsUrl;
};

/**
 * Facebook share URL builder
 * Uses Facebook Share Dialog API
 */
export const shareViaFacebook = (url) => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=700');
};

/**
 * Twitter/X share URL builder
 * Opens tweet composer with pre-filled text and URL
 */
export const shareViaTwitter = (text, url, hashtags = []) => {
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.set('text', text);
  twitterUrl.searchParams.set('url', url);
  
  if (hashtags.length > 0) {
    twitterUrl.searchParams.set('hashtags', hashtags.join(','));
  }
  
  window.open(twitterUrl.toString(), '_blank', 'width=600,height=700');
};

/**
 * LinkedIn share URL builder
 */
export const shareViaLinkedIn = (url) => {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedinUrl, '_blank', 'width=600,height=700');
};

/**
 * Email share via mailto
 * Opens default email client with pre-filled content
 */
export const shareViaEmail = (subject, body, url = null) => {
  let emailBody = body;
  if (url) {
    emailBody += `\n\n${url}`;
  }
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  window.location.href = mailtoUrl;
};

/**
 * Copy to clipboard
 * Uses modern Clipboard API with fallback
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern Clipboard API
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Link copied to clipboard!' };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true, message: 'Link copied to clipboard!' };
      } catch (err) {
        document.body.removeChild(textArea);
        return { success: false, message: 'Failed to copy link' };
      }
    }
  } catch (err) {
    return { success: false, message: 'Failed to copy link' };
  }
};

/**
 * Native Web Share API (mobile only)
 * Falls back to custom share options if unavailable
 */
export const shareViaNative = async (title, text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, message: 'Shared successfully!' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, message: 'Share cancelled' };
      }
      return { success: false, message: 'Failed to share' };
    }
  }
  return { success: false, message: 'Native share not supported' };
};

/**
 * Generate share messages for different content types
 */
export const generateShareMessage = (type, data) => {
  switch (type) {
    case 'campaign':
      return {
        title: `Support: ${data.title}`,
        text: `🎯 Join me in supporting "${data.title}" on PledgedHub!\n\nGoal: UGX ${data.goalAmount?.toLocaleString()}\nRaised: UGX ${data.raisedAmount?.toLocaleString()}\n\nEvery contribution counts! 💪`,
        hashtags: ['PledgedHub', 'Fundraising', 'MakeADifference'],
      };
      
    case 'pledge':
      return {
        title: 'I made a pledge on PledgedHub!',
        text: `✅ I just pledged UGX ${data.amount?.toLocaleString()} to "${data.campaignTitle}" on PledgedHub!\n\nJoin me in making a difference! 🌟`,
        hashtags: ['PledgedHub', 'Giving', 'Community'],
      };
      
    case 'achievement':
      return {
        title: 'Achievement Unlocked!',
        text: `🏆 I achieved ${data.milestone} on PledgedHub!\n\n${data.description}\n\nJoin me in making an impact!`,
        hashtags: ['PledgedHub', 'Achievement', 'Impact'],
      };
      
    case 'milestone':
      return {
        title: `Campaign Milestone Reached!`,
        text: `🎉 "${data.campaignTitle}" just reached ${data.percentage}% of its goal on PledgedHub!\n\nHelp us reach 100%! Every pledge counts! 💚`,
        hashtags: ['PledgedHub', 'Milestone', 'Together'],
      };
      
    case 'referral':
      return {
        title: 'Join PledgedHub',
        text: `👋 Hey! I'm using PledgedHub to support amazing causes.\n\nJoin me and make a difference in your community! 🌍`,
        hashtags: ['PledgedHub', 'Community', 'Impact'],
      };
      
    default:
      return {
        title: 'Check out PledgedHub',
        text: `Discover amazing campaigns and make a difference on PledgedHub! 🚀`,
        hashtags: ['PledgedHub'],
      };
  }
};

/**
 * Track share events for analytics
 */
export const trackShare = async (contentType, contentId, channel) => {
  try {
    const response = await fetch('/api/analytics/track-share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pledgedhub_token')}`,
      },
      body: JSON.stringify({
        contentType,
        contentId,
        channel,
        timestamp: new Date().toISOString(),
      }),
    });
    
    return response.ok;
  } catch (err) {
    console.error('Failed to track share:', err);
    return false;
  }
};

/**
 * Check if mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
