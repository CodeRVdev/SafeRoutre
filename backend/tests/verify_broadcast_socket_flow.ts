import io from 'socket.io-client';
import http from 'http';
import { AuthService } from '../src/services/auth.service';

const SERVER_URL = 'http://127.0.0.1:5002';

async function request(
  method: string,
  path: string,
  token: string,
  body?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runBroadcastVerification() {
  console.log('🚀 Starting SafeRoute Real-Time Alert Broadcast Verification Test...');

  const adminToken = AuthService.generateToken(7, 'admin');
  const studentToken = AuthService.generateToken(10, 'student');

  console.log('1. Connecting Mobile Client Socket (student token)...');
  const mobileSocket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    auth: { token: studentToken },
  });

  await new Promise<void>((resolve, reject) => {
    mobileSocket.on('connect', () => {
      console.log('✅ Mobile Client Socket Connected:', mobileSocket.id);
      resolve();
    });
    mobileSocket.on('connect_error', (err) => {
      console.error('❌ Mobile Socket Connect Error:', err.message);
      reject(err);
    });
  });

  console.log('2. Setting up mobile listener for alert:broadcast...');
  const broadcastPromise = new Promise<any>((resolve) => {
    mobileSocket.on('alert:broadcast', (data) => {
      console.log('🚨 Mobile Socket Received alert:broadcast event:', data);
      resolve(data);
    });
  });

  const testTitle = `AUTOMATED_TEST_ALERT_${Date.now()}`;
  const testMessage = 'Immediate campus evacuation test broadcast.';

  console.log('3. Admin creating and broadcasting alert via POST /api/alerts...');
  const createRes = await request('POST', '/api/alerts', adminToken, {
    title: testTitle,
    message: testMessage,
    is_drill: false,
  });

  console.log('Admin POST Response:', createRes.status, createRes.body);
  if (createRes.status !== 201) {
    throw new Error(`Failed to create alert: ${JSON.stringify(createRes.body)}`);
  }

  const createdAlertId = createRes.body.alert.alert_id;
  console.log(`Created alert ID: ${createdAlertId}`);

  console.log('4. Awaiting real-time alert:broadcast event on mobile client...');
  const receivedBroadcast = await Promise.race([
    broadcastPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout waiting for alert:broadcast on mobile')), 5000)
    ),
  ]);

  if (receivedBroadcast.title !== testTitle || receivedBroadcast.alert_id !== createdAlertId) {
    throw new Error(`Broadcast payload mismatch: expected title "${testTitle}", received "${receivedBroadcast.title}"`);
  }
  console.log('✅ Verified: Mobile client received exact alert:broadcast in real-time!');

  console.log('5. Setting up mobile listener for alert:resolved...');
  const resolvedPromise = new Promise<any>((resolve) => {
    mobileSocket.on('alert:resolved', (data) => {
      console.log('ℹ️ Mobile Socket Received alert:resolved event:', data);
      resolve(data);
    });
  });

  console.log(`6. Admin deactivating alert #${createdAlertId} via PATCH /api/alerts/${createdAlertId}/deactivate...`);
  const deactivateRes = await request(
    'PATCH',
    `/api/alerts/${createdAlertId}/deactivate`,
    adminToken
  );
  console.log('Admin PATCH Response:', deactivateRes.status, deactivateRes.body);

  console.log('7. Awaiting real-time alert:resolved event on mobile client...');
  const receivedResolved = await Promise.race([
    resolvedPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout waiting for alert:resolved on mobile')), 5000)
    ),
  ]);

  if (Number(receivedResolved.alert_id) !== createdAlertId) {
    throw new Error(`Resolved payload mismatch: expected alert_id ${createdAlertId}, got ${receivedResolved.alert_id}`);
  }
  console.log('✅ Verified: Mobile client received exact alert:resolved in real-time!');

  mobileSocket.disconnect();
  console.log('================================================================');
  console.log('🎉 REAL-TIME SOCKET.IO ALERT BROADCAST & RESOLVED TEST PASSED!');
  console.log('================================================================');
}

runBroadcastVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
