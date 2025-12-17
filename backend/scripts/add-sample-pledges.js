const { pool } = require('../config/db');

const SAMPLE_PLEDGES = [
  // Campaign 2: School Library Renovation (50M goal)
  { campaign_id: 2, donor_name: 'John Mukwaya', donor_email: 'john@example.com', amount: 2000000, status: 'paid', purpose: 'Education Support', collection_date: '2025-01-15' },
  { campaign_id: 2, donor_name: 'Sarah Namwase', donor_email: 'sarah@example.com', amount: 1500000, status: 'paid', purpose: 'Library Books', collection_date: '2025-01-10' },
  { campaign_id: 2, donor_name: 'Peter Okafor', donor_email: 'peter@example.com', amount: 3000000, status: 'pending', purpose: 'Reading Materials', collection_date: '2025-02-01' },
  { campaign_id: 2, donor_name: 'Grace Kipchoge', donor_email: 'grace@example.com', amount: 2500000, status: 'partial', purpose: 'School Supplies', collection_date: '2024-12-15' },
  { campaign_id: 2, donor_name: 'Charles Mutua', donor_email: 'charles@example.com', amount: 1800000, status: 'paid', purpose: 'Computer Lab', collection_date: '2025-01-05' },

  // Campaign 3: Community Health Center (100M goal)
  { campaign_id: 3, donor_name: 'Alice Kiggundu', donor_email: 'alice@example.com', amount: 5000000, status: 'paid', purpose: 'Medical Equipment', collection_date: '2025-01-12' },
  { campaign_id: 3, donor_name: 'David Kipchoge', donor_email: 'david@example.com', amount: 4500000, status: 'paid', purpose: 'Healthcare Supplies', collection_date: '2025-01-08' },
  { campaign_id: 3, donor_name: 'Rebecca Odhiambo', donor_email: 'rebecca@example.com', amount: 6000000, status: 'pending', purpose: 'Clinic Renovation', collection_date: '2025-02-05' },
  { campaign_id: 3, donor_name: 'Michael Wandera', donor_email: 'michael@example.com', amount: 3500000, status: 'partial', purpose: 'Staff Training', collection_date: '2024-12-20' },
  { campaign_id: 3, donor_name: 'Priscilla Apio', donor_email: 'priscilla@example.com', amount: 4000000, status: 'paid', purpose: 'Medicine Stock', collection_date: '2025-01-14' },
  { campaign_id: 3, donor_name: 'Emmanuel Kipchoge', donor_email: 'emmanuel@example.com', amount: 5500000, status: 'pending', purpose: 'Lab Equipment', collection_date: '2025-02-10' },

  // Campaign 4: Youth Sports Equipment (15M goal)
  { campaign_id: 4, donor_name: 'Stella Mutua', donor_email: 'stella@example.com', amount: 800000, status: 'paid', purpose: 'Soccer Ball Donation', collection_date: '2025-01-20' },
  { campaign_id: 4, donor_name: 'Thomas Kimani', donor_email: 'thomas@example.com', amount: 1200000, status: 'paid', purpose: 'Sports Uniforms', collection_date: '2025-01-18' },
  { campaign_id: 4, donor_name: 'Dorothy Kipchoge', donor_email: 'dorothy@example.com', amount: 1500000, status: 'pending', purpose: 'Basketball Court', collection_date: '2025-02-15' },
  { campaign_id: 4, donor_name: 'Paul Kamau', donor_email: 'paul@example.com', amount: 1000000, status: 'paid', purpose: 'Training Equipment', collection_date: '2025-01-16' },

  // Campaign 5: Water Well Project (30M goal)
  { campaign_id: 5, donor_name: 'Beatrice Kipchoge', donor_email: 'beatrice@example.com', amount: 3000000, status: 'paid', purpose: 'Well Construction', collection_date: '2025-01-22' },
  { campaign_id: 5, donor_name: 'James Ochieng', donor_email: 'james@example.com', amount: 4000000, status: 'paid', purpose: 'Pump Installation', collection_date: '2025-01-19' },
  { campaign_id: 5, donor_name: 'Margaret Wanjiru', donor_email: 'margaret@example.com', amount: 3500000, status: 'pending', purpose: 'Water Pipes', collection_date: '2025-02-08' },
  { campaign_id: 5, donor_name: 'Joseph Kipchoge', donor_email: 'joseph@example.com', amount: 2500000, status: 'partial', purpose: 'Maintenance Fund', collection_date: '2024-12-28' },
  { campaign_id: 5, donor_name: 'Helen Kamau', donor_email: 'helen@example.com', amount: 3200000, status: 'paid', purpose: 'Testing & Approval', collection_date: '2025-01-24' },

  // Campaign 6: Teacher Training Program (25M goal)
  { campaign_id: 6, donor_name: 'Robert Kipchoge', donor_email: 'robert@example.com', amount: 2000000, status: 'paid', purpose: 'Training Materials', collection_date: '2025-01-25' },
  { campaign_id: 6, donor_name: 'Victoria Kipchoge', donor_email: 'victoria@example.com', amount: 2500000, status: 'paid', purpose: 'Workshop Venue', collection_date: '2025-01-23' },
  { campaign_id: 6, donor_name: 'Anthony Mwangi', donor_email: 'anthony@example.com', amount: 1800000, status: 'pending', purpose: 'Instructor Fees', collection_date: '2025-02-12' },
  { campaign_id: 6, donor_name: 'Catherine Kipchoge', donor_email: 'catherine@example.com', amount: 2200000, status: 'paid', purpose: 'Certification Program', collection_date: '2025-01-21' },
  { campaign_id: 6, donor_name: 'Daniel Kipchoge', donor_email: 'daniel@example.com', amount: 1900000, status: 'pending', purpose: 'Student Scholarships', collection_date: '2025-02-20' },
];

async function addSamplePledges() {
  try {
    console.log('🚀 Adding sample pledges...');
    let count = 0;
    let totalAmount = 0;

    for (const pledge of SAMPLE_PLEDGES) {
      const [result] = await pool.execute(
        `INSERT INTO pledges 
         (campaign_id, donor_name, donor_email, amount, status, purpose, collection_date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          pledge.campaign_id,
          pledge.donor_name,
          pledge.donor_email,
          pledge.amount,
          pledge.status,
          pledge.purpose,
          pledge.collection_date
        ]
      );

      console.log(`✅ Created: "${pledge.donor_name}" - ${pledge.amount.toLocaleString()} UGX | Status: ${pledge.status.toUpperCase()}`);
      count++;
      totalAmount += pledge.amount;
    }

    console.log('\n✨ All sample pledges created successfully!');
    console.log(`📊 Summary: ${count} pledges added, Total pledged: ${totalAmount.toLocaleString()} UGX`);
    console.log(`💰 Average pledge: ${Math.floor(totalAmount / count).toLocaleString()} UGX`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample pledges:', error.message);
    process.exit(1);
  }
}

addSamplePledges();
