import admin, { firebaseAdmin } from '../config/firebase';

export class FcmService {
  /**
   * Sends an FCM push notification to a single mobile device token.
   */
  static async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string | null> {
    if (!firebaseAdmin || !deviceToken || deviceToken.trim() === '') {
      console.log('ℹ️ FCM Notification skipped (SDK not initialized or empty device token).');
      return null;
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'emergency_channel',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`📱 FCM Push Notification sent successfully to token: ${deviceToken.slice(0, 10)}... (ID: ${response})`);
      return response;
    } catch (error) {
      console.error(`❌ FCM Push Notification failed for token ${deviceToken.slice(0, 10)}...:`, error);
      return null;
    }
  }

  /**
   * Sends a batch FCM push notification to multiple device tokens.
   */
  static async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<number> {
    const validTokens = deviceTokens.filter((t) => !!t && t.trim() !== '');

    if (!firebaseAdmin || validTokens.length === 0) {
      console.log(`ℹ️ FCM Multicast skipped (${validTokens.length} valid tokens, SDK initialized: ${!!firebaseAdmin}).`);
      return 0;
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: validTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'emergency_channel',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`📱 Batch FCM Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${validTokens.length} devices.`);

      // Automatically prune dead/invalid device tokens from database
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errCode = resp.error.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(validTokens[idx]);
            }
          }
        });
        if (invalidTokens.length > 0) {
          console.log(`🧹 Pruning ${invalidTokens.length} expired/invalid FCM device tokens...`);
          // Dynamic import to avoid circular dependency
          import('./auth.service').then(({ AuthService }) => {
            AuthService.removeInvalidTokens(invalidTokens);
          }).catch((err) => console.error('Failed to prune tokens:', err));
        }
      }

      return response.successCount;
    } catch (error) {
      console.error('❌ Batch FCM Multicast failed:', error);
      return 0;
    }
  }
}
