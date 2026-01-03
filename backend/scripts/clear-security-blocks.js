/**
 * Clear Security Blocks Script
 * 
 * Clears all IP blocks, suspicious activity tracking, and failed login attempts
 * Useful for development when you get locked out
 * 
 * Usage: node backend/scripts/clear-security-blocks.js
 */

const securityService = require('../services/securityService');

console.log('\n🧹 Clearing all security blocks...\n');

// Get current stats before clearing
const statsBefore = securityService.getSecurityStats();
console.log('📊 Current Security Stats:');
console.log(`   Blocked IPs: ${statsBefore.blockedIPs.length}`);
if (statsBefore.blockedIPs.length > 0) {
    console.log(`   IPs: ${statsBefore.blockedIPs.join(', ')}`);
}
console.log(`   Suspicious activities tracked: ${statsBefore.suspiciousActivities}`);
console.log(`   Failed login attempts: ${statsBefore.failedLoginAttempts}`);
console.log(`   Active CSRF tokens: ${statsBefore.activeCSRFTokens}\n`);

// Clear all blocks
securityService.securityStore.blockedIPs.clear();
securityService.securityStore.suspiciousActivity.clear();
securityService.securityStore.failedLogins.clear();

console.log('✅ All security blocks cleared!');

// Show stats after clearing
const statsAfter = securityService.getSecurityStats();
console.log('\n📊 Security Stats After Clearing:');
console.log(`   Blocked IPs: ${statsAfter.blockedIPs.length}`);
console.log(`   Suspicious activities tracked: ${statsAfter.suspiciousActivities}`);
console.log(`   Failed login attempts: ${statsAfter.failedLoginAttempts}`);
console.log(`   Active CSRF tokens: ${statsAfter.activeCSRFTokens}`);

console.log('\n💡 Note: This only clears the in-memory security state.');
console.log('   If you restart the server, all blocks are automatically cleared.');
console.log('   To prevent blocks in development, set NODE_ENV=development in .env\n');

console.log('✅ Done!\n');
