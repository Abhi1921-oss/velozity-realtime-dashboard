import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required before checking role permissions.',
          code: 'UNAUTHENTICATED',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    next();
  };
};
