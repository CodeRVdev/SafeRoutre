import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let firebaseAdminApp: admin.app.App | null = null;

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../../config/serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin SDK initialized successfully!');
  } else {
    console.warn(
      `⚠️ Firebase Admin SDK not initialized: Service account credentials missing at ${serviceAccountPath}. ` +
        `Place real serviceAccountKey.json file in backend/config/ to enable FCM push notifications.`
    );
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Firebase Admin SDK:', error);
}

export const firebaseAdmin = firebaseAdminApp;
export default admin;
