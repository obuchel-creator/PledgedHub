# Social Sharing Implementation Guide

## Overview

PledgeHub now includes comprehensive social sharing functionality across WhatsApp, SMS, Facebook, Twitter, LinkedIn, Email, and copy-to-clipboard. This feature drives viral growth, user acquisition, and campaign visibility.

## Features Implemented

### ✅ Multi-Channel Sharing
- **WhatsApp**: Direct share via wa.me links (mobile & desktop)
- **SMS**: Native SMS app integration (mobile only)
- **Facebook**: Facebook Share Dialog
- **Twitter/X**: Tweet composer with hashtags
- **LinkedIn**: Professional network sharing
- **Email**: Mailto links with pre-filled content
- **Copy Link**: Clipboard API with fallback
- **Native Share**: Web Share API for mobile

### ✅ Sharing Locations

1. **Campaign Pages**
   - Campaign detail page header (share campaign link)
   - Campaign cards on home page (share to drive donations)

2. **Pledge Pages**
   - Pledge detail page (share achievement)
   - Visible to all users (even non-owners)

3. **Dashboard**
   - Achievement milestones (unlock at 5+ pledges)
   - Referral system with tracking
   - User invitation links

4. **Referral System**
   - Dedicated referral card with stats
   - Track invites sent, signups, active users
   - Unique referral URLs per user

### ✅ Backend Infrastructure

**Files Created:**
- `frontend/src/utils/shareHelpers.js` - URL builders and sharing logic
- `frontend/src/components/ShareButton.jsx` - Reusable share component
- `frontend/src/components/ReferralShare.jsx` - Referral invitation system
- `backend/routes/analyticsRoutes.js` - Share tracking endpoints (extended)
- `backend/scripts/add-sharing-tables.js` - Database migration

**Database Tables:**
- `share_events` - Tracks all share actions (user_id, content_type, channel, timestamp)
- `users.referred_by` - New column for referral tracking

## Technical Implementation

### ShareButton Component

**Props:**
```javascript
<ShareButton
  contentType="campaign|pledge|achievement|milestone|referral"
  contentData={{ title, goalAmount, raisedAmount, etc. }}
  contentId={123}
  shareUrl="https://pledgedhub.com/campaigns/123"
  style="button|inline|dropdown"
  size="small|medium|large"
/>
```

**Styles:**
- `button`: Dropdown menu (default)
- `inline`: All buttons visible side-by-side
- `dropdown`: Click to reveal options

### Share Helpers

**Key Functions:**
```javascript
// Generate tracking URLs
generateShareUrl(path, source, campaignId)

// Platform-specific sharing
shareViaWhatsApp(message, url)
shareViaSMS(message, url)
shareViaFacebook(url)
shareViaTwitter(text, url, hashtags)
shareViaEmail(subject, body, url)
copyToClipboard(text)

// Message generation
generateShareMessage(type, data)

// Analytics tracking
trackShare(contentType, contentId, channel)
```

### Message Templates

**Campaign Share:**
```
🎯 Join me in supporting "[Campaign Title]" on PledgeHub!

Goal: UGX 1,000,000
Raised: UGX 350,000

Every contribution counts! 💪
```

**Pledge Share:**
```
✅ I just pledged UGX 50,000 to "[Campaign]" on PledgeHub!

Join me in making a difference! 🌟
```

**Achievement Share:**
```
🏆 I achieved 10 Pledges on PledgeHub!

[Description]

Join me in making an impact!
```

**Referral Share:**
```
👋 Hey! I'm using PledgeHub to support amazing causes.

Join me and make a difference in your community! 🌍
```

## API Endpoints

### POST /api/analytics/track-share
Track a share event for analytics.

**Request:**
```json
{
  "contentType": "campaign",
  "contentId": 123,
  "channel": "whatsapp",
  "timestamp": "2025-12-11T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Share tracked successfully"
}
```

### GET /api/analytics/share-stats
Get sharing statistics for authenticated user.

**Query Parameters:**
- `period`: Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "stats": {
    "byChannel": {
      "whatsapp": 15,
      "facebook": 8,
      "copy": 12
    },
    "byDate": [...],
    "totalShares": 35
  }
}
```

### GET /api/referrals/stats
Get referral statistics for authenticated user.

**Response:**
```json
{
  "success": true,
  "stats": {
    "invitesSent": 12,
    "signups": 4,
    "activePledgers": 2
  }
}
```

## Setup Instructions

### 1. Run Database Migration

```bash
node backend/scripts/add-sharing-tables.js
```

This creates:
- `share_events` table
- `referred_by` column in `users` table

### 2. Verify Backend Routes

Ensure `analyticsRoutes.js` is loaded in `server.js`:

```javascript
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);
app.use('/api/referrals', analyticsRoutes); // Referral endpoints
```

### 3. Test Sharing Flow

1. Navigate to any campaign detail page
2. Click "Share" button
3. Select WhatsApp, SMS, or any channel
4. Verify share opens correctly
5. Check backend logs for tracking event

### 4. Verify Referral System

1. Login to dashboard
2. Scroll to "Invite Friends" section
3. Copy referral link
4. Open in incognito window
5. Register with `?ref=USER_ID` parameter
6. Check referral stats update

## Mobile Optimization

**SMS & Native Share (Mobile Only):**
```javascript
import { isMobileDevice } from '../utils/shareHelpers';

{isMobileDevice() && (
  <ShareOption
    icon="📲"
    label="SMS"
    onClick={() => handleShare('sms')}
  />
)}
```

**Native Web Share API:**
- Auto-detects availability (`navigator.share`)
- Falls back to custom share options
- Works on iOS Safari, Chrome Mobile

## URL Tracking Parameters

All shared URLs include UTM parameters:

```
https://pledgedhub.com/campaigns/123?utm_source=whatsapp&utm_medium=social_share&campaign_id=123
```

**Parameters:**
- `utm_source`: whatsapp, sms, facebook, twitter, email, copy
- `utm_medium`: social_share
- `campaign_id`: Optional campaign identifier

## Analytics Dashboard (Future)

Track share performance:
- **Top Channels**: Which platforms drive most shares
- **Viral Coefficient**: Shares per user
- **Conversion Rate**: Shares → Signups → Pledges
- **Best Content**: Most shared campaigns/achievements

## Customization

### Adding New Share Channel

1. **Add helper function** in `shareHelpers.js`:
```javascript
export const shareViaTelegram = (text, url) => {
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, '_blank');
};
```

2. **Add to ShareButton** component:
```javascript
<ShareOption
  icon="✈️"
  label="Telegram"
  color="#0088cc"
  onClick={() => handleShare('telegram')}
/>
```

3. **Update trackShare** to recognize new channel

### Customizing Share Messages

Edit `generateShareMessage()` in `shareHelpers.js`:

```javascript
case 'campaign':
  return {
    title: `Support: ${data.title}`,
    text: `🎯 Custom message here...`,
    hashtags: ['PledgeHub', 'YourHashtag'],
  };
```

## Best Practices

### ✅ Do:
- Test all channels on mobile and desktop
- Use emojis in share messages (increases engagement)
- Include clear calls-to-action
- Track shares for analytics
- A/B test message templates

### ❌ Don't:
- Make messages too long (160 chars for SMS)
- Spam users with share prompts
- Share without user consent
- Track shares without informing users
- Hardcode URLs (use dynamic generation)

## Viral Growth Strategy

### Phase 1: Organic Sharing (Current)
- Users share campaigns to raise funds
- Achievement sharing for social proof
- Referral links in dashboard

### Phase 2: Incentivized Sharing (Future)
- Reward users for successful referrals
- Unlock features at share milestones
- Gamification (badges, leaderboards)

### Phase 3: Automated Sharing (Future)
- Auto-post milestones to social media
- Schedule campaign updates
- Email digest of shareable moments

## Metrics to Monitor

**Key Performance Indicators:**
1. **Share Rate**: Shares per campaign/pledge
2. **Viral Coefficient**: New users per existing user
3. **Channel Performance**: Which platforms convert best
4. **Conversion Funnel**: Share → Click → Signup → Pledge
5. **Referral Quality**: Active users from referrals

**Target Metrics:**
- Share rate: 15-25% of users
- Viral coefficient: >1.0 (exponential growth)
- Click-through rate: 10-15%
- Signup conversion: 5-10%
- Active referrals: 30-40%

## Troubleshooting

### Issue: Share not tracking
**Solution:** Verify `share_events` table exists and `authenticateToken` middleware works

### Issue: SMS not opening on mobile
**Solution:** Ensure device has SMS app configured, use `sms:?body=` format

### Issue: Copy to clipboard fails
**Solution:** Requires HTTPS or localhost. Check `navigator.clipboard` availability

### Issue: Native share not appearing
**Solution:** Only works on mobile with `navigator.share` support (iOS Safari, Chrome Mobile)

### Issue: Referral stats always zero
**Solution:** Verify `referred_by` column exists and signup flow captures `ref` parameter

## Future Enhancements

1. **Deep Linking**: Open app directly from share links
2. **Open Graph Tags**: Rich previews on Facebook/Twitter
3. **QR Codes**: Generate QR codes for offline sharing
4. **Share Templates**: Let users customize share messages
5. **A/B Testing**: Test different messages for conversion
6. **Email Invites**: Bulk email invitation system
7. **Incentive System**: Rewards for successful referrals

## Conclusion

Social sharing is now fully integrated across PledgeHub. Users can share campaigns, pledges, achievements, and referral links via 8+ channels. Backend tracking enables analytics on share performance and viral growth.

**Next Steps:**
1. Run database migration
2. Test all share channels
3. Monitor share analytics
4. Iterate on message templates
5. Implement incentive system

This feature positions PledgeHub for viral growth and organic user acquisition! 🚀
