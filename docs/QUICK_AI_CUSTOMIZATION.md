# 🎯 Quick AI Prompt Customization Guide

**Your System**: PledgeHub Management  
**Date**: November 6, 2025  
**Status**: ✅ AI Fully Functional with Google Gemini Pro

---

## 🚀 TL;DR - How to Customize AI Prompts

### Step 1: Choose Your Customization Method

**Method A: Direct Editing (Easiest)**
- Edit prompts directly in `backend/services/aiService.js`
- Changes take effect after server restart

**Method B: Configuration System (Recommended)**
- Use the new `backend/config/promptConfig.js` system
- Switch between different prompt styles easily
- Better organization and testing

**Method C: Environment Variables (Advanced)**
- Store prompts in `.env` file for easy deployment changes

---

## 🛠️ Method A: Direct Editing (5 Minutes)

### 1. Find the Prompt You Want to Change

Open `backend/services/aiService.js` and locate these prompt sections:

**Reminder Messages** (Line ~69):
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor...`
```

**Thank You Messages** (Line ~238):
```javascript
const prompt = `Generate a ${tone} thank you message for a donor...`
```

**Data Analysis** (Line ~151):
```javascript
const prompt = `Analyze this pledge management data...`
```

**Suggestions** (Line ~290):
```javascript
const prompt = `Based on these pledge management statistics...`
```

### 2. Edit the Prompt Text

**Example - Make Reminders More Ugandan:**

**BEFORE:**
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor. 

Requirements:
- Language: ${language}
- Tone: ${tone} and respectful
- Use appropriate emojis sparingly
- Make it personal and warm`
```

**AFTER:**
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor with Ugandan cultural context. 

Requirements:
- Language: ${language} (if Luganda, use greetings like 'Oli otya' or 'Webale nyo')
- Tone: ${tone}, respectful, and culturally appropriate for Uganda
- Use appropriate emojis (🙏 for respect, 💙 for unity, 🇺🇬 for pride)
- Reference community/family values and collective mission
- Include subtle mention of 'PledgeHub' (community-focused fundraising) values
- Make it personal and warm`
```

### 3. Test Your Changes

```bash
cd C:\Users\HP\pledgehub\backend
npm run dev  # Restart server
node scripts/quick-ai-test.js  # Test AI functionality
```

---

## 🎨 Method B: Configuration System (Recommended)

### 1. Available Configurations

You now have these ready-to-use configurations in `backend/config/promptConfig.js`:

**REMINDER MESSAGES:**
- `default` - Standard friendly reminder
- `ugandan_cultural` - Ugandan context with community values
- `religious` - Faith-based with spiritual encouragement
- `professional` - Formal business-like tone

**THANK YOU MESSAGES:**
- `default` - General appreciation
- `community_focused` - Community-focused with PledgeHub values
- `impact_focused` - Emphasizes donation impact

**ANALYSIS:**
- `default` - General performance insights
- `financial_focus` - Revenue and cash flow analysis
- `donor_relationship` - Engagement and retention focus

**SUGGESTIONS:**
- `default` - General improvement suggestions
- `technology_focus` - Digital solutions and automation
- `community_focus` - Relationship building strategies

### 2. How to Use Configurations

**In Your Routes/Controllers:**
```javascript
// Standard reminder
const message = await aiService.generateEnhancedReminderMessage(pledge, '7_days', {
    tone: 'friendly'
});

// Ugandan cultural reminder
const message = await aiService.generateEnhancedReminderMessage(pledge, '7_days', {
    tone: 'friendly',
    promptConfig: 'ugandan_cultural'  // <-- Add this!
});

// Religious thank you
const message = await aiService.generateThankYouMessage(pledge, {
    tone: 'warm',
    promptConfig: 'religious'  // <-- Add this!
});

// Financial analysis
const insights = await aiService.analyzePledgeData(pledges, {
    promptConfig: 'financial_focus'  // <-- Add this!
});
```

### 3. Add Your Own Configuration

**Step 1**: Edit `backend/config/promptConfig.js`

**Step 2**: Add new configuration:
```javascript
reminder: {
    // ... existing configurations ...
    
    my_custom: {
        template: `Generate a {tone} SMS reminder with your custom requirements...
        
Requirements:
- Your custom requirement 1
- Your custom requirement 2
- etc.

Generate ONLY the message text:`,
        name: 'My Custom Style'
    }
}
```

**Step 3**: Test it:
```javascript
const message = await aiService.generateEnhancedReminderMessage(pledge, '7_days', {
    tone: 'friendly',
    promptConfig: 'my_custom'
});
```

---

## 📋 Quick Customization Examples

### Example 1: More Urgent Reminders

**File**: `backend/services/aiService.js`  
**Find** (Line ~77): `- Tone: ${tone} and respectful`  
**Replace**: `- Tone: ${tone}, respectful, and urgent (emphasize time sensitivity)`

### Example 2: Include Organization Name

**Find**: `- Make it personal and warm`  
**Replace**: 
```javascript
- Make it personal and warm
- Include organization name 'PledgeHub' subtly
- Reference community mission
```

### Example 3: Add Phone Number

**Find**: `Generate ONLY the message text, nothing else:`  
**Replace**: 
```javascript
- Include contact number if urgent
Generate ONLY the message text, nothing else:
```

### Example 4: Seasonal Messages

**Add this before the prompt:**
```javascript
const currentMonth = new Date().getMonth();
const seasonalNote = currentMonth === 11 ? 'during this Christmas season' : '';
```

**Then in requirements:**
```javascript
- ${seasonalNote ? 'Include seasonal greetings: ' + seasonalNote : 'Keep timing neutral'}
```

---

## 🧪 Testing Your Customizations

### Method 1: Quick API Test
```bash
cd C:\Users\HP\pledgehub\backend
node scripts/quick-ai-test.js
```

### Method 2: Full Configuration Test
```bash
node scripts/test-enhanced-ai.js
```

### Method 3: Live Frontend Test
1. Start servers: `npm run dev` (backend) and `npm run dev` (frontend)
2. Open http://localhost:5173/dashboard
3. Click AI chatbot (🤖 button)
4. Type: "Generate a reminder message"

### Method 4: API Endpoint Test
```bash
# Test reminder generation
curl -X POST "http://localhost:5001/api/ai/enhance-message" \
  -H "Content-Type: application/json" \
  -d '{"pledgeId": 1, "type": "7_days", "tone": "friendly"}'
```

---

## 🌍 Language Support Examples

### Add Luganda Support

**In reminder prompt, change:**
```javascript
- Language: ${language}
```

**To:**
```javascript
- Language: ${language} (if Luganda, use appropriate greetings like 'Oli otya', 'Webale nyo', 'Tukwagala')
```

### Add French Support

**Add to requirements:**
```javascript
- If language is French, use formal 'vous' form and appropriate cultural context
```

### Add Multiple Language Fallback

**Add this logic:**
```javascript
const languageInstructions = {
    'Luganda': 'Use Luganda greetings like "Oli otya" and cultural phrases',
    'French': 'Use formal French with "vous" and appropriate expressions',
    'Swahili': 'Use respectful Swahili greetings like "Hujambo" and "Asante"'
};

const langInstruction = languageInstructions[language] || 'Use clear, respectful English';
```

---

## 🎯 Common Customization Scenarios

### 1. Church/Religious Context
```javascript
Requirements:
- Include subtle biblical reference or encouragement
- Use faith-based language: blessings, stewardship, faithfulness
- Emojis: 🙏✨💒❤️
- Reference God's provision and community worship
```

### 2. School/Educational Context
```javascript
Requirements:
- Reference education benefits and student impact
- Use encouraging, future-focused language
- Emojis: 📚🎓✨💡
- Mention building better futures for children
```

### 3. Healthcare/Medical Context
```javascript
Requirements:
- Emphasize life-saving impact and health benefits
- Use compassionate, caring language
- Emojis: ❤️🏥✨🙏
- Reference community health and wellbeing
```

### 4. Emergency/Urgent Context
```javascript
Requirements:
- Use urgent but respectful tone
- Emphasize time sensitivity and critical need
- Emojis: ⚠️🚨⏰
- Include specific deadlines and consequences
```

---

## 📱 SMS vs Email Customization

### SMS Messages (160 characters)
```javascript
Requirements:
- Maximum length: 160 characters (SMS friendly)
- Use abbreviations where appropriate (UGX, etc.)
- Minimal emojis (max 2)
- Clear call-to-action
```

### Email Messages (Longer format)
```javascript
Requirements:
- Maximum length: 500 characters (email friendly)
- Use full words and proper formatting
- Include more context and background
- Can include multiple paragraphs
```

---

## 🔧 Advanced Customization

### 1. Dynamic Tone Based on Status
```javascript
const urgencyTone = pledge.days_overdue > 30 ? 'firm but respectful' : 'gentle and encouraging';
// Use urgencyTone in prompt
```

### 2. Donor History Context
```javascript
const donorHistory = await getDonorHistory(pledge.donor_name);
const historyContext = donorHistory.isFirstTime ? 'first-time donor' : 'returning supporter';
// Include historyContext in prompt
```

### 3. Amount-Based Messaging
```javascript
const amountLevel = pledge.amount > 100000 ? 'major' : pledge.amount > 50000 ? 'significant' : 'valued';
// Adjust tone based on amountLevel
```

### 4. Seasonal Adjustments
```javascript
const currentDate = new Date();
const isChristmas = currentDate.getMonth() === 11;
const isEaster = /* Easter logic */;
const seasonalContext = isChristmas ? 'Christmas season' : isEaster ? 'Easter season' : '';
```

---

## 🚨 Important Notes

### Character Limits
- **SMS**: 160 characters maximum
- **WhatsApp**: 4096 characters maximum  
- **Email**: No strict limit, but keep under 500 for readability

### Emoji Guidelines
- **SMS**: Maximum 2 emojis
- **WhatsApp/Email**: More flexible
- **Cultural**: Use appropriate emojis for Uganda (🇺🇬🙏💙)

### Language Considerations
- **English**: Standard professional tone
- **Luganda**: Use cultural greetings and expressions
- **Mixed**: Start with local greeting, continue in English

### Testing Requirements
- Always test with sample data first
- Check character limits
- Verify emojis display correctly
- Test with different donor names/amounts

---

## 📞 Quick Reference Commands

```bash
# Navigate to backend
cd C:\Users\HP\pledgehub\backend

# Test AI status
node -e "require('dotenv').config(); const ai = require('./services/aiService'); console.log('AI Available:', ai.isAIAvailable());"

# Test prompt configurations
node scripts/test-prompt-configs.js

# Test enhanced AI service  
node scripts/test-enhanced-ai.js

# Restart server after changes
npm run dev

# Test via frontend
# Open: http://localhost:5173/dashboard
# Click AI chatbot button (🤖)
```

---

## 📚 Files to Know

- **Main AI Service**: `backend/services/aiService.js`
- **Prompt Configurations**: `backend/config/promptConfig.js`
- **Enhanced AI Service**: `backend/services/aiServiceEnhanced.js`
- **AI Routes**: `backend/routes/aiRoutes.js`
- **Test Scripts**: `backend/scripts/test-*.js`
- **Documentation**: `docs/AI_PROMPT_CUSTOMIZATION_GUIDE.md`

---

**Need Help?** Check the full documentation in `docs/AI_PROMPT_CUSTOMIZATION_GUIDE.md` or run the test scripts to see examples in action!

**Last Updated**: November 6, 2025  
**Status**: ✅ Production Ready
