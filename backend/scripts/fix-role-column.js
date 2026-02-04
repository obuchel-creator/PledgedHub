const db = require('../config/db');

async function fixRoleColumn() {
  try {
    console.log('🔧 Converting role column to VARCHAR...');
    await db.pool.execute('ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT "donor"');
    console.log('✅ Converted role to VARCHAR(50)');
    
    console.log('🔧 Updating user 20 to super_admin...');
    await db.pool.execute('UPDATE users SET role = ? WHERE id = ?', ['super_admin', 20]);
    console.log('✅ Updated user 20 to super_admin');
    
    const [result] = await db.pool.execute('SELECT id, name, role FROM users WHERE id = 20');
    console.log('✅ Verified:', result[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRoleColumn();
