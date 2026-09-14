import pool from '../config/db';

export async function addStatusAndMessageToCheckins() {
  console.log('🚀 Running migration: Add status and message columns to checkins table...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'safe';`);
    await client.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS message TEXT;`);
    await client.query('COMMIT');
    console.log('✅ Migration add_status_and_message_to_checkins completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration add_status_and_message_to_checkins failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addStatusAndMessageToCheckins().then(() => {
    pool.end();
  });
}
