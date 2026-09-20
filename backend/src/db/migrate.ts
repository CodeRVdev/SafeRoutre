import fs from 'fs';
import path from 'path';
import pool from '../config/db';

export async function runMigrations() {
  console.log('🚀 Running SafeRoute Database Migrations...');
  
  // Ensure uploads directory structure exists
  const uploadsDir = path.join(__dirname, '../../uploads/hazards');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Enable PostGIS Extension
    console.log('📦 Enabling PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // 2. Create users table
    console.log('👤 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coordinator', 'student', 'faculty', 'staff')),
        id_number VARCHAR(50),
        department VARCHAR(100),
        device_token TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);

    // 3. Create zones table
    console.log('🗺️ Creating zones table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS zones (
        zone_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) CHECK (type IN ('safe_zone', 'evacuation_point')),
        geom GEOMETRY(Polygon, 4326),
        created_by INT REFERENCES users(user_id),
        capacity INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE zones ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 100;`);

    // 4. Create hazards table
    console.log('⚠️ Creating hazards table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS hazards (
        hazard_id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        description TEXT,
        location GEOMETRY(Point, 4326),
        severity VARCHAR(20) CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
        reported_by INT REFERENCES users(user_id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `);
    await client.query(`ALTER TABLE hazards ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);`);

    // 5. Create alerts table
    console.log('📢 Creating alerts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        alert_id SERIAL PRIMARY KEY,
        hazard_id INT REFERENCES hazards(hazard_id),
        title VARCHAR(150),
        message TEXT,
        sent_by INT REFERENCES users(user_id),
        sent_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        is_drill BOOLEAN DEFAULT FALSE
      );
    `);
    await client.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_drill BOOLEAN DEFAULT FALSE;`);

    // 6. Create checkins table
    console.log('✅ Creating checkins table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        checkin_id SERIAL PRIMARY KEY,
        alert_id INT REFERENCES alerts(alert_id),
        user_id INT REFERENCES users(user_id),
        zone_id INT REFERENCES zones(zone_id),
        checked_in_at TIMESTAMP DEFAULT NOW(),
        location GEOMETRY(Point, 4326),
        status VARCHAR(20) DEFAULT 'safe',
        message TEXT
      );
    `);
    await client.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'safe';`);
    await client.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS message TEXT;`);

    // 7. Create evacuation_reports table
    console.log('📊 Creating evacuation_reports table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS evacuation_reports (
        report_id SERIAL PRIMARY KEY,
        alert_id INT REFERENCES alerts(alert_id),
        total_users INT,
        checked_in_count INT,
        generated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Create activity_logs table
    console.log('📜 Creating activity_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(30),
        entity_id INT,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 9. Create sos_messages table
    console.log('🆘 Creating sos_messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_messages (
        message_id SERIAL PRIMARY KEY,
        alert_id INT REFERENCES alerts(alert_id) ON DELETE CASCADE,
        sender_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        receiver_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        location GEOMETRY(Point, 4326),
        is_read BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 10. Create emergency_contacts table
    console.log('📞 Creating emergency_contacts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        contact_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        category VARCHAR(50) DEFAULT 'disaster' CHECK (category IN ('fire', 'medical', 'police', 'disaster', 'school')),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 11. Create scheduled_drills table
    console.log('📅 Creating scheduled_drills table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_drills (
        drill_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
        alert_id INT REFERENCES alerts(alert_id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 12. Create user_device_tokens table for multi-device FCM push support
    console.log('📱 Creating user_device_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_device_tokens (
        token_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        device_token TEXT NOT NULL UNIQUE,
        platform VARCHAR(20) DEFAULT 'android',
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 13. Create PostGIS Spatial GIST & Performance Indexes
    console.log('⚡ Creating Spatial & Performance Indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST (geom);
      CREATE INDEX IF NOT EXISTS idx_hazards_location ON hazards USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_checkins_location ON checkins USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_sos_location ON sos_messages USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_hazards_status ON hazards (status);
      CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts (is_active);
      CREATE INDEX IF NOT EXISTS idx_checkins_alert_id ON checkins (alert_id);
      CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins (user_id);
      CREATE INDEX IF NOT EXISTS idx_sos_alert_id ON sos_messages (alert_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
    `);

    await client.query('COMMIT');
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Allow direct execution from CLI
if (require.main === module) {
  runMigrations().then(() => {
    pool.end();
  });
}
