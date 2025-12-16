const { pool } = require('../config/db');

async function migratePublicCampaigns() {
  try {
    console.log('🔄 Starting migration: Add public campaign fields...\n');

    // 1. Add is_public column
    console.log('📝 Adding is_public column to campaigns...');
    try {
      await pool.execute(`
        ALTER TABLE campaigns ADD COLUMN is_public BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added is_public column');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('⚠️  is_public column already exists, skipping');
      } else {
        throw err;
      }
    }

    // 2. Add event_code column (unique)
    console.log('📝 Adding event_code column to campaigns...');
    try {
      await pool.execute(`
        ALTER TABLE campaigns ADD COLUMN event_code VARCHAR(20) UNIQUE
      `);
      console.log('✅ Added event_code column');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('⚠️  event_code column already exists, skipping');
      } else {
        throw err;
      }
    }

    // 3. Add share_url column (slug-based URL)
    console.log('📝 Adding share_url column to campaigns...');
    try {
      await pool.execute(`
        ALTER TABLE campaigns ADD COLUMN share_url VARCHAR(255) UNIQUE
      `);
      console.log('✅ Added share_url column');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('⚠️  share_url column already exists, skipping');
      } else {
        throw err;
      }
    }

    // 4. Generate event codes for existing campaigns
    console.log('\n📝 Generating event codes for existing campaigns...');
    const [campaigns] = await pool.execute(`
      SELECT id, name, event_code FROM campaigns 
      WHERE event_code IS NULL AND deleted = 0
      LIMIT 100
    `);

    for (const campaign of campaigns) {
      // Generate event code from name (e.g., "School Building" → "SCH00005")
      const code = generateEventCode(campaign.name, campaign.id);
      const slug = generateSlug(campaign.name);

      await pool.execute(`
        UPDATE campaigns 
        SET event_code = ?, share_url = ?
        WHERE id = ?
      `, [code, slug, campaign.id]);

      console.log(`  ✓ ${campaign.name}: Code=${code}, Slug=${slug}`);
    }

    console.log(`\n✅ Migration complete! Generated codes for ${campaigns.length} campaigns\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Generate event code: Takes first 3 chars + ID
 * "School Building" + ID 5 → "SCH00005"
 */
function generateEventCode(title, id) {
  const prefix = title
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 3)
    .padEnd(3, 'S');
  
  const numPart = String(id).padStart(5, '0');
  return `${prefix}${numPart}`;
}

/**
 * Generate URL slug: lowercase, dashes, no special chars
 * "School Building Fund" → "school-building-fund"
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

migratePublicCampaigns().then(() => {
  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
