const { pool } = require('./backend/config/db');

async function checkAllData() {
  try {
    // Get latest user
    const [users] = await pool.execute('SELECT id FROM users ORDER BY id DESC LIMIT 1');
    if (users.length === 0) {
      console.log('No users in database');
      process.exit(0);
    }
    
    const userId = users[0].id;
    console.log(`\nChecking data for user ID: ${userId}\n`);
    
    // Check all related tables
    const [userRow] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const [statsRow] = await pool.execute('SELECT * FROM user_usage_stats WHERE user_id = ?', [userId]);
    const [validationRow] = await pool.execute('SELECT * FROM user_validation_status WHERE user_id = ?', [userId]);
    const [permsRows] = await pool.execute('SELECT * FROM user_permissions WHERE user_id = ?', [userId]);
    const [auditRows] = await pool.execute('SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC', [userId]);
    
    console.log('👤 USER:');
    console.log('  id:', userRow[0].id);
    console.log('  name:', userRow[0].name);
    console.log('  role:', userRow[0].role);
    
    console.log('\n💰 MONETIZATION STATS:');
    if (statsRow.length > 0) {
      console.log('  ✅ FOUND');
      console.log('    tier:', statsRow[0].tier);
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
    console.log('\n🔐 VALIDATION STATUS:');
    if (validationRow.length > 0) {
      console.log('  ✅ FOUND');
      console.log('    account_locked:', validationRow[0].account_locked);
      console.log('    email_verified:', validationRow[0].email_verified);
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
    console.log('\n🔑 PERMISSIONS:');
    if (permsRows.length > 0) {
      console.log('  ✅ FOUND (' + permsRows.length + ' permissions)');
      permsRows.forEach(p => console.log('    -', p.permission_key));
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
    console.log('\n📋 AUDIT LOG:');
    if (auditRows.length > 0) {
      console.log('  ✅ FOUND (' + auditRows.length + ' entries)');
      auditRows.slice(0, 3).forEach(a => console.log('    -', a.action, 'at', a.created_at));
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
  } finally {
    await pool.end();
  }
}

checkAllData();
