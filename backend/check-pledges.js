// Quick script to check pledges in database
const { pool } = require('./config/db');

async function checkPledges() {
    try {
        console.log('Checking pledges in database...\n');
        
        // First, check what columns exist
        const [columns] = await pool.execute('DESCRIBE pledges');
        console.log('Pledges table columns:');
        columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
        console.log('');
        
        // Get total count
        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM pledges WHERE deleted = 0');
        console.log(`Total non-deleted pledges: ${countResult[0].total}\n`);
        
        // Get recent pledges (using only guaranteed columns)
        const [pledges] = await pool.execute(`
            SELECT id, donor_name, amount, status, created_at 
            FROM pledges 
            WHERE deleted = 0 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        console.log('Recent pledges:');
        pledges.forEach((p, i) => {
            console.log(`${i + 1}. ID: ${p.id}, Donor: ${p.donor_name}, Amount: ${p.amount}, Status: ${p.status}, Created: ${p.created_at}`);
        });
        
        // Check today's pledges specifically
        const [todayPledges] = await pool.execute(`
            SELECT id, donor_name, amount, status, created_at, user_id
            FROM pledges 
            WHERE deleted = 0 AND DATE(created_at) = CURDATE()
            ORDER BY created_at DESC
        `);
        console.log(`\nPledges created today (${new Date().toLocaleDateString()}):`);
        if (todayPledges.length === 0) {
            console.log('  No pledges created today');
        } else {
            todayPledges.forEach((p, i) => {
                console.log(`${i + 1}. ID: ${p.id}, Donor: ${p.donor_name}, Amount: ${p.amount}, UserID: ${p.user_id}, Created: ${p.created_at}`);
            });
        }
        
        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkPledges();
