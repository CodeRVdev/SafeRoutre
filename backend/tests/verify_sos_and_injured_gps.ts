import io from 'socket.io-client';

declare const process: any;

const API_BASE = 'http://localhost:5002/api';
const SOCKET_BASE = 'http://localhost:5002';

// STRICTLY TEST FIXTURES ONLY (Not hardcoded into mobile app)
const TEST_GPS_SOS = { latitude: 6.288512, longitude: 124.967834 };
const TEST_GPS_INJURED = {
  type: 'Point',
  coordinates: [124.967650, 6.288320], // GeoJSON standard [lng, lat]
};

async function postJson(endpoint: string, body: any, token?: string): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return (await res.json()) as any;
}

async function getJson(endpoint: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()) as any;
}

async function runGpsEmergencyVerification() {
  console.log('========================================================');
  console.log('🚨 VERIFYING REAL-TIME GPS SOS & INJURED DISTRESS FLOW');
  console.log('========================================================\n');

  console.log('--- 1. Authenticating Admin & Student Accounts ---');
  const adminLogin = await postJson('/auth/login', {
    email: 'admin@saferoute.edu',
    password: 'AdminPassword123!',
  });
  const adminToken = adminLogin.data?.token || adminLogin.token;

  const studentLogin = await postJson('/auth/login', {
    email: 'student@saferoute.edu',
    password: 'StudentPassword123!',
  });
  const studentToken = studentLogin.data?.token || studentLogin.token;

  if (!adminToken || !studentToken) {
    throw new Error('Authentication failed for test accounts');
  }
  console.log('✅ Admin & Student authentication successful.');

  console.log('\n--- 2. Setting up Coordinator Socket.IO Real-Time Listener ---');
  const coordinatorSocket = io(SOCKET_BASE, {
    transports: ['websocket'],
    auth: { token: adminToken },
  });

  await new Promise<void>((resolve, reject) => {
    coordinatorSocket.on('connect', () => {
      console.log('✅ Coordinator connected to Socket.IO (socket_id:', coordinatorSocket.id, ')');
      resolve();
    });
    coordinatorSocket.on('connect_error', (err) => reject(err));
  });

  // Promises for expected real-time events
  let sosPromiseResolve: (data: any) => void;
  const sosReceivedPromise = new Promise((resolve) => {
    sosPromiseResolve = resolve;
  });

  let injuredPromiseResolve: (data: any) => void;
  const injuredReceivedPromise = new Promise((resolve) => {
    injuredPromiseResolve = resolve;
  });

  let safePromiseResolve: (data: any) => void;
  const safeReceivedPromise = new Promise((resolve) => {
    safePromiseResolve = resolve;
  });

  coordinatorSocket.on('sos:new', (data) => {
    console.log(`📡 [Socket.IO] Received "sos:new" event:`, {
      message_id: data.message_id,
      sender: data.sender_name,
      lat: data.latitude,
      lng: data.longitude,
      priority: data.priority,
      content: data.content,
    });
    sosPromiseResolve(data);
  });

  coordinatorSocket.on('checkin:new', (data) => {
    console.log(`📡 [Socket.IO] Received "checkin:new" event:`, {
      checkin_id: data.checkin_id,
      user: data.full_name || data.user_name,
      status: data.status,
      lat: data.latitude,
      lng: data.longitude,
    });
    if (data.status === 'injured') {
      injuredPromiseResolve(data);
    } else if (data.status === 'safe') {
      safePromiseResolve(data);
    }
  });

  console.log('\n--- 3. Creating Active Emergency Alert ---');
  const alertRes = await postJson(
    '/alerts',
    {
      title: 'Active Drill — Emergency Response Verification',
      message: 'Testing GPS distress transmission for SOS and Injured signals.',
      is_drill: true,
    },
    adminToken
  );
  const alertId = alertRes.alert?.alert_id || alertRes.data?.alert_id;
  console.log(`✅ Alert created with alert_id = ${alertId}`);

  console.log('\n--- 4. Student Sends DISTRESS SOS with GPS Coordinates ---');
  const sosRes = await postJson(
    '/sos',
    {
      alert_id: alertId,
      content: 'Trapped near Room 10 STE — Need immediate evacuation assistance!',
      priority: 'urgent',
      location: TEST_GPS_SOS,
    },
    studentToken
  );
  console.log('✅ POST /api/sos response:', sosRes.success ? 'SUCCESS' : JSON.stringify(sosRes));

  const receivedSos: any = await Promise.race([
    sosReceivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for "sos:new"')), 5000)),
  ]);

  if (receivedSos.latitude !== TEST_GPS_SOS.latitude || receivedSos.longitude !== TEST_GPS_SOS.longitude) {
    throw new Error(`Coordinates mismatch in SOS socket event: expected ${JSON.stringify(TEST_GPS_SOS)}, received lat=${receivedSos.latitude}, lng=${receivedSos.longitude}`);
  }
  console.log('🎯 Verified: Real GPS coordinates correctly stored and emitted via "sos:new"!');

  console.log('\n--- 5. Student Submits "I AM INJURED" Check-In with GPS ---');
  const injuredRes = await postJson(
    '/checkins',
    {
      alert_id: alertId,
      status: 'injured',
      location: TEST_GPS_INJURED,
      message: 'Leg injury from fallen ceiling tile.',
    },
    studentToken
  );
  console.log('✅ POST /api/checkins (injured) response:', injuredRes.success ? 'SUCCESS' : JSON.stringify(injuredRes));

  const receivedInjured: any = await Promise.race([
    injuredReceivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for "checkin:new" (injured)')), 5000)),
  ]);

  if (receivedInjured.latitude !== TEST_GPS_INJURED.coordinates[1] || receivedInjured.longitude !== TEST_GPS_INJURED.coordinates[0]) {
    throw new Error(`Coordinates mismatch in injured checkin event: expected lat=${TEST_GPS_INJURED.coordinates[1]}, lng=${TEST_GPS_INJURED.coordinates[0]}, got lat=${receivedInjured.latitude}, lng=${receivedInjured.longitude}`);
  }
  console.log('🎯 Verified: Real GPS coordinates correctly stored and emitted via "checkin:new" for INJURED!');

  console.log('\n--- 6. Verifying Existing "I AM SAFE" Flow is Fully Intact ---');
  const safeRes = await postJson(
    '/checkins',
    {
      alert_id: alertId,
      status: 'safe',
      message: 'Checked in safe at Central Assembly Oval.',
    },
    studentToken
  );
  console.log('✅ POST /api/checkins (safe) response:', safeRes.success ? 'SUCCESS' : JSON.stringify(safeRes));

  const receivedSafe: any = await Promise.race([
    safeReceivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for "checkin:new" (safe)')), 5000)),
  ]);
  console.log('🎯 Verified: "I AM SAFE" check-in emitted and received by coordinator!');

  console.log('\n--- 7. Querying GET /api/sos for Web Admin Initial Marker Hydration ---');
  const getSosRes = await getJson('/sos', adminToken);
  console.log(`✅ GET /api/sos returned ${getSosRes.data?.length || 0} messages.`);
  const foundSos = (getSosRes.data || []).find((s: any) => s.message_id === receivedSos.message_id);
  if (!foundSos || !foundSos.latitude || !foundSos.longitude) {
    throw new Error('Recent SOS message not found with coordinates in GET /api/sos');
  }
  console.log('🎯 Verified: Web Admin can retrieve recent SOS markers with coordinates on map load.');

  coordinatorSocket.disconnect();
  console.log('\n========================================================');
  console.log('🎉 ALL GPS EMERGENCY SIGNAL FLOWS VERIFIED SUCCESSFULLY!');
  console.log('========================================================');
  process.exit(0);
}

runGpsEmergencyVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
