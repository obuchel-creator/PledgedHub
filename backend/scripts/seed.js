const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

const samplePledges = [
    {
        name: 'John Mukasa',
        title: 'Wedding Venue Support',
        description: 'Pledge for venue rental and setup costs',
        goal: 5000000,
        amount: 5000000,
        status: 'active'
    },
    {
        name: 'Sarah Nakato',
        title: 'Catering & meals',
        description: 'Contribution for wedding catering services',
        goal: 3500000,
        amount: 3500000,
        status: 'active'
    },
    {
        name: 'David Ssemwanga',
        title: 'Photography & video',
        description: 'Professional photography and videography services',
        goal: 2500000,
        amount: 2500000,
        status: 'active'
    },
    {
        name: 'Grace Namukasa',
        title: 'Love gift',
        description: 'Cash gift for the couple',
        goal: 1500000,
        amount: 1500000,
        status: 'completed'
    },
    {
        name: 'Peter Okiror',
        title: 'Decor & setup',
        description: 'Decoration and venue setup services',
        goal: 1800000,
        amount: 1800000,
        status: 'active'
    },
    {
        name: 'Mary Akello',
        title: 'Transportation',
        description: 'Transportation services for guests',
        goal: 2000000,
        amount: 1500000,
        status: 'active'
    },
    {
        name: 'Robert Lubega',
        title: 'Church donation',
        description: 'Contribution to church expenses',
        goal: 800000,
        amount: 800000,
        status: 'completed'
    },
    {
        name: 'Alice Nankya',
        title: 'Sound System',
        description: 'Professional sound system rental',
        goal: 1200000,
        amount: 900000,
        status: 'active'
    },
    {
        name: 'Tom Okello',
        title: 'Wedding Cake',
        description: 'Multi-tier wedding cake',
        goal: 600000,
        amount: 600000,
        status: 'completed'
    },
    {
        name: 'Jane Namutebi',
        title: 'Bridal Makeup',
        description: 'Professional bridal makeup and styling',
        goal: 500000,
        amount: 500000,
        status: 'active'
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Check if pledges table exists
        const [tables] = await db.pool.execute(
            "SHOW TABLES LIKE 'pledges'"
        );

        if (tables.length === 0) {
            console.log('❌ Pledges table does not exist. Please run database initialization first.');
            process.exit(1);
        }

        // Check if data already exists
        const [existing] = await db.pool.execute(
            'SELECT COUNT(*) as count FROM pledges'
        );

        if (existing[0].count > 0) {
            console.log(`ℹ️  Database already has ${existing[0].count} pledges.`);
            console.log('Adding more sample data...');
        }

        // Insert sample pledges
        let insertedCount = 0;
        for (const pledge of samplePledges) {
            try {
                await db.pool.execute(
                    'INSERT INTO pledges (name, title, description, goal, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [pledge.name, pledge.title, pledge.description, pledge.goal, pledge.amount, pledge.status]
                );
                insertedCount++;
                console.log(`✅ Added: ${pledge.title} - ${pledge.name}`);
            } catch (err) {
                console.error(`❌ Failed to add ${pledge.title}:`, err.message);
            }
        }

        console.log(`\n🎉 Seeding complete! Added ${insertedCount} pledges.`);
        console.log('📊 Total pledges in database:', existing[0].count + insertedCount);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
