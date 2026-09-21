import pool from '../config/db';

export interface SendSosData {
  senderId: number;
  alertId: number;
  content: string;
  location?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    type?: string;
    coordinates?: [number, number];
  };
  priority?: 'normal' | 'urgent' | 'critical';
}

export interface SosMessageRecord {
  message_id: number;
  alert_id: number;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  sender_department: string | null;
  receiver_id: number | null;
  receiver_name: string | null;
  content: string;
  is_read: boolean;
  priority: string;
  created_at: Date;
  location_geojson: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  latitude?: number | null;
  longitude?: number | null;
}

export class SosService {
  /**
   * Sends a new SOS emergency message from user.
   */
  static async sendSosMessage(data: SendSosData): Promise<SosMessageRecord> {
    const priority = data.priority || 'normal';
    let insertSql: string;
    let values: any[];

    let lng: number | undefined;
    let lat: number | undefined;

    if (data.location) {
      if (typeof data.location.longitude === 'number' && typeof data.location.latitude === 'number') {
        lng = data.location.longitude;
        lat = data.location.latitude;
      } else if (typeof (data.location as any).lng === 'number' && typeof (data.location as any).lat === 'number') {
        lng = (data.location as any).lng;
        lat = (data.location as any).lat;
      } else if (
        data.location.type === 'Point' &&
        Array.isArray(data.location.coordinates) &&
        data.location.coordinates.length >= 2
      ) {
        lng = data.location.coordinates[0];
        lat = data.location.coordinates[1];
      }
    }

    if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
      insertSql = `
        INSERT INTO sos_messages (alert_id, sender_id, content, location, priority)
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
        RETURNING message_id;
      `;
      values = [data.alertId, data.senderId, data.content.trim(), lng, lat, priority];
    } else {
      insertSql = `
        INSERT INTO sos_messages (alert_id, sender_id, content, priority)
        VALUES ($1, $2, $3, $4)
        RETURNING message_id;
      `;
      values = [data.alertId, data.senderId, data.content.trim(), priority];
    }

    const insertResult = await pool.query(insertSql, values);
    const messageId = insertResult.rows[0].message_id;

    return await SosService.getSosMessageById(messageId);
  }

  /**
   * Coordinator replies to a user's SOS message.
   */
  static async replySosMessage(coordinatorId: number, parentSosId: number, content: string): Promise<SosMessageRecord> {
    // 1. Fetch original SOS message details
    const parentRes = await pool.query(
      `SELECT alert_id, sender_id FROM sos_messages WHERE message_id = $1`,
      [parentSosId]
    );

    if (parentRes.rows.length === 0) {
      throw new Error(`Original SOS message with ID ${parentSosId} not found.`);
    }

    const alertId = parentRes.rows[0].alert_id;
    const recipientUserId = parentRes.rows[0].sender_id;

    // 2. Insert reply message
    const replyRes = await pool.query(
      `INSERT INTO sos_messages (alert_id, sender_id, receiver_id, content, priority, is_read)
       VALUES ($1, $2, $3, $4, 'normal', TRUE)
       RETURNING message_id`,
      [alertId, coordinatorId, recipientUserId, content.trim()]
    );

    // Also mark parent message as read
    await SosService.markAsRead(parentSosId);

    return await SosService.getSosMessageById(replyRes.rows[0].message_id);
  }

  /**
   * Gets single SOS message details by ID.
   */
  static async getSosMessageById(messageId: number): Promise<SosMessageRecord> {
    const result = await pool.query(
      `SELECT 
         sm.message_id,
         sm.alert_id,
         sm.sender_id,
         u_sender.full_name AS sender_name,
         u_sender.email AS sender_email,
         u_sender.role AS sender_role,
         u_sender.department AS sender_department,
         sm.receiver_id,
         u_recv.full_name AS receiver_name,
         sm.content,
         sm.is_read,
         sm.priority,
         sm.created_at,
         ST_AsGeoJSON(sm.location)::json AS location_geojson,
         ST_Y(sm.location) AS latitude,
         ST_X(sm.location) AS longitude
       FROM sos_messages sm
       LEFT JOIN users u_sender ON sm.sender_id = u_sender.user_id
       LEFT JOIN users u_recv ON sm.receiver_id = u_recv.user_id
       WHERE sm.message_id = $1`,
      [messageId]
    );

    return result.rows[0];
  }

  /**
   * Gets all SOS messages for a specific emergency alert.
   */
  static async getSosMessagesByAlert(alertId: number): Promise<SosMessageRecord[]> {
    const result = await pool.query(
      `SELECT 
         sm.message_id,
         sm.alert_id,
         sm.sender_id,
         u_sender.full_name AS sender_name,
         u_sender.email AS sender_email,
         u_sender.role AS sender_role,
         u_sender.department AS sender_department,
         sm.receiver_id,
         u_recv.full_name AS receiver_name,
         sm.content,
         sm.is_read,
         sm.priority,
         sm.created_at,
         ST_AsGeoJSON(sm.location)::json AS location_geojson,
         ST_Y(sm.location) AS latitude,
         ST_X(sm.location) AS longitude
       FROM sos_messages sm
       LEFT JOIN users u_sender ON sm.sender_id = u_sender.user_id
       LEFT JOIN users u_recv ON sm.receiver_id = u_recv.user_id
       WHERE sm.alert_id = $1
       ORDER BY sm.created_at ASC`,
      [alertId]
    );

    return result.rows;
  }

  /**
   * Gets the most recent SOS emergency distress messages across campus.
   * By default, returns only active/unread SOS signals (where is_read = FALSE).
   */
  static async getRecentSosMessages(limit: number = 50, unreadOnly: boolean = true): Promise<SosMessageRecord[]> {
    const whereClause = unreadOnly ? 'WHERE sm.is_read = FALSE' : '';
    const result = await pool.query(
      `SELECT 
         sm.message_id,
         sm.alert_id,
         sm.sender_id,
         u_sender.full_name AS sender_name,
         u_sender.email AS sender_email,
         u_sender.role AS sender_role,
         u_sender.department AS sender_department,
         sm.receiver_id,
         u_recv.full_name AS receiver_name,
         sm.content,
         sm.is_read,
         sm.priority,
         sm.created_at,
         ST_AsGeoJSON(sm.location)::json AS location_geojson,
         ST_Y(sm.location) AS latitude,
         ST_X(sm.location) AS longitude
       FROM sos_messages sm
       LEFT JOIN users u_sender ON sm.sender_id = u_sender.user_id
       LEFT JOIN users u_recv ON sm.receiver_id = u_recv.user_id
       ${whereClause}
       ORDER BY sm.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Marks an SOS message as read.
   */
  static async markAsRead(messageId: number): Promise<void> {
    await pool.query(
      `UPDATE sos_messages SET is_read = TRUE WHERE message_id = $1`,
      [messageId]
    );
  }
}
