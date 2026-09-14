import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';

const VALID_CATEGORIES = ['fire', 'medical', 'police', 'disaster', 'school'];

export class ContactController {
  /**
   * GET /api/emergency-contacts
   * Lists all active emergency contacts (or all if includeInactive=true for admins).
   */
  static async getContacts(req: Request, res: Response) {
    try {
      const includeInactive = req.query.all === 'true' && (req.user?.role === 'admin' || req.user?.role === 'coordinator');
      const contacts = await ContactService.getAllContacts(includeInactive);

      return res.status(200).json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      console.error('Error in getContacts controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency contacts.',
      });
    }
  }

  /**
   * POST /api/emergency-contacts
   * Creates a new emergency contact (admin/coordinator only).
   */
  static async createContact(req: Request, res: Response) {
    try {
      const { name, organization, phone, category, is_active, sort_order } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "name" is required and must be a non-empty string.',
        });
      }

      if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "phone" is required and must be a non-empty string.',
        });
      }

      if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}.`,
        });
      }

      const newContact = await ContactService.createContact({
        name: name.trim(),
        organization: organization ? String(organization).trim() : undefined,
        phone: phone.trim(),
        category: category ? (category.toLowerCase() as any) : 'disaster',
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency contact created successfully.',
        data: newContact,
      });
    } catch (error) {
      console.error('Error in createContact controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating emergency contact.',
      });
    }
  }

  /**
   * PUT /api/emergency-contacts/:id
   * Updates an existing emergency contact (admin/coordinator only).
   */
  static async updateContact(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact ID parameter.',
        });
      }

      const { name, organization, phone, category, is_active, sort_order } = req.body;

      if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}.`,
        });
      }

      const updated = await ContactService.updateContact(contactId, {
        name: name ? String(name).trim() : undefined,
        organization: organization !== undefined ? String(organization).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        category: category ? (category.toLowerCase() as any) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : undefined,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Emergency contact with ID ${contactId} not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Emergency contact updated successfully.',
        data: updated,
      });
    } catch (error) {
      console.error('Error in updateContact controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating emergency contact.',
      });
    }
  }

  /**
   * DELETE /api/emergency-contacts/:id
   * Deletes an emergency contact (admin/coordinator only).
   */
  static async deleteContact(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact ID parameter.',
        });
      }

      const deleted = await ContactService.deleteContact(contactId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Emergency contact with ID ${contactId} not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Emergency contact deleted successfully.',
      });
    } catch (error) {
      console.error('Error in deleteContact controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deleting emergency contact.',
      });
    }
  }
}
