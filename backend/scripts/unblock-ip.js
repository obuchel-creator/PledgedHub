/**
 * Unblock IP Address Script
 * 
 * Manually unblock an IP address that has been blocked by the security service
 * 
 * Usage: node backend/scripts/unblock-ip.js <ip-address>
 * Example: node backend/scripts/unblock-ip.js 127.0.0.1
 */

const securityService = require('../services/securityService');

// Get IP from command line arguments
const ipToUnblock = process.argv[2];

if (!ipToUnblock) {
    console.error('❌ Error: IP address is required');
    console.log('\nUsage: node backend/scripts/unblock-ip.js <ip-address>');
    console.log('Example: node backend/scripts/unblock-ip.js 127.0.0.1');
    process.exit(1);
}

// Unblock the IP
console.log(`\n🔓 Attempting to unblock IP: ${ipToUnblock}`);

if (securityService.unblockIP(ipToUnblock)) {
    console.log(`✅ Success! IP ${ipToUnblock} has been unblocked`);
} else {
    console.log(`ℹ️  IP ${ipToUnblock} was not blocked (or already unblocked)`);
}

// Show current security stats
const stats = securityService.getSecurityStats();
console.log('\n📊 Current Security Stats:');
console.log(`   Blocked IPs: ${stats.blockedIPs.length}`);
if (stats.blockedIPs.length > 0) {
    console.log(`   Currently blocked: ${stats.blockedIPs.join(', ')}`);
}
console.log(`   Suspicious activities: ${stats.suspiciousActivities}`);
console.log(`   Failed login attempts: ${stats.failedLoginAttempts}`);

console.log('\n✅ Done!\n');
