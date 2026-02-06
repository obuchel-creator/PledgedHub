/**
 * Fix tenant_id for ALL users in the database
 * Sets each user's tenant_id to their own user ID (for individual accounts)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixAllUsersTenantContext() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('\n🔧 Checking all users...\n');

    // Get all users
    const [users] = await connection.execute(
      'SELECT id, name, email, tenant_id FROM users WHERE deleted = 0'
    );

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📊 Found ${users.length} users\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of users) {
      const tenantIdString = user.id.toString();
      
      // Check if tenant_id needs fixing
      if (!user.tenant_id || user.tenant_id !== tenantIdString) {
        console.log(`🔄 Fixing user: ${user.name} (${user.email})`);
        console.log(`   Old tenant_id: ${user.tenant_id || 'NULL'}`);
        console.log(`   New tenant_id: ${tenantIdString}`);
        
        // Update tenant_id to user's own ID
        await connection.execute(
          'UPDATE users SET tenant_id = ? WHERE id = ?',
          [tenantIdString, user.id]
        );
        
        fixedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETED');
    console.log('='.repeat(60));
    console.log(`✅ Fixed: ${fixedCount} users`);
    console.log(`✓  Already correct: ${alreadyCorrectCount} users`);
    console.log(`📊 Total: ${users.length} users`);
    console.log('='.repeat(60));
    
    if (fixedCount > 0) {
      console.log('\n⚠️  IMPORTANT: All affected users MUST logout and login again!');
      console.log('   This refreshes their JWT tokens with the new tenant_id.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
fixAllUsersTenantContext()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Script failed:', error.message);
    process.exit(1);
  });
