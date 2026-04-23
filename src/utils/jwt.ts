import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: 'owner' | 'staff' | 'driver';
}

export const generateToken = (payload: JwtPayload, type: 'access' | 'refresh' = 'access'): string => {
  const secret =
    type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
  const expiresIn = type === 'access' ? process.env.JWT_EXPIRE : process.env.JWT_REFRESH_EXPIRE;

  if (!secret) {
    throw new Error(`${type} JWT secret is not set`);
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn || (type === 'access' ? '7d' : '30d'),
  } as jwt.SignOptions);
};

export const verifyToken = (token: string, type: 'access' | 'refresh' = 'access'): JwtPayload => {
  const secret = type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error(`${type} JWT secret is not set`);
  }

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new Error(`Invalid or expired ${type} token`);
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
