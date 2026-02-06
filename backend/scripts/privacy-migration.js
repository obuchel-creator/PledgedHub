/**
 * Privacy Migration - Add user-level privacy controls
 * 
 * This migration adds user ownership and privacy settings to ensure:
 * 1. Users only see their OWN pledges (unless admin/staff)
 * 2. Campaigns can be private or organization-wide
 * 3. Complete data isolation at both tenant AND user level
 */

const { pool } = require('../config/db');

async function runPrivacyMigration() {
  console.log('\n🔒 Starting Privacy Migration...\n');
  
  let completedSteps = 0;
  const totalSteps = 7;
  
  try {
    // Step 1: Add created_by to pledges (track ownership)
    console.log('Step 1/7: Adding created_by column to pledges...');
    try {
      await pool.execute(`
        ALTER TABLE pledges 
        ADD COLUMN created_by INT NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      console.log('   Column created_by already exists, skipping');
    }
    
    try {
      await pool.execute(`
        ALTER TABLE pledges 
        ADD CONSTRAINT fk_pledges_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_FK_DUP_NAME' && error.code !== 'ER_DUP_KEYNAME') throw error;
      console.log('   Foreign key already exists, skipping');
    }
    console.log('✅ Step 1 complete');
    completedSteps++;

    // Step 2: Add is_private flag to pledges
    console.log('\nStep 2/7: Adding is_private flag to pledges...');
    try {
      await pool.execute(`
        ALTER TABLE pledges 
        ADD COLUMN is_private BOOLEAN DEFAULT TRUE
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      console.log('   Column is_private already exists, skipping');
    }
    console.log('✅ Step 2 complete');
    completedSteps++;

    // Step 3: Add visibility to campaigns
    console.log('\nStep 3/7: Adding visibility controls to campaigns...');
    try {
      await pool.execute(`
        ALTER TABLE campaigns 
        ADD COLUMN visibility ENUM('private', 'organization', 'public') DEFAULT 'private'
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      console.log('   Column visibility already exists, skipping');
    }
    
    try {
      await pool.execute(`
        ALTER TABLE campaigns 
        ADD COLUMN created_by INT NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      console.log('   Column created_by already exists, skipping');
    }
    
    try {
      await pool.execute(`
        ALTER TABLE campaigns 
        ADD CONSTRAINT fk_campaigns_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_FK_DUP_NAME' && error.code !== 'ER_DUP_KEYNAME') throw error;
      console.log('   Foreign key already exists, skipping');
    }
    console.log('✅ Step 3 complete');
    completedSteps++;

    // Step 4: Create user_privacy_settings table
    console.log('\nStep 4/7: Creating user_privacy_settings table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_privacy_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        share_pledges_with_org BOOLEAN DEFAULT FALSE,
        share_analytics_with_org BOOLEAN DEFAULT FALSE,
        allow_staff_view BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_tenant (user_id, tenant_id)
      )
    `);
    console.log('✅ Step 4 complete');
    completedSteps++;

    // Step 5: Add view permissions tracking
    console.log('\nStep 5/7: Creating pledge_view_permissions table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pledge_view_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pledge_id INT NOT NULL,
        user_id INT NOT NULL,
        permission_type ENUM('owner', 'viewer', 'editor') DEFAULT 'viewer',
        granted_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_pledge_user (pledge_id, user_id)
      )
    `);
    console.log('✅ Step 5 complete');
    completedSteps++;

    // Step 6: Migrate existing data - assign pledges to users based on email/phone
    console.log('\nStep 6/7: Migrating existing pledge ownership...');
    await pool.execute(`
      UPDATE pledges p
      LEFT JOIN users u ON (
        p.donor_email = u.email OR 
        p.donor_phone = u.phone
      )
      SET p.created_by = u.id
      WHERE p.created_by IS NULL AND u.id IS NOT NULL
    `);
    
    // Get count of assigned pledges
    const [assignedCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM pledges WHERE created_by IS NOT NULL
    `);
    console.log(`✅ Step 6 complete - Assigned ownership to ${assignedCount[0].count} pledges`);
    completedSteps++;

    // Step 7: Create default privacy settings for existing users
    console.log('\nStep 7/7: Creating default privacy settings for existing users...');
    await pool.execute(`
      INSERT INTO user_privacy_settings (user_id, tenant_id, share_pledges_with_org, share_analytics_with_org, allow_staff_view)
      SELECT 
        u.id, 
        CAST(u.tenant_id AS CHAR),
        FALSE,  -- Don't share pledges by default
        FALSE,  -- Don't share analytics by default
        TRUE    -- Allow staff view by default
      FROM users u
      LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id AND CAST(u.tenant_id AS CHAR) = ups.tenant_id
      WHERE ups.id IS NULL AND u.tenant_id IS NOT NULL
    `);
    
    const [settingsCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM user_privacy_settings
    `);
    console.log(`✅ Step 7 complete - Created privacy settings for ${settingsCount[0].count} users`);
    completedSteps++;

    // Migration summary
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('                   MIGRATION SUMMARY');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`✅ Completed: ${completedSteps}/${totalSteps} steps`);
    console.log('\n🔒 Privacy Controls Added:');
    console.log('   ✓ User ownership tracking (created_by)');
    console.log('   ✓ Private pledges (is_private flag)');
    console.log('   ✓ Campaign visibility controls');
    console.log('   ✓ User privacy settings table');
    console.log('   ✓ Granular view permissions');
    console.log('   ✓ Existing data migrated');
    console.log('\n🎉 Privacy migration completed successfully!\n');

  } catch (error) {
    console.error(`\n❌ Migration failed at step ${completedSteps + 1}/${totalSteps}`);
    console.error('Error:', error.message);
    throw error;
  }
}

// Run migration
runPrivacyMigration()
  .then(() => {
    console.log('✅ All privacy controls in place!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Privacy migration failed:', error);
    process.exit(1);
  });
