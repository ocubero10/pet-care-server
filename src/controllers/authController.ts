import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User, { IUser, UserRole } from '../models/User';
import { generateToken, verifyToken } from '../utils/jwt';
import { AuthError, ConflictError, ValidationError } from '../utils/errors';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, phone, role } = req.body as RegisterRequest;

  // Validate required fields
  if (!name || !email || !password || !phone || !role) {
    throw new ValidationError('All fields are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    phone,
    role,
  });

  await user.save();

  // Generate tokens
  const accessToken = generateToken({ userId: user._id.toString(), role: user.role }, 'access');
  const refreshToken = generateToken(
    { userId: user._id.toString(), role: user.role },
    'refresh'
  );

  // Return response (without password)
  const { password: _, ...userObj } = user.toObject();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userObj,
      token: accessToken,
      refreshToken,
    },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequest;

  // Validate inputs
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user and select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthError('User account is disabled');
  }

  // Compare passwords
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthError('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateToken({ userId: user._id.toString(), role: user.role }, 'access');
  const refreshToken = generateToken(
    { userId: user._id.toString(), role: user.role },
    'refresh'
  );

  // Return response (without password)
  const { password: _, ...userObj } = user.toObject();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userObj,
      token: accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthError('Refresh token is required');
  }

  // Verify refresh token
  const payload = verifyToken(refreshToken, 'refresh');

  // Get user
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AuthError('User not found');
  }

  // Generate new access token
  const newAccessToken = generateToken(
    { userId: user._id.toString(), role: user.role },
    'access'
  );

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newAccessToken,
    },
  });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthError('User not authenticated');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AuthError('User not found');
  }

  const { password: _, ...userObj } = user.toObject();

  res.json({
    success: true,
    data: userObj,
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthError('User not authenticated');
  }

  const { name, phone, profileImage } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, profileImage },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AuthError('User not found');
  }

  const { password: _, ...userObj } = user.toObject();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: userObj,
  });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
};
