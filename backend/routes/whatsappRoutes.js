/**
 * WhatsApp Integration Routes
 * 
 * Integrates with WhatsApp Business API via Twilio
 * Handles incoming messages and sends responses
 */

const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const whatsappEnabled = process.env.TWILIO_WHATSAPP_ENABLED === 'true';

let twilioClient = null;

if (whatsappEnabled && accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ WhatsApp integration enabled');
} else {
  console.log('⚠️ WhatsApp integration disabled (missing credentials or disabled in config)');
}

/**
 * @route POST /api/whatsapp/webhook
 * @desc Receive incoming WhatsApp messages from Twilio
 * @access Public (Twilio webhook)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;

    // Log incoming message
    console.log('📱 WhatsApp message received:', {
      from: From,
      name: ProfileName,
      body: Body
    });

    // Extract user ID (phone number without "whatsapp:" prefix)
    const userId = From.replace('whatsapp:', '');

    // Process message with chatbot
    const response = await chatbotService.processMessage(userId, Body, 'whatsapp');

    // Send response back via WhatsApp
    if (twilioClient && response.success) {
      await sendWhatsAppMessage(From, response.response);
    }

    // Respond to Twilio with TwiML (required)
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(response.response)}</Message>
</Response>`);

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    
    // Send error message to user
    const errorMsg = "Sorry, something went wrong. Please try again or call 0800-753343 for help.";
    
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(errorMsg)}</Message>
</Response>`);
  }
});

/**
 * @route GET /api/whatsapp/webhook
 * @desc Webhook verification (Twilio requirement)
 * @access Public
 */
router.get('/webhook', (req, res) => {
  res.status(200).send('WhatsApp webhook is active');
});

/**
 * @route POST /api/whatsapp/send
 * @desc Send WhatsApp message (for admin use)
 * @access Private (requires authentication)
 */
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp integration is not configured'
      });
    }

    // Format phone number with whatsapp: prefix
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Send message
    const result = await twilioClient.messages.create({
      from: whatsappNumber,
      to: whatsappTo,
      body: message
    });

    res.json({
      success: true,
      messageId: result.sid,
      status: result.status
    });

  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/whatsapp/status
 * @desc Get WhatsApp integration status
 * @access Public
 */
router.get('/status', (req, res) => {
  const stats = chatbotService.getStatistics();
  
  res.json({
    success: true,
    whatsappEnabled: whatsappEnabled && twilioClient !== null,
    whatsappNumber: whatsappNumber,
    chatbotStats: stats,
    configuration: {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasWhatsappNumber: !!whatsappNumber
    }
  });
});

/**
 * @route POST /api/whatsapp/broadcast
 * @desc Send broadcast message to multiple users
 * @access Private (requires admin authentication)
 */
router.post('/broadcast', async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phone numbers array is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp integration is not configured'
      });
    }

    // Send to all numbers
    const results = await Promise.allSettled(
      phoneNumbers.map(async (phoneNumber) => {
        const whatsappTo = phoneNumber.startsWith('whatsapp:') 
          ? phoneNumber 
          : `whatsapp:${phoneNumber}`;
        
        return await twilioClient.messages.create({
          from: whatsappNumber,
          to: whatsappTo,
          body: message
        });
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      total: phoneNumbers.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        phoneNumber: phoneNumbers[i],
        status: r.status,
        messageId: r.status === 'fulfilled' ? r.value.sid : null,
        error: r.status === 'rejected' ? r.reason.message : null
      }))
    });

  } catch (error) {
    console.error('WhatsApp broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message) {
  if (!twilioClient) {
    console.error('Cannot send WhatsApp message: Twilio client not initialized');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      from: whatsappNumber,
      to: to,
      body: message
    });

    console.log('✅ WhatsApp message sent:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Escape XML for TwiML
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
