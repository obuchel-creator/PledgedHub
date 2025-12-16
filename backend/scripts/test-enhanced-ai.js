/**
 * Test Different AI Prompt Configurations
 * This script demonstrates how different prompt configs produce different messages
 */

require('dotenv').config();

// Test with the enhanced AI service
const enhancedAI = require('../services/aiServiceEnhanced');

console.log('🎯 Testing AI Prompt Configuration System\n');

const testPledge = {
    donor_name: 'Maria Nakato',
    amount: 200000,
    purpose: 'Community Church Building Fund',
    collection_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    days_overdue: 0
};

async function testConfigurations() {
    if (!enhancedAI.isAIAvailable()) {
        console.log('❌ AI not available. Testing fallback messages only.\n');
    } else {
        console.log('✅ AI available. Testing all configurations.\n');
    }
    
    console.log('📧 TESTING REMINDER MESSAGE CONFIGURATIONS:\n');
    
    // Test different reminder configurations
    const reminderConfigs = [
        { name: 'Standard', config: 'default', description: 'General friendly reminder' },
        { name: 'Ugandan Cultural', config: 'ugandan_cultural', description: 'Cultural context and community values' },
        { name: 'Religious/Spiritual', config: 'religious', description: 'Faith-based with biblical encouragement' },
        { name: 'Professional', config: 'professional', description: 'Formal business-like tone' }
    ];
    
    for (const test of reminderConfigs) {
        try {
            console.log(`🎨 ${test.name} Configuration:`);
            console.log(`   Description: ${test.description}`);
            
            const message = await enhancedAI.generateEnhancedReminderMessage(
                testPledge, 
                '3_days', 
                { 
                    tone: 'friendly', 
                    promptConfig: test.config,
                    language: 'English'
                }
            );
            
            console.log(`   📱 Message: "${message}"`);
            console.log(`   📏 Length: ${message.length} characters\n`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
    
    console.log('=' .repeat(80) + '\n');
    console.log('💙 TESTING THANK YOU MESSAGE CONFIGURATIONS:\n');
    
    // Test different thank you configurations
    const thankYouConfigs = [
        { name: 'Standard', config: 'default', description: 'General appreciation message' },
        { name: 'Ugandan Cultural', config: 'ugandan_cultural', description: 'Community-focused with Omukwano values' },
        { name: 'Impact-Focused', config: 'impact_focused', description: 'Emphasizes the difference their donation makes' }
    ];
    
    for (const test of thankYouConfigs) {
        try {
            console.log(`🎨 ${test.name} Configuration:`);
            console.log(`   Description: ${test.description}`);
            
            const message = await enhancedAI.generateThankYouMessage(
                testPledge, 
                { 
                    tone: 'warm', 
                    promptConfig: test.config,
                    includeImpact: true
                }
            );
            
            console.log(`   📱 Message: "${message}"`);
            console.log(`   📏 Length: ${message.length} characters\n`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
    
    console.log('=' .repeat(80) + '\n');
    console.log('📊 TESTING ANALYSIS CONFIGURATIONS:\n');
    
    // Test different analysis configurations with sample data
    const samplePledges = [
        { id: 1, status: 'paid', amount: 100000, collection_date: '2025-10-15' },
        { id: 2, status: 'paid', amount: 150000, collection_date: '2025-10-20' },
        { id: 3, status: 'pending', amount: 200000, collection_date: '2025-11-10' },
        { id: 4, status: 'pending', amount: 75000, collection_date: '2025-11-15' },
        { id: 5, status: 'pending', amount: 300000, collection_date: '2025-11-01' } // overdue
    ];
    
    const analysisConfigs = [
        { name: 'Standard', config: 'default', description: 'General performance insights' },
        { name: 'Financial Focus', config: 'financial_focus', description: 'Revenue and cash flow analysis' },
        { name: 'Donor Relationship', config: 'donor_relationship', description: 'Engagement and retention focus' }
    ];
    
    for (const test of analysisConfigs) {
        try {
            console.log(`🎨 ${test.name} Configuration:`);
            console.log(`   Description: ${test.description}`);
            
            const analysis = await enhancedAI.analyzePledgeData(
                samplePledges, 
                { 
                    promptConfig: test.config
                }
            );
            
            if (analysis.available && analysis.insights) {
                console.log(`   📈 Insights Generated: ${analysis.insights.length}`);
                analysis.insights.forEach((insight, index) => {
                    console.log(`      ${index + 1}. [${insight.type.toUpperCase()}] ${insight.title}: ${insight.message.substring(0, 60)}...`);
                });
            } else {
                console.log(`   ℹ️  Analysis: ${analysis.message || 'AI not available, showing fallback'}`);
            }
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
    
    console.log('✅ Configuration testing complete!\n');
    
    console.log('🔧 HOW TO USE THESE CONFIGURATIONS:\n');
    console.log('1. In your routes/controllers, specify the promptConfig option:');
    console.log('   ');
    console.log('   // For Ugandan cultural context');
    console.log('   const message = await aiService.generateEnhancedReminderMessage(pledge, "7_days", {');
    console.log('       tone: "friendly",');
    console.log('       promptConfig: "ugandan_cultural"');
    console.log('   });');
    console.log('   ');
    console.log('   // For religious/spiritual context');
    console.log('   const message = await aiService.generateThankYouMessage(pledge, {');
    console.log('       tone: "warm",');
    console.log('       promptConfig: "religious"');
    console.log('   });');
    console.log('   ');
    console.log('   // For financial analysis');
    console.log('   const insights = await aiService.analyzePledgeData(pledges, {');
    console.log('       promptConfig: "financial_focus"');
    console.log('   });');
    console.log('');
    
    console.log('2. To create your own configurations:');
    console.log('   - Edit backend/config/promptConfig.js');
    console.log('   - Add new configurations to the PROMPT_CONFIGURATIONS object');
    console.log('   - Test with: node backend/scripts/test-enhanced-ai.js');
    console.log('');
    
    console.log('3. Available configurations:');
    console.log('   REMINDER: default, ugandan_cultural, religious, professional');
    console.log('   THANK_YOU: default, ugandan_cultural, impact_focused');
    console.log('   ANALYSIS: default, financial_focus, donor_relationship');
    console.log('   SUGGESTIONS: default, technology_focus, community_focus');
    console.log('');
    
    console.log('📚 Full documentation: docs/AI_PROMPT_CUSTOMIZATION_GUIDE.md');
}

// Run the test
testConfigurations().catch(console.error);