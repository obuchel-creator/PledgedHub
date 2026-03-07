# 🎯 AI Prompt Customization Guide

**Date**: November 6, 2025  
**File**: `backend/services/aiService.js`

---

## 📍 Overview

Your PledgeHub system has **4 main AI prompt types** that you can customize:

1. **Reminder Messages** (Lines 69-85) - SMS reminders for pledges
2. **Data Analysis Insights** (Lines 151-167) - Analytics and recommendations  
3. **Thank You Messages** (Lines 238-254) - Gratitude messages for donors
4. **Collection Suggestions** (Lines 290-306) - Improvement recommendations

---

## 🔧 How to Customize Prompts

### Method 1: Direct Editing (Recommended)
Edit the prompt strings directly in `backend/services/aiService.js`

### Method 2: Environment Variables
Move prompts to `.env` file for easier management

### Method 3: Database Storage
Store prompts in MySQL for dynamic changes (advanced)

---

## 1️⃣ Reminder Message Prompts

**Location**: Lines 69-85 in `generateEnhancedReminderMessage()`

### Current Prompt:
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor. 

Context:
- Donor name: ${donorName}
- Amount pledged: ${amount}
- Purpose: ${purpose}
- Collection date: ${collectionDate}
- Status: ${reminderTypes[type]}

Requirements:
- Language: ${language}
- Tone: ${tone} and respectful
- Maximum length: ${maxLength} characters (SMS friendly)
- ${includeMotivation ? 'Include brief motivation/appreciation' : 'Keep it brief and factual'}
- Use appropriate emojis sparingly
- Do NOT include quotes or extra formatting
- Make it personal and warm

Generate ONLY the message text, nothing else:`;
```

### 🎨 Customization Examples:

#### A) More Religious/Spiritual Tone:
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor with a spiritual/Christian tone. 

Context:
- Donor name: ${donorName}
- Amount pledged: ${amount}
- Purpose: ${purpose}
- Collection date: ${collectionDate}
- Status: ${reminderTypes[type]}

Requirements:
- Language: ${language}
- Tone: ${tone}, respectful, and faith-based
- Maximum length: ${maxLength} characters (SMS friendly)
- Include brief Bible verse or spiritual encouragement
- Use appropriate emojis (🙏✨💒)
- Reference God's blessings or stewardship
- Make it personal and warm

Generate ONLY the message text, nothing else:`;
```

#### B) More Professional/Formal Tone:
```javascript
const prompt = `Generate a ${tone} professional reminder message for a pledge donor.

Context:
- Donor name: ${donorName}
- Amount pledged: ${amount}
- Purpose: ${purpose}
- Collection date: ${collectionDate}
- Status: ${reminderTypes[type]}

Requirements:
- Language: ${language}
- Tone: ${tone}, professional, and courteous
- Maximum length: ${maxLength} characters (SMS friendly)
- Use formal language and structure
- Minimal emojis (maximum 1)
- Include contact information reference
- Clear call-to-action

Generate ONLY the message text, nothing else:`;
```

#### C) Ugandan Cultural Context:
```javascript
const prompt = `Generate a ${tone} SMS reminder message for a pledge donor with Ugandan cultural context.

Context:
- Donor name: ${donorName}
- Amount pledged: ${amount}
- Purpose: ${purpose}
- Collection date: ${collectionDate}
- Status: ${reminderTypes[type]}

Requirements:
- Language: ${language}
- Tone: ${tone}, respectful, and culturally appropriate
- Maximum length: ${maxLength} characters (SMS friendly)
- Use Ugandan greetings and expressions
- Reference community/family values
- Include local context and understanding
- Use appropriate emojis for Uganda 🇺🇬

Generate ONLY the message text, nothing else:`;
```

---

## 2️⃣ Data Analysis Insights Prompts

**Location**: Lines 151-167 in `analyzePledgeData()`

### Current Prompt:
```javascript
const prompt = `Analyze this pledge management data and provide 3-5 actionable insights:

Statistics:
- Total pledges: ${total}
- Total amount: UGX ${totalAmount.toLocaleString()}
- Paid: ${paid} (${total > 0 ? Math.round(paid/total*100) : 0}%)
- Pending: ${pending}
- Overdue: ${overdue}

Provide:
1. Key observations about collection performance
2. Potential risks or concerns
3. Specific actionable recommendations
4. Positive highlights

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`;
```

### 🎨 Customization Examples:

#### A) Financial Focus:
```javascript
const prompt = `Analyze this pledge management data with a focus on financial performance and provide 3-5 insights:

Statistics:
- Total pledges: ${total}
- Total amount: UGX ${totalAmount.toLocaleString()}
- Paid: ${paid} (${total > 0 ? Math.round(paid/total*100) : 0}%)
- Pending: ${pending}
- Overdue: ${overdue}

Provide insights focused on:
1. Cash flow analysis and projections
2. Revenue optimization opportunities
3. Financial risk assessment
4. Budget planning recommendations
5. ROI improvement strategies

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`;
```

#### B) Donor Relationship Focus:
```javascript
const prompt = `Analyze this pledge management data with focus on donor relationships and provide 3-5 insights:

Statistics:
- Total pledges: ${total}
- Total amount: UGX ${totalAmount.toLocaleString()}
- Paid: ${paid} (${total > 0 ? Math.round(paid/total*100) : 0}%)
- Pending: ${pending}
- Overdue: ${overdue}

Provide insights focused on:
1. Donor engagement and satisfaction
2. Communication effectiveness
3. Relationship building opportunities
4. Retention strategies
5. Community building initiatives

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`;
```

---

## 3️⃣ Thank You Message Prompts

**Location**: Lines 238-254 in `generateThankYouMessage()`

### Current Prompt:
```javascript
const prompt = `Generate a ${tone} thank you message for a donor who just fulfilled their pledge.

Context:
- Donor name: ${donorName}
- Amount: ${amount}
- Purpose: ${purpose}

Requirements:
- Tone: ${tone}, sincere, and appreciative
- Maximum 200 characters (SMS friendly)
- ${includeImpact ? 'Briefly mention the positive impact' : 'Keep focused on gratitude'}
- Use 1-2 appropriate emojis
- Make it personal and heartfelt
- Do NOT include quotes

Generate ONLY the message text:`;
```

### 🎨 Customization Examples:

#### A) Impact-Focused:
```javascript
const prompt = `Generate a ${tone} thank you message emphasizing the impact of the donor's contribution.

Context:
- Donor name: ${donorName}
- Amount: ${amount}
- Purpose: ${purpose}

Requirements:
- Tone: ${tone}, sincere, and impact-focused
- Maximum 200 characters (SMS friendly)
- Highlight specific impact or change enabled
- Show how their contribution makes a difference
- Use emojis that represent positive change ✨🌟💫
- Make it personal and inspiring

Generate ONLY the message text:`;
```

#### B) Community-Focused:
```javascript
const prompt = `Generate a ${tone} thank you message emphasizing community and togetherness.

Context:
- Donor name: ${donorName}
- Amount: ${amount}
- Purpose: ${purpose}

Requirements:
- Tone: ${tone}, warm, and community-focused
- Maximum 200 characters (SMS friendly)
- Emphasize being part of a larger mission
- Reference community, family, or togetherness
- Use emojis that represent unity 🤝💙👥
- Make it personal and inclusive

Generate ONLY the message text:`;
```

---

## 4️⃣ Collection Suggestions Prompts

**Location**: Lines 290-306 in `getSuggestions()`

### Current Prompt:
```javascript
const prompt = `Based on these pledge management statistics, provide 3-5 specific, actionable suggestions to improve collection rates:

Stats:
- Collection rate: ${stats.collectionRate || 0}%
- Overdue pledges: ${stats.overdue || 0}
- Pending pledges: ${stats.pending || 0}
- Total amount pending: UGX ${(stats.pendingAmount || 0).toLocaleString()}

Provide practical suggestions that can be implemented immediately.

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`;
```

### 🎨 Customization Examples:

#### A) Technology-Focused:
```javascript
const prompt = `Based on these pledge management statistics, provide 3-5 technology-focused suggestions to improve collection rates:

Stats:
- Collection rate: ${stats.collectionRate || 0}%
- Overdue pledges: ${stats.overdue || 0}
- Pending pledges: ${stats.pending || 0}
- Total amount pending: UGX ${(stats.pendingAmount || 0).toLocaleString()}

Focus on digital solutions:
1. Mobile payment integration
2. Automated reminder systems
3. Online donation platforms
4. SMS/WhatsApp automation
5. Digital receipt systems

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`;
```

#### B) Relationship-Focused:
```javascript
const prompt = `Based on these pledge management statistics, provide 3-5 relationship-focused suggestions to improve collection rates:

Stats:
- Collection rate: ${stats.collectionRate || 0}%
- Overdue pledges: ${stats.overdue || 0}
- Pending pledges: ${stats.pending || 0}
- Total amount pending: UGX ${(stats.pendingAmount || 0).toLocaleString()}

Focus on personal connection strategies:
1. Personal communication approaches
2. Donor appreciation events
3. Regular updates and transparency
4. Community building activities
5. Recognition and acknowledgment

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`;
```

---

## 🛠️ Implementation Methods

### Method 1: Direct File Editing

**Steps**:
1. Open `backend/services/aiService.js`
2. Find the prompt you want to customize
3. Replace the prompt string with your custom version
4. Save the file
5. Restart the backend server

**Example**:
```bash
cd C:\Users\HP\pledgehub\backend
# Edit the file
npm run dev  # Restart server
```

---

### Method 2: Environment Variables (Advanced)

**Step 1**: Move prompts to `.env` file:
```env
# Custom AI Prompts
REMINDER_PROMPT_TEMPLATE="Generate a {tone} SMS reminder with Ugandan cultural context..."
ANALYSIS_PROMPT_TEMPLATE="Analyze pledge data focusing on financial performance..."
THANKYOU_PROMPT_TEMPLATE="Generate an impact-focused thank you message..."
SUGGESTIONS_PROMPT_TEMPLATE="Provide technology-focused collection suggestions..."
```

**Step 2**: Update `aiService.js` to use environment variables:
```javascript
const prompt = process.env.REMINDER_PROMPT_TEMPLATE
    .replace('{tone}', tone)
    .replace('{donorName}', donorName)
    // ... other replacements
```

---

### Method 3: Database Storage (Expert Level)

**Step 1**: Create prompts table:
```sql
CREATE TABLE ai_prompts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('reminder', 'analysis', 'thankyou', 'suggestions') NOT NULL,
    name VARCHAR(50) NOT NULL,
    template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 2**: Load prompts dynamically:
```javascript
async function getPromptTemplate(type, name = 'default') {
    const [rows] = await db.execute(
        'SELECT template FROM ai_prompts WHERE type = ? AND name = ? AND is_active = TRUE',
        [type, name]
    );
    return rows[0]?.template || getDefaultPrompt(type);
}
```

---

## 🎯 Quick Customization Examples

### Example 1: Make Reminders More Urgent

**Find** (Line ~77):
```javascript
- Tone: ${tone} and respectful
```

**Replace with**:
```javascript
- Tone: ${tone}, respectful, and urgent (emphasize time sensitivity)
```

**Test**:
```bash
cd C:\Users\HP\pledgehub\backend
node -e "
require('dotenv').config();
const ai = require('./services/aiService');
ai.generateEnhancedReminderMessage({
    donor_name: 'John Doe',
    amount: 50000,
    purpose: 'Church Building',
    collection_date: new Date()
}, 'overdue', {tone: 'urgent'}).then(console.log);
"
```

---

### Example 2: Add Luganda Language Support

**Find** (Line ~75):
```javascript
- Language: ${language}
```

**Replace with**:
```javascript
- Language: ${language} (if Luganda, include local greetings like 'Oli otya' and cultural phrases)
```

**Test**:
```bash
cd C:\Users\HP\pledgehub\backend
node -e "
require('dotenv').config();
const ai = require('./services/aiService');
ai.generateEnhancedReminderMessage({
    donor_name: 'Nakato Maria',
    amount: 100000,
    purpose: 'Church Building',
    collection_date: new Date()
}, '7_days', {language: 'Luganda', tone: 'friendly'}).then(console.log);
"
```

---

### Example 3: Add Organization Branding

**Find** (Line ~83):
```javascript
- Make it personal and warm
```

**Replace with**:
```javascript
- Make it personal and warm
- Include organization name 'PledgeHub' subtly
- Reference community values and mission
```

---

## 🔄 Testing Your Customizations

### Method 1: Direct Function Test
```bash
cd C:\Users\HP\pledgehub\backend
node -e "
require('dotenv').config();
const ai = require('./services/aiService');

// Test reminder message
ai.generateEnhancedReminderMessage({
    donor_name: 'Test User',
    amount: 75000,
    purpose: 'Community Project',
    collection_date: new Date()
}, '3_days', {tone: 'friendly'}).then(result => {
    console.log('Reminder:', result);
});

// Test thank you message
ai.generateThankYouMessage({
    donor_name: 'Test User',
    amount: 75000,
    purpose: 'Community Project'
}, {tone: 'warm'}).then(result => {
    console.log('Thank You:', result);
});
"
```

### Method 2: API Endpoint Test
```bash
# Start server first
cd C:\Users\HP\pledgehub\backend
npm run dev

# In another terminal, test API
curl -X POST "http://localhost:5001/api/ai/test" \
  -H "Content-Type: application/json" \
  -d "{}"
```

### Method 3: Frontend Test
1. Open http://localhost:5173/dashboard
2. Click the AI chatbot (🤖 button)
3. Type: "Generate a reminder message"
4. See your customized AI response

---

## 📋 Customization Checklist

**Before Customizing**:
- [ ] Backup original `aiService.js` file
- [ ] Test current prompts work correctly
- [ ] Understand the prompt structure

**During Customization**:
- [ ] Keep required format specifications
- [ ] Maintain JSON structure where needed
- [ ] Test with sample data
- [ ] Verify character limits (SMS = 160 chars)

**After Customization**:
- [ ] Test all 4 prompt types
- [ ] Restart backend server
- [ ] Verify no syntax errors
- [ ] Test via frontend chatbot
- [ ] Check API responses

---

## 🚨 Common Pitfalls

### 1. JSON Format Errors
**Problem**: Analysis and suggestions prompts must return valid JSON
**Solution**: Always end with "Return ONLY valid JSON, no other text:"

### 2. Character Limits
**Problem**: SMS messages exceed 160 characters
**Solution**: Add strict character limit instructions

### 3. Quote Handling
**Problem**: AI returns messages with quotes around them
**Solution**: The system automatically removes quotes with `.replace(/^["']|["']$/g, '')`

### 4. Variable Substitution
**Problem**: Template variables not being replaced
**Solution**: Ensure all `${variable}` references are correct

---

## 🎉 Advanced Customization Ideas

### 1. Seasonal Messages
Add current date logic to include seasonal greetings:
```javascript
const currentMonth = new Date().getMonth();
const seasonalNote = currentMonth === 11 ? 'during this Christmas season' : '';
// Include ${seasonalNote} in prompt
```

### 2. Donor History Context
Include donor's payment history in prompts:
```javascript
const donorHistory = await getDonorHistory(donorName);
const prompt = `... considering donor's history: ${donorHistory.summary} ...`;
```

### 3. Multiple Language Templates
Create language-specific prompt variations:
```javascript
const prompts = {
    'English': 'Generate a professional reminder...',
    'Luganda': 'Generate a culturally appropriate reminder in Luganda...',
    'Swahili': 'Generate a respectful reminder in Swahili...'
};
```

### 4. Dynamic Tone Adjustment
Adjust tone based on overdue status:
```javascript
const urgencyTone = pledge.days_overdue > 30 ? 'firm but respectful' : 'gentle and encouraging';
```

---

## 📞 Support

**Need Help?**
- Check `backend/scripts/test-ai.js` for testing examples
- Review `docs/API_DOCUMENTATION.md` for API details  
- See `docs/TROUBLESHOOTING.md` for common issues

**File Locations**:
- Main AI Service: `backend/services/aiService.js`
- AI Routes: `backend/routes/aiRoutes.js`
- Test Scripts: `backend/scripts/test-ai.js`

---

**Last Updated**: November 6, 2025  
**Version**: 1.0  
**Status**: Production Ready
