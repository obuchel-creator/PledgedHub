/**
 * AI Chatbot Service with WhatsApp Integration
 * 
 * Features:
 * - Google Gemini AI for intelligent responses
 * - WhatsApp Business API via Twilio
 * - Pledge inquiry and payment help
 * - Multilingual support (English, Luganda, Runyankole, Ateso)
 * - Context-aware conversations
 * - Automatic payment initiation
 * - Status checking
 */

const aiService = require('./aiService');
const mobileMoneyService = require('./mobileMoneyService');
const { pool } = require('../config/db');

// Conversation context storage (use Redis in production)
const conversationContexts = new Map();

// Supported languages
const LANGUAGES = {
  en: 'English',
  lg: 'Luganda',
  rny: 'Runyankole',
  ateso: 'Ateso'
};

// Conversation states
const STATES = {
  INITIAL: 'initial',
  AWAITING_PLEDGE_ID: 'awaiting_pledge_id',
  AWAITING_PHONE: 'awaiting_phone',
  AWAITING_AMOUNT: 'awaiting_amount',
  AWAITING_CONFIRMATION: 'awaiting_confirmation'
};

/**
 * Process incoming message from any channel (WhatsApp, SMS, Web)
 */
async function processMessage(userId, message, channel = 'whatsapp') {
  try {
    // Get or create conversation context
    let context = conversationContexts.get(userId) || {
      state: STATES.INITIAL,
      language: 'en',
      pledgeId: null,
      phoneNumber: null,
      amount: null,
      attempts: 0
    };

    // Detect language if in initial state
    if (context.state === STATES.INITIAL) {
      context.language = detectLanguage(message);
    }

    // Process based on intent
    const intent = await detectIntent(message, context);
    const response = await handleIntent(intent, message, context, userId);

    // Update context
    conversationContexts.set(userId, context);

    // Clean up old contexts (older than 1 hour)
    cleanupOldContexts();

    return {
      success: true,
      response: response.text,
      language: context.language,
      actions: response.actions || []
    };

  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      success: false,
      response: getErrorMessage(context?.language || 'en'),
      error: error.message
    };
  }
}

/**
 * Detect user intent using AI
 */
async function detectIntent(message, context) {
  const messageLower = message.toLowerCase().trim();

  // Check for common patterns first (faster than AI)
  if (/^pay\s+\d+/i.test(message)) {
    return { type: 'payment', confidence: 1.0 };
  }
  
  if (/balance|status|check|pledge/i.test(messageLower)) {
    return { type: 'pledge_inquiry', confidence: 0.9 };
  }
  
  if (/help|assist|how/i.test(messageLower)) {
    return { type: 'help', confidence: 0.8 };
  }

  // Use AI for complex intent detection
  if (aiService.isAIAvailable()) {
    try {
      const prompt = `
You are analyzing a message from a pledge management chatbot user. Detect their intent.

User message: "${message}"
Current conversation state: ${context.state}

Possible intents:
1. payment - User wants to make a payment
2. pledge_inquiry - User asking about their pledge status or balance
3. help - User needs help or instructions
4. greeting - User is greeting
5. thanks - User is thanking
6. unclear - Cannot determine intent

Respond with ONLY the intent type and confidence (0-1), format: "intent,confidence"
Example: "payment,0.95"
`;

      const aiResponse = await aiService.generateText(prompt);
      const [type, confidence] = aiResponse.split(',').map(s => s.trim());
      
      return {
        type,
        confidence: parseFloat(confidence) || 0.5
      };
    } catch (error) {
      console.error('AI intent detection error:', error);
    }
  }

  // Fallback: unclear intent
  return { type: 'unclear', confidence: 0.3 };
}

/**
 * Handle different intents
 */
async function handleIntent(intent, message, context, userId) {
  switch (intent.type) {
    case 'payment':
      return await handlePaymentIntent(message, context, userId);
    
    case 'pledge_inquiry':
      return await handlePledgeInquiry(message, context, userId);
    
    case 'help':
      return await handleHelpRequest(context);
    
    case 'greeting':
      return handleGreeting(context);
    
    case 'thanks':
      return handleThanks(context);
    
    default:
      return await handleUnclearIntent(message, context);
  }
}

/**
 * Handle payment intent with conversation flow
 */
async function handlePaymentIntent(message, context, userId) {
  // Parse "PAY 123 256772345678" format
  const payMatch = message.match(/pay\s+(\d+)(?:\s+(256\d{9}))?/i);
  
  if (payMatch) {
    const pledgeId = parseInt(payMatch[1]);
    const phoneNumber = payMatch[2];

    // Get pledge details
    const pledgeResult = await getPledgeDetails(pledgeId, userId);
    if (!pledgeResult.success) {
      return {
        text: translate('pledge_not_found', context.language),
        actions: []
      };
    }

    const pledge = pledgeResult.data;

    // If phone number provided, initiate payment directly
    if (phoneNumber) {
      const paymentResult = await mobileMoneyService.initiatePayment(
        pledgeId,
        phoneNumber,
        pledge.balance || pledge.amount
      );

      if (paymentResult.success) {
        const provider = mobileMoneyService.detectProvider(phoneNumber);
        const ussdCode = provider === 'MTN' ? '*165#' : '*185#';
        
        context.state = STATES.INITIAL; // Reset state
        
        return {
          text: translate('payment_initiated', context.language, {
            amount: pledge.balance || pledge.amount,
            ussdCode,
            reference: paymentResult.reference
          }),
          actions: ['payment_initiated']
        };
      } else {
        return {
          text: translate('payment_failed', context.language),
          actions: []
        };
      }
    } else {
      // Ask for phone number
      context.state = STATES.AWAITING_PHONE;
      context.pledgeId = pledgeId;
      context.amount = pledge.balance || pledge.amount;
      
      return {
        text: translate('ask_phone_number', context.language, {
          pledgeId,
          amount: pledge.balance || pledge.amount
        }),
        actions: []
      };
    }
  }

  // Start payment conversation flow
  if (context.state === STATES.INITIAL) {
    context.state = STATES.AWAITING_PLEDGE_ID;
    return {
      text: translate('ask_pledge_id', context.language),
      actions: []
    };
  }

  if (context.state === STATES.AWAITING_PLEDGE_ID) {
    const pledgeId = parseInt(message.trim());
    if (isNaN(pledgeId)) {
      return {
        text: translate('invalid_pledge_id', context.language),
        actions: []
      };
    }

    const pledgeResult = await getPledgeDetails(pledgeId, userId);
    if (!pledgeResult.success) {
      return {
        text: translate('pledge_not_found', context.language),
        actions: []
      };
    }

    context.pledgeId = pledgeId;
    context.amount = pledgeResult.data.balance || pledgeResult.data.amount;
    context.state = STATES.AWAITING_PHONE;

    return {
      text: translate('ask_phone_number', context.language, {
        pledgeId,
        amount: context.amount
      }),
      actions: []
    };
  }

  if (context.state === STATES.AWAITING_PHONE) {
    const phoneNumber = message.trim().replace(/\s+/g, '');
    
    // Validate phone number
    if (!mobileMoneyService.validatePhoneNumber(phoneNumber)) {
      return {
        text: translate('invalid_phone', context.language),
        actions: []
      };
    }

    // Initiate payment
    const paymentResult = await mobileMoneyService.initiatePayment(
      context.pledgeId,
      phoneNumber,
      context.amount
    );

    if (paymentResult.success) {
      const provider = mobileMoneyService.detectProvider(phoneNumber);
      const ussdCode = provider === 'MTN' ? '*165#' : '*185#';
      
      context.state = STATES.INITIAL; // Reset
      
      return {
        text: translate('payment_initiated', context.language, {
          amount: context.amount,
          ussdCode,
          reference: paymentResult.reference
        }),
        actions: ['payment_initiated']
      };
    } else {
      return {
        text: translate('payment_failed', context.language),
        actions: []
      };
    }
  }

  return {
    text: translate('unclear', context.language),
    actions: []
  };
}

/**
 * Handle pledge inquiry
 */
async function handlePledgeInquiry(message, context, userId) {
  // Extract pledge ID from message
  const pledgeIdMatch = message.match(/\d+/);
  
  if (!pledgeIdMatch) {
    return {
      text: translate('ask_pledge_id_inquiry', context.language),
      actions: []
    };
  }

  const pledgeId = parseInt(pledgeIdMatch[0]);
  const pledgeResult = await getPledgeDetails(pledgeId, userId);

  if (!pledgeResult.success) {
    return {
      text: translate('pledge_not_found', context.language),
      actions: []
    };
  }

  const pledge = pledgeResult.data;
  
  return {
    text: translate('pledge_status', context.language, {
      pledgeId: pledge.id,
      amount: pledge.amount,
      balance: pledge.balance || 0,
      status: pledge.status,
      dueDate: pledge.collection_date
    }),
    actions: ['pledge_inquiry']
  };
}

/**
 * Handle help request with AI-generated response
 */
async function handleHelpRequest(context) {
  if (aiService.isAIAvailable()) {
    try {
      const prompt = `
You are a helpful chatbot for PledgeHub, a pledge management system.

Generate a helpful response in ${LANGUAGES[context.language]} that explains:
1. How to check pledge status (send pledge number)
2. How to make payment (send "PAY [PLEDGE_ID] [PHONE]")
3. Helpline number: 0800-753343

Keep it simple and friendly, maximum 5 sentences.
`;

      const aiResponse = await aiService.generateText(prompt);
      return {
        text: aiResponse,
        actions: ['help']
      };
    } catch (error) {
      console.error('AI help generation error:', error);
    }
  }

  // Fallback help message
  return {
    text: translate('help_message', context.language),
    actions: ['help']
  };
}

/**
 * Handle greeting
 */
function handleGreeting(context) {
  const greetings = {
    en: "Hello! 👋 I'm PledgeHub Bot. I can help you:\n\n1. Check your pledge status\n2. Make payments\n3. Get help\n\nWhat would you like to do?",
    lg: "Oli otya! 👋 Nze PledgeHub Bot. Nsobola okukuyamba:\n\n1. Okukebera pledge yo\n2. Okusasula\n3. Okufuna obuyambi\n\nOyagala kikusoose ki?",
    rny: "Agandi! 👋 Ninyowe PledgeHub Bot. Ninsobora kukugambaho:\n\n1. Okureeba pledge yawe\n2. Okurihira\n3. Okubona obuyambi\n\nOryenda eki?",
    ateso: "Yoga noi! 👋 Arai PledgeHub Bot. Aiyariki:\n\n1. Ilolon pledge yong\n2. Iwari\n3. Iboro ayamb\n\nIdokin nae?"
  };

  return {
    text: greetings[context.language] || greetings.en,
    actions: ['greeting']
  };
}

/**
 * Handle thanks
 */
function handleThanks(context) {
  const thanks = {
    en: "You're welcome! 😊 Is there anything else I can help you with?",
    lg: "Tewali kuzibu! 😊 Waliwo ekirala kye nsobola okukuyamba?",
    rny: "Nikweteraine! 😊 Hariho ekintu ekirara onsobora kukuhandura?",
    ateso: "Pe amam! 😊 Arai ngolokin akanac ngesi aiyariki?"
  };

  return {
    text: thanks[context.language] || thanks.en,
    actions: ['thanks']
  };
}

/**
 * Handle unclear intent with AI
 */
async function handleUnclearIntent(message, context) {
  if (aiService.isAIAvailable()) {
    try {
      const prompt = `
You are a helpful chatbot for PledgeHub pledge management system.

User said: "${message}"
Language: ${LANGUAGES[context.language]}

Generate a helpful response that:
1. Acknowledges their message
2. Offers to help with pledge status or payment
3. Provides helpline: 0800-753343

Keep it friendly and in ${LANGUAGES[context.language]}, maximum 3 sentences.
`;

      const aiResponse = await aiService.generateText(prompt);
      return {
        text: aiResponse,
        actions: ['unclear']
      };
    } catch (error) {
      console.error('AI unclear handling error:', error);
    }
  }

  return {
    text: translate('unclear', context.language),
    actions: ['unclear']
  };
}

/**
 * Get pledge details
 */
async function getPledgeDetails(pledgeId, userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM pledges WHERE id = ? AND deleted = 0`,
      [pledgeId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Pledge not found' };
    }

    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Get pledge error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Detect language from message
 */
function detectLanguage(message) {
  const messageLower = message.toLowerCase();

  // Luganda keywords
  if (/oli otya|webale|nsasuula|pledge/i.test(messageLower)) {
    return 'lg';
  }

  // Runyankole keywords
  if (/agandi|nikweteraine|nkurihira/i.test(messageLower)) {
    return 'rny';
  }

  // Ateso keywords
  if (/yoga|amam|iboro/i.test(messageLower)) {
    return 'ateso';
  }

  // Default to English
  return 'en';
}

/**
 * Translation function
 */
function translate(key, language, params = {}) {
  const translations = {
    pledge_not_found: {
      en: "Sorry, I couldn't find that pledge. Please check the number and try again.",
      lg: "Nsonyiwa, sisobodde kufuna pledge eyo. Kebera namba ozipime nate.",
      rny: "Mbabarira, timpasize kushanga pledge eyo. Reba nimero uzireebe.",
      ateso: "Amarai, mam atapul pledge ane. Loloi numero ka ibore nare."
    },
    ask_pledge_id: {
      en: "Please send me your pledge number.\n\nExample: 123",
      lg: "Mpeereza namba ya pledge yo.\n\nEkyokulabirako: 123",
      rny: "Ntumire nimero ya pledge yawe.\n\nOmugambo: 123",
      ateso: "Atinyokin numero ka pledge yong.\n\nAsidai: 123"
    },
    ask_phone_number: {
      en: `Great! I found your pledge #${params.pledgeId}.\nAmount: UGX ${params.amount}\n\nPlease send your phone number to complete payment.\n\nExample: 256772345678`,
      lg: `Bulungi! Nfunye pledge yo #${params.pledgeId}.\nSsente: UGX ${params.amount}\n\nMpeereza namba ya simu yo okumaliriza okusasula.\n\nEkyokulabirako: 256772345678`,
      rny: `Nikyo kirungi! Naashangi pledge yawe #${params.pledgeId}.\nSente: UGX ${params.amount}\n\nNtumire nimero ya simu yawe kuriiza okurihira.\n\nOmugambo: 256772345678`,
      ateso: `Ejok! Atapu pledge yong #${params.pledgeId}.\nSente: UGX ${params.amount}\n\nAtinyokin numero ka telefon yong bo imali iwari.\n\nAsidai: 256772345678`
    },
    invalid_phone: {
      en: "That phone number doesn't look right. Please use format: 256772345678",
      lg: "Namba ya simu eyo terabika bulungi. Kozesa format: 256772345678",
      rny: "Nimero ya simu yaine teriboneka nkarungi. Koreisa format: 256772345678",
      ateso: "Numero ka telefon yane pe ejok. Idwenya format: 256772345678"
    },
    payment_initiated: {
      en: `✅ Payment request sent!\n\nAmount: UGX ${params.amount}\n\nNext steps:\n1. Dial ${params.ussdCode}\n2. Go to My Approvals\n3. Approve payment\n4. Enter your PIN\n\nReference: ${params.reference}\n\nNeed help? Call 0800-753343`,
      lg: `✅ Okusasula kutumiddwa!\n\nSsente: UGX ${params.amount}\n\nEbiribulirako:\n1. Kuba ${params.ussdCode}\n2. Londa My Approvals\n3. Kakasa okusasula\n4. Yingiza PIN yo\n\nReference: ${params.reference}\n\nOyetaaga obuyambi? Tubira 0800-753343`,
      rny: `✅ Okurihira kwatumirwe!\n\nSente: UGX ${params.amount}\n\nEbikurikira:\n1. Kuba ${params.ussdCode}\n2. Gyenda My Approvals\n3. Kwemera okurihira\n4. Ingiza PIN yawe\n\nReference: ${params.reference}\n\nOrikwetaaga omugasho? Tungira 0800-753343`,
      ateso: `✅ Iwari yakin emamit!\n\nSente: UGX ${params.amount}\n\nAkanac ngesi:\n1. Idweny ${params.ussdCode}\n2. Ilos My Approvals\n3. Ikonik iwari\n4. Itinyin PIN yong\n\nReference: ${params.reference}\n\nIdokin ayamb? Kakan 0800-753343`
    },
    payment_failed: {
      en: "Sorry, payment could not be processed. Please try again or call 0800-753343 for help.",
      lg: "Nsonyiwa, okusasula tekusobodde kukolebwa. Gepima nate oba tubira 0800-753343.",
      rny: "Mbabarira, okurihira tikwashoboreka kukora. Gerezaho nare oba tungira 0800-753343.",
      ateso: "Amarai, iwari pe aikor. Ibore nare nebo kakan 0800-753343."
    },
    pledge_status: {
      en: `📊 Pledge #${params.pledgeId} Status\n\nAmount: UGX ${params.amount}\nBalance: UGX ${params.balance}\nStatus: ${params.status}\nDue Date: ${params.dueDate}\n\nTo pay, send: PAY ${params.pledgeId} [YOUR_PHONE]`,
      lg: `📊 Pledge #${params.pledgeId} Embeera\n\nSsente: UGX ${params.amount}\nEbisigadde: UGX ${params.balance}\nEmbeera: ${params.status}\nOlunaku: ${params.dueDate}\n\nOkusasula, tuma: PAY ${params.pledgeId} [SIMU_YO]`,
      rny: `📊 Pledge #${params.pledgeId} Embeera\n\nSente: UGX ${params.amount}\nEbishagaire: UGX ${params.balance}\nOmutindo: ${params.status}\nEizoba: ${params.dueDate}\n\nOkurihira, tuma: PAY ${params.pledgeId} [SIMU_YAWE]`,
      ateso: `📊 Pledge #${params.pledgeId} Akilokit\n\nSente: UGX ${params.amount}\nElosit: UGX ${params.balance}\nAkilokit: ${params.status}\nAre: ${params.dueDate}\n\nBo iwari, atinyi: PAY ${params.pledgeId} [TELEFON_YONG]`
    },
    help_message: {
      en: "🤖 PledgeHub Bot Help\n\n📱 Check Status:\nSend your pledge number\nExample: 123\n\n💰 Make Payment:\nSend: PAY [ID] [PHONE]\nExample: PAY 123 256772345678\n\n📞 Call Support:\n0800-753343 (FREE)",
      lg: "🤖 Obuyambi bwa PledgeHub Bot\n\n📱 Kebera Embeera:\nTuma namba ya pledge yo\nEky'okulabirako: 123\n\n💰 Sasula:\nTuma: PAY [ID] [SIMU]\nEky'okulabirako: PAY 123 256772345678\n\n📞 Tubira:\n0800-753343 (YA BWEREERE)",
      rny: "🤖 Omugasho gwa PledgeHub Bot\n\n📱 Reeba Embeera:\nTuma nimero ya pledge yawe\nOmugambo: 123\n\n💰 Rihira:\nTuma: PAY [ID] [SIMU]\nOmugambo: PAY 123 256772345678\n\n📞 Tungira:\n0800-753343 (YA BWEREERE)",
      ateso: "🤖 Ayamb ka PledgeHub Bot\n\n📱 Lolo Akilokit:\nAtinyi numero ka pledge yong\nAsidai: 123\n\n💰 Iwari:\nAtinyi: PAY [ID] [TELEFON]\nAsidai: PAY 123 256772345678\n\n📞 Kakan:\n0800-753343 (YABO)"
    },
    unclear: {
      en: "I'm not sure what you mean. I can help you:\n\n1. Check pledge status (send pledge number)\n2. Make payment (send PAY [ID] [PHONE])\n3. Get help (send HELP)\n\nOr call 0800-753343",
      lg: "Sitegeera kye wayogera. Nsobola okukuyamba:\n\n1. Okukebera pledge (tuma namba)\n2. Okusasula (tuma PAY [ID] [SIMU])\n3. Okufuna obuyambi (tuma HELP)\n\nOba tubira 0800-753343",
      rny: "Tinkiteikire kye oyogera. Ninsobora kukugambaho:\n\n1. Okureeba pledge (tuma nimero)\n2. Okurihira (tuma PAY [ID] [SIMU])\n3. Okubona omugasho (tuma HELP)\n\nOba tungira 0800-753343",
      ateso: "Pe ateikin ngolokin inyam. Aiyariki:\n\n1. Ilolon pledge (atinyi numero)\n2. Iwari (atinyi PAY [ID] [TELEFON])\n3. Iboro ayamb (atinyi HELP)\n\nNebo kakan 0800-753343"
    },
    error: {
      en: "Sorry, something went wrong. Please try again or call 0800-753343 for help.",
      lg: "Nsonyiwa, wabaddewo ekizibu. Gepima nate oba tubira 0800-753343.",
      rny: "Mbabarira, hamuraho ekizibu. Gerezaho nare oba tungira 0800-753343.",
      ateso: "Amarai, arai nguna ekiru. Ibore nare nebo kakan 0800-753343."
    }
  };

  const translated = translations[key]?.[language] || translations[key]?.en || key;
  
  // Replace parameters
  return translated.replace(/\${(\w+)}/g, (match, param) => params[param] || match);
}

/**
 * Get error message
 */
function getErrorMessage(language) {
  return translate('error', language);
}

/**
 * Clean up old conversation contexts (older than 1 hour)
 */
function cleanupOldContexts() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [userId, context] of conversationContexts.entries()) {
    if (context.lastUpdate && context.lastUpdate < oneHourAgo) {
      conversationContexts.delete(userId);
    }
  }
}

// Clean up every 10 minutes
setInterval(cleanupOldContexts, 10 * 60 * 1000);

/**
 * Get conversation statistics
 */
function getStatistics() {
  return {
    activeConversations: conversationContexts.size,
    contexts: Array.from(conversationContexts.entries()).map(([userId, context]) => ({
      userId,
      state: context.state,
      language: context.language,
      lastUpdate: context.lastUpdate
    }))
  };
}

module.exports = {
  processMessage,
  getStatistics,
  LANGUAGES,
  STATES
};
