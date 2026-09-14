import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * JWT Verification Middleware
 * Rejects requests without a valid Bearer token and exposes req.user with { user_id, role }.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required. Please provide Authorization header as Bearer <token>.',
    });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Role-Check Middleware Helper
 * Reusable middleware that restricts endpoint access to specified roles.
 * Usage: requireRole('admin', 'coordinator')
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};
