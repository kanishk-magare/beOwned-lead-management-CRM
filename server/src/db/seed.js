const { pool } = require('../config/db');

const leads = [
  ['Aarav Sharma', '9876543210', 'aarav.sharma@example.com', 7500000, 'Whitefield, Bangalore', '2 BHK', 'Facebook', 'New', 1],
  ['Priya Nair', '9823456710', 'priya.nair@example.com', 12500000, 'Koramangala, Bangalore', '3 BHK', 'Google', 'Contacted', 3],
  ['Rohan Mehta', '9811122233', 'rohan.mehta@example.com', 4500000, 'Hinjewadi, Pune', '1 BHK', 'Referral', 'Site Visit', 6],
  ['Sneha Iyer', '9900112233', 'sneha.iyer@example.com', 25000000, 'Bandra West, Mumbai', '3 BHK', 'Website', 'Closed', 12],
  ['Vikram Singh', '9812345678', 'vikram.singh@example.com', 9000000, 'Sector 62, Noida', 'Plot', 'Google', 'Contacted', 4],
  ['Ananya Gupta', '9765432109', 'ananya.gupta@example.com', 6200000, 'Gachibowli, Hyderabad', '2 BHK', 'Instagram', 'New', 0],
  ['Karan Malhotra', '9988776655', 'karan.m@example.com', 38000000, 'Golf Course Road, Gurgaon', '4+ BHK', 'Referral', 'Site Visit', 8],
  ['Meera Reddy', '9123456780', 'meera.reddy@example.com', 15500000, 'Jubilee Hills, Hyderabad', 'Villa', 'Facebook', 'Closed', 20],
  ['Arjun Das', '9234567810', 'arjun.das@example.com', 5500000, 'New Town, Kolkata', '2 BHK', 'Walk-in', 'New', 2],
  ['Ishita Kapoor', '9345678120', 'ishita.k@example.com', 21000000, 'Powai, Mumbai', '3 BHK', 'Google', 'Contacted', 5],
  ['Rahul Verma', '9456781230', 'rahul.verma@example.com', 3200000, 'Electronic City, Bangalore', '1 BHK', 'Facebook', 'New', 1],
  ['Divya Menon', '9567812340', 'divya.menon@example.com', 18000000, 'Kakkanad, Kochi', 'Villa', 'Website', 'Site Visit', 10],
];

const notes = {
  'Priya Nair': ['Called — prefers east-facing flat, near metro.', 'Sent brochure for Prestige Lakeside.'],
  'Rohan Mehta': ['Site visit scheduled for Saturday 11 AM.'],
  'Sneha Iyer': ['Booking amount received. Agreement signed.'],
  'Karan Malhotra': ['Wants gated community with clubhouse. Very high intent.'],
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE lead_notes, leads RESTART IDENTITY CASCADE');

    for (const [name, phone, email, budget, location, propertyType, source, status, daysAgo] of leads) {
      const { rows } = await client.query(
        `INSERT INTO leads (name, phone, email, budget, location, property_type, source, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' days')::interval, NOW() - ($9 || ' days')::interval)
         RETURNING id`,
        [name, phone, email, budget, location, propertyType, source, status, String(daysAgo)]
      );
      for (const content of notes[name] || []) {
        await client.query('INSERT INTO lead_notes (lead_id, content) VALUES ($1, $2)', [rows[0].id, content]);
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${leads.length} leads`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = seed;
