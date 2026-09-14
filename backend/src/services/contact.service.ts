import pool from '../config/db';

export interface EmergencyContactData {
  name: string;
  organization?: string;
  phone: string;
  category?: 'fire' | 'medical' | 'police' | 'disaster' | 'school';
  is_active?: boolean;
  sort_order?: number;
}

export class ContactService {
  /**
   * Fetches all active emergency contacts ordered by sort_order.
   */
  static async getAllContacts(includeInactive = false) {
    const query = includeInactive
      ? `SELECT contact_id, name, organization, phone, category, is_active, sort_order, created_at
         FROM emergency_contacts ORDER BY sort_order ASC, name ASC`
      : `SELECT contact_id, name, organization, phone, category, is_active, sort_order, created_at
         FROM emergency_contacts WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC`;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Finds a contact by ID.
   */
  static async getContactById(contactId: number) {
    const result = await pool.query(
      `SELECT contact_id, name, organization, phone, category, is_active, sort_order, created_at
       FROM emergency_contacts WHERE contact_id = $1`,
      [contactId]
    );

    return result.rows[0] || null;
  }

  /**
   * Creates a new emergency contact.
   */
  static async createContact(data: EmergencyContactData) {
    const result = await pool.query(
      `INSERT INTO emergency_contacts (name, organization, phone, category, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING contact_id, name, organization, phone, category, is_active, sort_order, created_at`,
      [
        data.name,
        data.organization || null,
        data.phone,
        data.category || 'disaster',
        data.is_active ?? true,
        data.sort_order ?? 0,
      ]
    );

    return result.rows[0];
  }

  /**
   * Updates an existing emergency contact.
   */
  static async updateContact(contactId: number, data: Partial<EmergencyContactData>) {
    const existing = await this.getContactById(contactId);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const organization = data.organization !== undefined ? data.organization : existing.organization;
    const phone = data.phone !== undefined ? data.phone : existing.phone;
    const category = data.category !== undefined ? data.category : existing.category;
    const is_active = data.is_active !== undefined ? data.is_active : existing.is_active;
    const sort_order = data.sort_order !== undefined ? data.sort_order : existing.sort_order;

    const result = await pool.query(
      `UPDATE emergency_contacts
       SET name = $1, organization = $2, phone = $3, category = $4, is_active = $5, sort_order = $6
       WHERE contact_id = $7
       RETURNING contact_id, name, organization, phone, category, is_active, sort_order, created_at`,
      [name, organization, phone, category, is_active, sort_order, contactId]
    );

    return result.rows[0];
  }

  /**
   * Deletes an emergency contact.
   */
  static async deleteContact(contactId: number): Promise<boolean> {
    const result = await pool.query(`DELETE FROM emergency_contacts WHERE contact_id = $1 RETURNING contact_id`, [contactId]);
    return (result.rowCount ?? 0) > 0;
  }
}
