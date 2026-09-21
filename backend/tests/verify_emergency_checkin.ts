import io from 'socket.io-client';
import http from 'http';

declare const process: any;

const API_BASE = 'http://localhost:5002/api';
const SOCKET_BASE = 'http://localhost:5002';

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

async function runVerification() {
  console.log('--- 1. Authenticating Admin and Student ---');
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

  console.log(`✅ Admin Token: ${adminToken ? 'OK' : 'FAIL'}`);
  console.log(`✅ Student Token: ${studentToken ? 'OK' : 'FAIL'}`);

  console.log('\n--- 2. Connecting Student Socket to SafeRoute Backend ---');
  const studentSocket = io(SOCKET_BASE, {
    transports: ['websocket'],
    auth: { token: studentToken },
  });

  const coordinatorSocket = io(SOCKET_BASE, {
    transports: ['websocket'],
    auth: { token: adminToken },
  });

  const alertReceivedPromise = new Promise((resolve) => {
    studentSocket.on('alert:broadcast', (data) => {
      console.log('🚨 Student Socket Received alert:broadcast:', data.title);
      resolve(data);
    });
  });

  const checkinReceivedPromise = new Promise((resolve) => {
    coordinatorSocket.on('checkin:new', (data) => {
      console.log('📋 Coordinator Socket Received checkin:new for user:', data.user_id, 'status:', data.status);
      resolve(data);
    });
  });

  await new Promise((r) => setTimeout(r, 1000));

  console.log('\n--- 3. Admin Broadcasts Emergency Alert ---');
  const alertRes = await postJson(
    '/alerts',
    {
      title: 'Emergency Evacuation Drill - Level 3',
      message: 'Earthquake tremor detected. Evacuate to Central Oval immediately.',
      is_drill: true,
    },
    adminToken
  );
  console.log(`✅ Emergency Broadcast HTTP Status: ${alertRes.success ? 'SUCCESS' : 'FAILED'}`);
  const createdAlertId = alertRes.alert?.alert_id || alertRes.data?.alert_id;

  const receivedAlert: any = await Promise.race([
    alertReceivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for alert:broadcast')), 5000)),
  ]);
  console.log(`✅ Student received broadcast over Socket.IO (Alert ID: ${receivedAlert.alert_id})`);

  console.log('\n--- 4. Student Submits "I AM SAFE" Check-In ---');
  const checkinRes = await postJson(
    '/checkins',
    {
      alert_id: createdAlertId || receivedAlert.alert_id,
      status: 'safe',
      location: {
        type: 'Point',
        coordinates: [124.9675614, 6.2882333],
      },
      message: 'Checked in as safe via evacuation map test.',
    },
    studentToken
  );
  console.log(`✅ Check-in Response: ${checkinRes.success ? 'SUCCESS' : JSON.stringify(checkinRes)}`);

  const receivedCheckin: any = await Promise.race([
    checkinReceivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for checkin:new')), 5000)),
  ]);
  console.log(`✅ Coordinator received real-time check-in notification over Socket.IO (Status: ${receivedCheckin.status})`);

  studentSocket.disconnect();
  coordinatorSocket.disconnect();
  console.log('\n🎉 Complete End-to-End Emergency & "I AM SAFE" Check-In Flow Verified Successfully!');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
