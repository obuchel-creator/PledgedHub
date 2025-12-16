const db = require('../config/db');

async function checkPledges() {
    try {
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM pledges');
        console.log('✅ Total pledges in database:', countResult[0].count);
        
        if (countResult[0].count > 0) {
            const [pledges] = await db.execute('SELECT id, donor_name, donor_email, amount, status, collection_date FROM pledges LIMIT 5');
            console.log('\n📊 Sample pledges:');
            pledges.forEach(p => {
                console.log(`  - ID ${p.id}: ${p.donor_name} - UGX ${p.amount} (${p.status})`);
                console.log(`    Email: ${p.donor_email}`);
                console.log(`    Collection: ${p.collection_date}`);
            });
        } else {
            console.log('\n⚠️  No pledges found in database!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPledges();
