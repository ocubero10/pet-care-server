import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User, { IUser, UserRole } from '../models/User';
import Pet from '../models/Pet';
import { generateToken, verifyToken } from '../utils/jwt';
import { AuthError, ConflictError, NotFoundError, ValidationError } from '../utils/errors';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  cedula?: string;
  petName?: string;
  petBreed?: string;
  petAge?: number;
  petSex?: 'male' | 'female';
  petWeight?: number;
  petCoatColor?: string;
  petAllergies?: string[];
  petVaccines?: string[];
}

interface LoginRequest {
  email: string;
  password: string;
}

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name,
    email,
    password,
    phone,
    role,
    cedula,
    petName,
    petBreed,
    petAge,
    petSex,
    petWeight,
    petCoatColor,
    petAllergies,
    petVaccines,
  } = req.body as RegisterRequest;

  // Account creation is restricted to staff. Exception: when no staff user exists yet,
  // open registration is allowed once so the system can bootstrap.
  const staffCount = await User.countDocuments({ role: 'staff', isActive: true });
  if (staffCount > 0) {
    if (!req.user) {
      throw new AuthError('Authentication required to create accounts');
    }
    if (req.user.role !== 'staff') {
      throw new ValidationError('Only staff can create accounts');
    }
  }

  // Validate required fields
  if (!name || !email || !password || !phone || !role) {
    throw new ValidationError('All fields are required');
  }

  // Owner-specific required fields
  if (role === 'owner' && (!cedula || !petName)) {
    throw new ValidationError('Cedula and pet name are required for pet owners');
  }

  // Check if user already exists by email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Check cedula uniqueness for owners
  if (role === 'owner' && cedula) {
    const existingCedula = await User.findOne({ cedula });
    if (existingCedula) {
      throw new ConflictError('Cedula already registered');
    }
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    phone,
    role,
    ...(role === 'owner' && cedula ? { cedula } : {}),
  });

  await user.save();

  // For owners, create the associated pet record (expediente)
  if (role === 'owner' && petName) {
    await Pet.create({
      ownerId: user._id,
      name: petName,
      breed: petBreed || 'Sin especificar',
      age: petAge ?? 0,
      size: 'small',
      sex: petSex || 'male',
      weight: petWeight ?? 0,
      coatColor: petCoatColor || 'Sin especificar',
      allergies: petAllergies || [],
      vaccines: petVaccines || [],
    });
  }

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

export const listClients = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const clients = await User.find({ role: 'owner', isActive: true })
    .select('_id name email phone cedula')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: clients,
  });
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.includeInactive !== 'true') filter.isActive = true;

  const users = await User.find(filter)
    .select('-password')
    .sort({ role: 1, name: 1 });

  res.json({ success: true, data: users });
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const { id } = req.params;
  const { name, email, phone, cedula, role, isActive, password } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    cedula?: string;
    role?: 'owner' | 'staff' | 'driver';
    isActive?: boolean;
    password?: string;
  };

  const user = await User.findById(id).select('+password');
  if (!user) throw new NotFoundError('User');

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('Email already registered');
  }
  if (cedula && cedula !== user.cedula) {
    const existing = await User.findOne({ cedula });
    if (existing) throw new ConflictError('Cedula already registered');
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (cedula !== undefined) user.cedula = cedula;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password; // pre('save') hook hashes it

  await user.save();

  const userObj = user.toObject();
  delete (userObj as { password?: string }).password;
  res.json({ success: true, message: 'User updated', data: userObj });
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const { id } = req.params;
  if (id === req.user.id) {
    throw new ValidationError('No podés eliminar tu propia cuenta');
  }

  // Last-active-staff guard: prevent deleting the only remaining staff.
  const target = await User.findById(id);
  if (!target) throw new NotFoundError('User');
  if (target.role === 'staff' && target.isActive) {
    const activeStaff = await User.countDocuments({ role: 'staff', isActive: true });
    if (activeStaff <= 1) {
      throw new ValidationError('No podés eliminar el último administrador activo');
    }
  }

  await User.findByIdAndUpdate(id, { isActive: false });
  res.json({ success: true, message: 'User deactivated' });
};
