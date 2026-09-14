import pool from '../config/db';
import bcrypt from 'bcryptjs';

export async function runSeed() {
  console.log('🌱 Seeding SafeRoute Database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saltRounds = 10;

    // Seed Admin
    const adminEmail = 'admin@saferoute.edu';
    const adminPassHash = await bcrypt.hash('AdminPassword123!', saltRounds);
    
    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, id_number, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, ['System Admin', adminEmail, adminPassHash, 'admin', 'ADM-001', 'Emergency Management']);

    // Seed Coordinator
    const coordEmail = 'coordinator@saferoute.edu';
    const coordPassHash = await bcrypt.hash('CoordinatorPassword123!', saltRounds);

    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, id_number, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, ['Campus Safety Coordinator', coordEmail, coordPassHash, 'coordinator', 'CRD-001', 'Safety & Disaster Response']);

    // Seed Student Accounts
    const studentPassHash = await bcrypt.hash('StudentPassword123!', saltRounds);
    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, id_number, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, ['Juan Dela Cruz', 'student@saferoute.edu', studentPassHash, 'student', 'PNHS-2026-001', 'Grade 10 - Sampaguita']);

    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, id_number, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, ['Maria Santos', 'student@polonoling.edu.ph', studentPassHash, 'student', 'PNHS-2026-042', 'Grade 10 - Sampaguita']);

    // Seed Sample Zone for Polonoling National High School (Evacuation Point)
    const adminUser = await client.query(`SELECT user_id FROM users WHERE email = $1;`, [adminEmail]);
    const adminId = adminUser.rows[0]?.user_id;

    if (adminId) {
      const LAT_REF = 6.2882333;
      const LNG_REF = 124.9675614;

      const zonesToSeed = [
        {
          name: 'Polonoling NHS Main Oval Evacuation Area',
          type: 'evacuation_point',
          coords: [
            [LNG_REF - 0.0005, LAT_REF - 0.0004],
            [LNG_REF + 0.0005, LAT_REF - 0.0004],
            [LNG_REF + 0.0005, LAT_REF + 0.0004],
            [LNG_REF - 0.0005, LAT_REF + 0.0004],
            [LNG_REF - 0.0005, LAT_REF - 0.0004]
          ]
        },
        {
          name: 'JHS Building (North)',
          type: 'safe_zone',
          coords: [
            [LNG_REF - 0.0003, LAT_REF + 0.0007], [LNG_REF + 0.0001, LAT_REF + 0.0007], [LNG_REF + 0.0001, LAT_REF + 0.0009], [LNG_REF - 0.0003, LAT_REF + 0.0009], [LNG_REF - 0.0003, LAT_REF + 0.0007]
          ]
        },
        {
          name: 'SHS Building (North)',
          type: 'safe_zone',
          coords: [
            [LNG_REF - 0.0007, LAT_REF + 0.0007], [LNG_REF - 0.0004, LAT_REF + 0.0007], [LNG_REF - 0.0004, LAT_REF + 0.0009], [LNG_REF - 0.0007, LAT_REF + 0.0009], [LNG_REF - 0.0007, LAT_REF + 0.0007]
          ]
        },
        {
          name: 'SCHOOL GYM',
          type: 'safe_zone',
          coords: [
            [LNG_REF + 0.0003, LAT_REF + 0.0007], [LNG_REF + 0.0008, LAT_REF + 0.0007], [LNG_REF + 0.0008, LAT_REF + 0.0010], [LNG_REF + 0.0003, LAT_REF + 0.0010], [LNG_REF + 0.0003, LAT_REF + 0.0007]
          ]
        },
        {
          name: 'BOD Building',
          type: 'safe_zone',
          coords: [
            [LNG_REF - 0.0009, LAT_REF - 0.0003], [LNG_REF - 0.0007, LAT_REF - 0.0003], [LNG_REF - 0.0007, LAT_REF + 0.0004], [LNG_REF - 0.0009, LAT_REF + 0.0004], [LNG_REF - 0.0009, LAT_REF - 0.0003]
          ]
        },
        {
          name: 'SCHOOL CLINIC',
          type: 'safe_zone',
          coords: [
            [LNG_REF - 0.0007, LAT_REF - 0.0008], [LNG_REF - 0.0005, LAT_REF - 0.0008], [LNG_REF - 0.0005, LAT_REF - 0.0006], [LNG_REF - 0.0007, LAT_REF - 0.0006], [LNG_REF - 0.0007, LAT_REF - 0.0008]
          ]
        },
        {
          name: 'SHS Building (South)',
          type: 'safe_zone',
          coords: [
            [LNG_REF - 0.0003, LAT_REF - 0.0007], [LNG_REF + 0.0002, LAT_REF - 0.0007], [LNG_REF + 0.0002, LAT_REF - 0.0005], [LNG_REF - 0.0003, LAT_REF - 0.0005], [LNG_REF - 0.0003, LAT_REF - 0.0007]
          ]
        },
        {
          name: 'ADMIN Building',
          type: 'safe_zone',
          coords: [
            [LNG_REF + 0.0005, LAT_REF - 0.0004], [LNG_REF + 0.0007, LAT_REF - 0.0004], [LNG_REF + 0.0007, LAT_REF - 0.0001], [LNG_REF + 0.0005, LAT_REF - 0.0001], [LNG_REF + 0.0005, LAT_REF - 0.0004]
          ]
        }
      ];

      for (const zone of zonesToSeed) {
        const zoneGeoJSON = JSON.stringify({
          type: 'Polygon',
          coordinates: [zone.coords]
        });

        const existingZone = await client.query(`SELECT zone_id FROM zones WHERE name = $1;`, [zone.name]);

        if (existingZone.rows.length === 0) {
          await client.query(`
            INSERT INTO zones (name, type, geom, created_by)
            VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4);
          `, [zone.name, zone.type, zoneGeoJSON, adminId]);
        }
      }

      // Seed Sample Active Hazard (Debris near pathway)
      const hazardPointGeoJSON = JSON.stringify({
        type: 'Point',
        coordinates: [LNG_REF - 0.0002, LAT_REF + 0.0002]
      });

      const hazardDesc = 'Fallen tree blocking pathway near Grade 10 building';
      const existingHazard = await client.query(`SELECT hazard_id FROM hazards WHERE description = $1;`, [hazardDesc]);
      let hazardId: number;

      if (existingHazard.rows.length === 0) {
        const hazardResult = await client.query(`
          INSERT INTO hazards (type, description, location, severity, reported_by, status)
          VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5, 'active')
          RETURNING hazard_id;
        `, ['Structural Debris', hazardDesc, hazardPointGeoJSON, 'high', adminId]);
        hazardId = hazardResult.rows[0].hazard_id;
      } else {
        hazardId = existingHazard.rows[0].hazard_id;
      }

      // Seed Sample Emergency Alert
      const alertTitle = 'EMERGENCY EVACUATION: Polonoling NHS Main Campus';
      const existingAlert = await client.query(`SELECT alert_id FROM alerts WHERE title = $1;`, [alertTitle]);
      let alertId: number;

      if (existingAlert.rows.length === 0) {
        const alertResult = await client.query(`
          INSERT INTO alerts (hazard_id, title, message, sent_by, is_active)
          VALUES ($1, $2, $3, $4, TRUE)
          RETURNING alert_id;
        `, [hazardId, alertTitle, 'Please proceed immediately to the Main Oval Evacuation Area due to falling debris.', adminId]);
        alertId = alertResult.rows[0].alert_id;
      } else {
        alertId = existingAlert.rows[0].alert_id;
      }

      const studentUser = await client.query(`SELECT user_id FROM users WHERE email = 'student@saferoute.edu';`);
      const studentId = studentUser.rows[0]?.user_id;

      if (studentId && alertId) {
        const studentLocationPoint = JSON.stringify({
          type: 'Point',
          coordinates: [124.9505, 6.3612]
        });

        const existingCheckin = await client.query(`SELECT checkin_id FROM checkins WHERE alert_id = $1 AND user_id = $2;`, [alertId, studentId]);
        if (existingCheckin.rows.length === 0) {
          await client.query(`
            INSERT INTO checkins (alert_id, user_id, zone_id, location)
            VALUES ($1, $2, 1, ST_GeomFromGeoJSON($3));
          `, [alertId, studentId, studentLocationPoint]);
        }
      }

      // Seed Tupi, South Cotabato Emergency Contacts
      const seedContacts = [
        { name: 'National Emergency Hotline', org: 'Philippine National Emergency Center', phone: '911', category: 'disaster', sort_order: 1 },
        { name: 'Tupi MDRRMO Hotline', org: 'Municipal Disaster Risk Reduction Management Office', phone: '(083) 228-1500', category: 'disaster', sort_order: 2 },
        { name: 'Tupi MDRRMO Rescue Mobile', org: 'Tupi Disaster Response Team', phone: '0917-123-4567', category: 'disaster', sort_order: 3 },
        { name: 'Bureau of Fire Protection (BFP) Tupi', org: 'Tupi Fire Station', phone: '(083) 228-1999', category: 'fire', sort_order: 4 },
        { name: 'Tupi PNP Police Station', org: 'Philippine National Police - Tupi', phone: '(083) 228-1111', category: 'police', sort_order: 5 },
        { name: 'Tupi PNP Mobile Dispatch', org: 'PNP Patrol Unit', phone: '0998-598-6721', category: 'police', sort_order: 6 },
        { name: 'Tupi Rural Health Unit (RHU)', org: 'Tupi Municipal Health Center', phone: '(083) 228-1234', category: 'medical', sort_order: 7 },
        { name: 'South Cotabato Provincial Hospital', org: 'Provincial Medical Center', phone: '(083) 228-2000', category: 'medical', sort_order: 8 },
        { name: 'Red Cross South Cotabato Chapter', org: 'Philippine Red Cross', phone: '(083) 228-3333', category: 'medical', sort_order: 9 },
        { name: 'Polonoling Barangay Hall & Tanod Hotline', org: 'Barangay Polonoling LGU', phone: '0918-444-5555', category: 'school', sort_order: 10 },
        { name: 'Polonoling NHS Safety Clinic', org: 'Polonoling National High School', phone: '0920-111-2222', category: 'school', sort_order: 11 },
      ];

      for (const contact of seedContacts) {
        const existing = await client.query(`SELECT contact_id FROM emergency_contacts WHERE name = $1;`, [contact.name]);
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO emergency_contacts (name, organization, phone, category, is_active, sort_order)
             VALUES ($1, $2, $3, $4, TRUE, $5);`,
            [contact.name, contact.org, contact.phone, contact.category, contact.sort_order]
          );
        }
      }

      // Seed Scheduled Evacuation Drills
      const coordinatorRes = await client.query(`SELECT user_id FROM users WHERE role = 'coordinator' LIMIT 1;`);
      const coordId = coordinatorRes.rows[0]?.user_id || 1;

      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 3); // 3 days from now
      upcomingDate.setHours(10, 0, 0, 0);

      const nextMonthDate = new Date();
      nextMonthDate.setDate(nextMonthDate.getDate() + 25); // 25 days from now
      nextMonthDate.setHours(14, 30, 0, 0);

      const sampleDrills = [
        {
          title: 'Q3 Campus-Wide Earthquake Evacuation Drill',
          description: 'Quarterly practice evacuation drill for all senior & junior high school students and faculty.',
          date: upcomingDate,
          status: 'scheduled',
        },
        {
          title: 'Annual Fire Emergency Response Drill',
          description: 'Simulated fire hazard drill in the Science & Computer Laboratory buildings in coordination with BFP Tupi.',
          date: nextMonthDate,
          status: 'scheduled',
        },
      ];

      for (const drill of sampleDrills) {
        const existingDrill = await client.query(`SELECT drill_id FROM scheduled_drills WHERE title = $1;`, [drill.title]);
        if (existingDrill.rows.length === 0) {
          await client.query(
            `INSERT INTO scheduled_drills (title, description, scheduled_date, status, created_by)
             VALUES ($1, $2, $3, $4, $5);`,
            [drill.title, drill.description, drill.date, drill.status, coordId]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');
    console.log('  - Seeded Admin: admin@saferoute.edu / AdminPassword123!');
    console.log('  - Seeded Coordinator: coordinator@saferoute.edu / CoordinatorPassword123!');
    console.log('  - Seeded Students: student@saferoute.edu & student@polonoling.edu.ph / StudentPassword123!');
    console.log('  - Seeded Sample Zone, Active Hazard, Emergency Alert, Check-in, Emergency Contacts, and Scheduled Drills');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  } finally {
    client.release();
  }
}

// Allow direct execution from CLI
if (require.main === module) {
  runSeed().then(() => {
    pool.end();
  });
}
