import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AuthError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token, 'access');

    req.user = {
      ...payload,
      id: payload.userId,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'AUTH_ERROR',
      });
      return;
    }
  }
};

export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token, 'access');
      req.user = { ...payload, id: payload.userId };
    }
  } catch {
    // Silent: leave req.user unset; downstream logic decides whether auth was required.
  }
  next();
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'AUTH_ERROR',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};
