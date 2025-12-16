/**
 * AI Prompt Testing Script
 * Test and compare different prompt configurations
 */

require('dotenv').config();
const { getPromptTemplate, processPromptTemplate, getAllConfigurations } = require('../config/promptConfig');

console.log('🧪 AI Prompt Configuration Demo\n');

// Sample data for testing
const samplePledge = {
    donor_name: 'Nakato Sarah',
    amount: 150000,
    purpose: 'Church Building Fund',
    collection_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'due in 7 days'
};

const sampleOptions = {
    tone: 'friendly',
    language: 'English',
    maxLength: 160,
    motivationInstruction: 'Include brief motivation/appreciation emphasizing community support',
    impactInstruction: 'Mention positive community impact and collective progress'
};

const sampleStats = {
    total: 15,
    totalAmount: '2,500,000',
    paid: 8,
    collectionRate: 53,
    pending: 6,
    overdue: 1,
    pendingAmount: '1,200,000'
};

// Show all available configurations
console.log('📋 Available Prompt Configurations:');
const allConfigs = getAllConfigurations();
Object.keys(allConfigs).forEach(type => {
    console.log(`\n${type.toUpperCase()}:`);
    allConfigs[type].forEach(config => {
        console.log(`  - ${config.key}: ${config.name}`);
    });
});

console.log('\n' + '='.repeat(80) + '\n');

// Test different reminder configurations
console.log('📨 REMINDER MESSAGE EXAMPLES:\n');

['default', 'ugandan_cultural', 'religious', 'professional'].forEach(config => {
    const template = getPromptTemplate('reminder', config);
    const processedPrompt = processPromptTemplate(template, {
        ...samplePledge,
        ...sampleOptions,
        donorName: samplePledge.donor_name,
        amount: `UGX ${Number(samplePledge.amount).toLocaleString()}`,
        collectionDate: samplePledge.collection_date
    });
    
    console.log(`🎯 Configuration: ${config.toUpperCase()}`);
    console.log('📝 Generated Prompt:');
    console.log('-'.repeat(60));
    console.log(processedPrompt.substring(0, 300) + '...\n');
});

console.log('='.repeat(80) + '\n');

// Test different thank you configurations
console.log('💙 THANK YOU MESSAGE EXAMPLES:\n');

['default', 'ugandan_cultural', 'impact_focused'].forEach(config => {
    const template = getPromptTemplate('thankYou', config);
    const processedPrompt = processPromptTemplate(template, {
        ...samplePledge,
        ...sampleOptions,
        donorName: samplePledge.donor_name,
        amount: `UGX ${Number(samplePledge.amount).toLocaleString()}`
    });
    
    console.log(`🎯 Configuration: ${config.toUpperCase()}`);
    console.log('📝 Generated Prompt:');
    console.log('-'.repeat(60));
    console.log(processedPrompt.substring(0, 250) + '...\n');
});

console.log('='.repeat(80) + '\n');

// Test analysis configurations
console.log('📊 ANALYSIS PROMPT EXAMPLES:\n');

['default', 'financial_focus', 'donor_relationship'].forEach(config => {
    const template = getPromptTemplate('analysis', config);
    const processedPrompt = processPromptTemplate(template, sampleStats);
    
    console.log(`🎯 Configuration: ${config.toUpperCase()}`);
    console.log('📝 Generated Prompt:');
    console.log('-'.repeat(60));
    console.log(processedPrompt.substring(0, 250) + '...\n');
});

console.log('='.repeat(80) + '\n');

// Test suggestion configurations
console.log('💡 SUGGESTION PROMPT EXAMPLES:\n');

['default', 'technology_focus', 'community_focus'].forEach(config => {
    const template = getPromptTemplate('suggestions', config);
    const processedPrompt = processPromptTemplate(template, sampleStats);
    
    console.log(`🎯 Configuration: ${config.toUpperCase()}`);
    console.log('📝 Generated Prompt:');
    console.log('-'.repeat(60));
    console.log(processedPrompt.substring(0, 250) + '...\n');
});

console.log('✅ Prompt configuration demo complete!');
console.log('\n🔧 To customize:');
console.log('1. Edit backend/config/promptConfig.js');
console.log('2. Modify existing configurations or add new ones');
console.log('3. Test with: node backend/scripts/test-prompt-configs.js');
console.log('4. Update aiService.js to use new configurations');

console.log('\n📚 Documentation: docs/AI_PROMPT_CUSTOMIZATION_GUIDE.md');