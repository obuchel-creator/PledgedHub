/**
 * SaaS Multi-Tenant Migration Script
 * 
 * This script converts PledgeHub from single-tenant to multi-tenant architecture
 * by adding tenant_id columns and creating the tenants table.
 * 
 * Run: node backend/scripts/saas-migration.js
 * 
 * IMPORTANT: Backup your database before running this script!
 */

const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const MIGRATION_STEPS = [
  {
    name: 'Create tenants table',
    sql: `
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(50) UNIQUE,
        custom_domain VARCHAR(255) UNIQUE NULL,
        plan ENUM('free', 'starter', 'professional', 'enterprise') DEFAULT 'free',
        status ENUM('active', 'suspended', 'cancelled', 'trial') DEFAULT 'trial',
        trial_ends_at TIMESTAMP NULL,
        subscription_starts_at TIMESTAMP NULL,
        stripe_customer_id VARCHAR(255) NULL,
        stripe_subscription_id VARCHAR(255) NULL,
        billing_email VARCHAR(255),
        settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_subdomain (subdomain),
        INDEX idx_status (status),
        INDEX idx_plan (plan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'Add tenant_id to users table',
    sql: `
      ALTER TABLE users 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Add tenant_id to pledges table',
    sql: `
      ALTER TABLE pledges 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Add tenant_id to campaigns table',
    sql: `
      ALTER TABLE campaigns 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Add tenant_id to payments table',
    sql: `
      ALTER TABLE payments 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Add tenant_id to feedback table',
    sql: `
      ALTER TABLE feedback 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Add tenant_id to usage_stats table',
    sql: `
      ALTER TABLE usage_stats 
      ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_tenant_id (tenant_id);
    `
  },
  {
    name: 'Create tenant_invitations table',
    sql: `
      CREATE TABLE IF NOT EXISTS tenant_invitations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role ENUM('user', 'staff', 'admin') DEFAULT 'user',
        token VARCHAR(255) UNIQUE NOT NULL,
        invited_by INT NOT NULL,
        status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_tenant_email (tenant_id, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'Create tenant_audit_log table',
    sql: `
      CREATE TABLE IF NOT EXISTS tenant_audit_log (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        tenant_id VARCHAR(36) NOT NULL,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id VARCHAR(100) NULL,
        old_values JSON NULL,
        new_values JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_action (tenant_id, action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

async function runMigration() {
  console.log('🚀 Starting SaaS Multi-Tenant Migration...\n');
  
  let completedSteps = 0;
  const errors = [];

  for (const step of MIGRATION_STEPS) {
    try {
      console.log(`⏳ ${step.name}...`);
      await pool.execute(step.sql);
      console.log(`✅ ${step.name} - COMPLETED\n`);
      completedSteps++;
    } catch (error) {
      // Check if error is "column already exists" - treat as success
      if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`⚠️  ${step.name} - ALREADY EXISTS (skipped)\n`);
        completedSteps++;
      } else {
        console.error(`❌ ${step.name} - FAILED`);
        console.error(`   Error: ${error.message}\n`);
        errors.push({ step: step.name, error: error.message });
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Migration Summary: ${completedSteps}/${MIGRATION_STEPS.length} steps completed`);
  
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} errors occurred:`);
    errors.forEach(({ step, error }) => {
      console.log(`   - ${step}: ${error}`);
    });
    console.log('\n⚠️  Please fix errors and re-run migration.');
  } else {
    console.log('✅ All migration steps completed successfully!\n');
    
    // Create default tenant for existing data
    await migrateExistingData();
  }
  
  await pool.end();
}

async function migrateExistingData() {
  console.log('\n📦 Migrating Existing Data...\n');
  
  try {
    // Check if there are existing users without tenant_id
    const [usersWithoutTenant] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id IS NULL'
    );
    
    if (usersWithoutTenant[0].count === 0) {
      console.log('✅ All users already have tenant_id assigned.\n');
      return;
    }
    
    console.log(`Found ${usersWithoutTenant[0].count} users without tenant assignment.`);
    console.log('Creating default tenant for existing users...\n');
    
    // Create default tenant
    const defaultTenantId = uuidv4();
    await pool.execute(
      `INSERT INTO tenants (id, name, subdomain, plan, status, billing_email) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        defaultTenantId,
        'Default Organization',
        'default',
        'professional', // Give existing users professional plan
        'active',
        'admin@pledgehub.com'
      ]
    );
    
    console.log(`✅ Created default tenant: ${defaultTenantId}`);
    
    // Assign all existing users to default tenant
    await pool.execute(
      'UPDATE users SET tenant_id = ? WHERE tenant_id IS NULL',
      [defaultTenantId]
    );
    console.log('✅ Assigned all users to default tenant');
    
    // Assign all existing pledges to default tenant
    await pool.execute(
      'UPDATE pledges SET tenant_id = ? WHERE tenant_id IS NULL',
      [defaultTenantId]
    );
    console.log('✅ Assigned all pledges to default tenant');
    
    // Assign all existing campaigns to default tenant
    await pool.execute(
      'UPDATE campaigns SET tenant_id = ? WHERE tenant_id IS NULL',
      [defaultTenantId]
    );
    console.log('✅ Assigned all campaigns to default tenant');
    
    // Assign all existing payments to default tenant
    const [paymentsTable] = await pool.execute(
      "SHOW TABLES LIKE 'payments'"
    );
    if (paymentsTable.length > 0) {
      await pool.execute(
        'UPDATE payments SET tenant_id = ? WHERE tenant_id IS NULL',
        [defaultTenantId]
      );
      console.log('✅ Assigned all payments to default tenant');
    }
    
    // Assign all existing feedback to default tenant
    await pool.execute(
      'UPDATE feedback SET tenant_id = ? WHERE tenant_id IS NULL',
      [defaultTenantId]
    );
    console.log('✅ Assigned all feedback to default tenant');
    
    // Assign all usage stats to default tenant
    await pool.execute(
      'UPDATE usage_stats SET tenant_id = ? WHERE tenant_id IS NULL',
      [defaultTenantId]
    );
    console.log('✅ Assigned all usage stats to default tenant');
    
    console.log('\n🎉 Data migration completed successfully!');
    console.log(`\nDefault tenant subdomain: default.pledgehub.com`);
    console.log('Existing users can access via: http://default.localhost:5001\n');
    
  } catch (error) {
    console.error('❌ Data migration failed:', error.message);
    throw error;
  }
}

// Run migration
runMigration().catch(error => {
  console.error('\n💥 Fatal error during migration:', error);
  process.exit(1);
});
