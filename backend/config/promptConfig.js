/**
 * AI Prompt Configuration System
 * Easy-to-customize prompts for different contexts and audiences
 */

const PROMPT_CONFIGURATIONS = {
    // === REMINDER MESSAGE PROMPTS ===
    reminder: {
        default: {
            template: `Generate a {tone} SMS reminder message for a pledge donor. 

Context:
- Donor name: {donorName}
- Amount pledged: {amount}
- Purpose: {purpose}
- Collection date: {collectionDate}
- Status: {status}

Requirements:
- Language: {language}
- Tone: {tone} and respectful
- Maximum length: {maxLength} characters (SMS friendly)
- {motivationInstruction}
- Use appropriate emojis sparingly
- Do NOT include quotes or extra formatting
- Make it personal and warm

Generate ONLY the message text, nothing else:`,
            name: 'Standard Reminder'
        },

        ugandan_cultural: {
            template: `Generate a {tone} SMS reminder message for a pledge donor with Ugandan cultural context.

Context:
- Donor name: {donorName}
- Amount pledged: {amount}
- Purpose: {purpose}
- Collection date: {collectionDate}
- Status: {status}

Requirements:
- Language: {language} (if Luganda, use greetings like 'Oli otya' or 'Webale nyo')
- Tone: {tone}, respectful, and culturally appropriate for Uganda
- Maximum length: {maxLength} characters (SMS friendly)
- {motivationInstruction}
- Use appropriate emojis (🙏 for respect, 💙 for unity, 🇺🇬 for pride)
- Reference community/family values and collective mission
- Include subtle mention of 'PledgedHub' (friendship/unity) values
- Make it personal and warm

Generate ONLY the message text, nothing else:`,
            name: 'Ugandan Cultural'
        },

        religious: {
            template: `Generate a {tone} SMS reminder message for a pledge donor with Christian/spiritual context.

Context:
- Donor name: {donorName}
- Amount pledged: {amount}
- Purpose: {purpose}
- Collection date: {collectionDate}
- Status: {status}

Requirements:
- Language: {language}
- Tone: {tone}, respectful, and faith-based
- Maximum length: {maxLength} characters (SMS friendly)
- {motivationInstruction}
- Include brief spiritual encouragement or Bible reference
- Use appropriate emojis (🙏✨💒 for faith, ❤️ for love)
- Reference stewardship, blessings, or God's provision
- Make it personal and spiritually uplifting

Generate ONLY the message text, nothing else:`,
            name: 'Religious/Spiritual'
        },

        professional: {
            template: `Generate a {tone} professional reminder message for a pledge donor.

Context:
- Donor name: {donorName}
- Amount pledged: {amount}
- Purpose: {purpose}
- Collection date: {collectionDate}
- Status: {status}

Requirements:
- Language: {language}
- Tone: {tone}, professional, and courteous
- Maximum length: {maxLength} characters (SMS friendly)
- Use formal language and structure
- Minimal emojis (maximum 1)
- Include organization name and contact reference
- Clear call-to-action and next steps

Generate ONLY the message text, nothing else:`,
            name: 'Professional/Formal'
        }
    },

    // === THANK YOU MESSAGE PROMPTS ===
    thankYou: {
        default: {
            template: `Generate a {tone} thank you message for a donor who just fulfilled their pledge.

Context:
- Donor name: {donorName}
- Amount: {amount}
- Purpose: {purpose}

Requirements:
- Tone: {tone}, sincere, and appreciative
- Maximum 200 characters (SMS friendly)
- {impactInstruction}
- Use 1-2 appropriate emojis
- Make it personal and heartfelt
- Do NOT include quotes

Generate ONLY the message text:`,
            name: 'Standard Thank You'
        },

        ugandan_cultural: {
            template: `Generate a {tone} thank you message with Ugandan cultural warmth and community values.

Context:
- Donor name: {donorName}
- Amount: {amount}
- Purpose: {purpose}

Requirements:
- Tone: {tone}, sincere, appreciative, and culturally warm
- Maximum 200 characters (SMS friendly)
- {impactInstruction}
- Use appropriate emojis (🙏 for gratitude, 💙 for community love)
- Reference community spirit, unity, or collective mission
- Include subtle reference to 'PledgedHub' (friendship/unity) values
- Make it personal, heartfelt, and community-focused

Generate ONLY the message text:`,
            name: 'Ugandan Cultural'
        },

        impact_focused: {
            template: `Generate a {tone} thank you message emphasizing the impact of the donor's contribution.

Context:
- Donor name: {donorName}
- Amount: {amount}
- Purpose: {purpose}

Requirements:
- Tone: {tone}, sincere, and impact-focused
- Maximum 200 characters (SMS friendly)
- Highlight specific impact or change enabled by their contribution
- Show how their donation makes a measurable difference
- Use emojis that represent positive change (✨🌟💫🎯)
- Make it personal and inspiring
- Include forward-looking vision

Generate ONLY the message text:`,
            name: 'Impact-Focused'
        }
    },

    // === ANALYSIS PROMPTS ===
    analysis: {
        default: {
            template: `Analyze this pledge management data and provide 3-5 actionable insights:

Statistics:
- Total pledges: {total}
- Total amount: UGX {totalAmount}
- Paid: {paid} ({collectionRate}%)
- Pending: {pending}
- Overdue: {overdue}

Provide:
1. Key observations about collection performance
2. Potential risks or concerns
3. Specific actionable recommendations
4. Positive highlights

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`,
            name: 'Standard Analysis'
        },

        financial_focus: {
            template: `Analyze this pledge management data with focus on financial performance and provide 3-5 insights:

Statistics:
- Total pledges: {total}
- Total amount: UGX {totalAmount}
- Paid: {paid} ({collectionRate}%)
- Pending: {pending}
- Overdue: {overdue}

Focus on:
1. Cash flow analysis and projections
2. Revenue optimization opportunities
3. Financial risk assessment and mitigation
4. Budget planning recommendations
5. ROI improvement strategies

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`,
            name: 'Financial Focus'
        },

        donor_relationship: {
            template: `Analyze this pledge management data with focus on donor relationships and provide 3-5 insights:

Statistics:
- Total pledges: {total}
- Total amount: UGX {totalAmount}
- Paid: {paid} ({collectionRate}%)
- Pending: {pending}
- Overdue: {overdue}

Focus on:
1. Donor engagement and satisfaction patterns
2. Communication effectiveness assessment
3. Relationship building opportunities
4. Retention and loyalty strategies
5. Community building initiatives

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`,
            name: 'Donor Relationship Focus'
        }
    },

    // === SUGGESTION PROMPTS ===
    suggestions: {
        default: {
            template: `Based on these pledge management statistics, provide 3-5 specific, actionable suggestions to improve collection rates:

Stats:
- Collection rate: {collectionRate}%
- Overdue pledges: {overdue}
- Pending pledges: {pending}
- Total amount pending: UGX {pendingAmount}

Provide practical suggestions that can be implemented immediately.

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`,
            name: 'General Suggestions'
        },

        technology_focus: {
            template: `Based on these pledge management statistics, provide 3-5 technology-focused suggestions to improve collection rates:

Stats:
- Collection rate: {collectionRate}%
- Overdue pledges: {overdue}
- Pending pledges: {pending}
- Total amount pending: UGX {pendingAmount}

Focus on digital solutions:
1. Mobile payment integration (mobile money, etc.)
2. Automated reminder and follow-up systems
3. Online donation platforms and portals
4. SMS/WhatsApp automation tools
5. Digital receipt and tracking systems

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`,
            name: 'Technology Solutions'
        },

        community_focus: {
            template: `Based on these pledge management statistics, provide 3-5 community-focused suggestions to improve collection rates:

Stats:
- Collection rate: {collectionRate}%
- Overdue pledges: {overdue}
- Pending pledges: {pending}
- Total amount pending: UGX {pendingAmount}

Focus on community engagement strategies:
1. Personal communication and relationship building
2. Donor appreciation events and recognition
3. Regular updates and transparency initiatives
4. Community building and involvement activities
5. Peer-to-peer encouragement systems

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`,
            name: 'Community Engagement'
        }
    }
};

/**
 * Configuration Manager Functions
 */

/**
 * Get available prompt configurations for a type
 * @param {string} type - Type of prompt (reminder, thankYou, analysis, suggestions)
 * @returns {Object} Available configurations
 */
function getAvailableConfigurations(type) {
    return PROMPT_CONFIGURATIONS[type] || {};
}

/**
 * Get a specific prompt template
 * @param {string} type - Type of prompt
 * @param {string} config - Configuration name (default, ugandan_cultural, etc.)
 * @returns {string} Prompt template
 */
function getPromptTemplate(type, config = 'default') {
    const configs = PROMPT_CONFIGURATIONS[type];
    if (!configs || !configs[config]) {
        console.warn(`Prompt configuration not found: ${type}.${config}, using default`);
        return configs?.default?.template || '';
    }
    return configs[config].template;
}

/**
 * Replace template variables in prompt
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} variables - Object with variable values
 * @returns {string} Processed prompt
 */
function processPromptTemplate(template, variables) {
    let processedTemplate = template;
    
    // Replace all {variable} placeholders
    Object.keys(variables).forEach(key => {
        const placeholder = `{${key}}`;
        const value = variables[key] || '';
        processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processedTemplate;
}

/**
 * Get list of all available configurations
 * @returns {Object} All configurations organized by type
 */
function getAllConfigurations() {
    const result = {};
    
    Object.keys(PROMPT_CONFIGURATIONS).forEach(type => {
        result[type] = Object.keys(PROMPT_CONFIGURATIONS[type]).map(config => ({
            key: config,
            name: PROMPT_CONFIGURATIONS[type][config].name,
            description: `${PROMPT_CONFIGURATIONS[type][config].name} prompt for ${type} messages`
        }));
    });
    
    return result;
}

module.exports = {
    PROMPT_CONFIGURATIONS,
    getAvailableConfigurations,
    getPromptTemplate,
    processPromptTemplate,
    getAllConfigurations
};
