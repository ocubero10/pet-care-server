import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Pet from '../models/Pet';
import { NotFoundError, ValidationError, ForbiddenError, AuthError } from '../utils/errors';

export const getPets = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const filter: Record<string, unknown> = { isActive: true };
  const requestedOwnerId = req.query.ownerId as string | undefined;

  if (req.user.role === 'staff') {
    // Staff sees all pets, optionally filtered to a specific client
    if (requestedOwnerId) filter.ownerId = requestedOwnerId;
  } else {
    // Owners only see their own; ownerId query param is ignored for them
    filter.ownerId = req.user.id;
  }

  const pets = await Pet.find(filter)
    .populate('ownerId', 'name email phone cedula')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: pets });
};

export const getPetById = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const { id } = req.params;
  const pet = await Pet.findById(id);

  if (!pet) {
    throw new NotFoundError('Pet');
  }

  // Check authorization - owner can view their pet
  if (pet.ownerId.toString() !== req.user.id && req.user.role !== 'staff') {
    throw new ForbiddenError('You cannot view this pet');
  }

  res.json({
    success: true,
    data: pet,
  });
};

export const createPet = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const {
    name,
    breed,
    age,
    size,
    sex,
    weight,
    coatColor,
    allergies,
    vaccines,
    specialNotes,
    profileImage,
    ownerId: bodyOwnerId,
  } = req.body;

  if (!name || !breed || age === undefined || !sex || weight === undefined || !coatColor) {
    throw new ValidationError(
      'Name, breed, age, sex, weight, and coat color are required'
    );
  }

  // Staff can create pets for any owner; otherwise the requester is the owner.
  const ownerId = req.user.role === 'staff' && bodyOwnerId ? bodyOwnerId : req.user.id;

  const pet = new Pet({
    ownerId,
    name,
    breed,
    age,
    size,
    sex,
    weight,
    coatColor,
    allergies,
    vaccines,
    specialNotes,
    profileImage,
  });

  await pet.save();

  res.status(201).json({
    success: true,
    message: 'Pet created successfully',
    data: pet,
  });
};

export const updatePet = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const { id } = req.params;
  const {
    name,
    breed,
    age,
    size,
    sex,
    weight,
    coatColor,
    allergies,
    vaccines,
    specialNotes,
    profileImage,
  } = req.body;

  const pet = await Pet.findById(id);
  if (!pet) {
    throw new NotFoundError('Pet');
  }

  // Check authorization
  if (pet.ownerId.toString() !== req.user.id && req.user.role !== 'staff') {
    throw new ForbiddenError('You cannot update this pet');
  }

  const updatedPet = await Pet.findByIdAndUpdate(
    id,
    { name, breed, age, size, sex, weight, coatColor, allergies, vaccines, specialNotes, profileImage },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Pet updated successfully',
    data: updatedPet,
  });
};

export const deletePet = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const { id } = req.params;

  const pet = await Pet.findById(id);
  if (!pet) {
    throw new NotFoundError('Pet');
  }

  // Check authorization
  if (pet.ownerId.toString() !== req.user.id) {
    throw new ForbiddenError('You cannot delete this pet');
  }

  // Soft delete
  await Pet.findByIdAndUpdate(id, { isActive: false });

  res.json({
    success: true,
    message: 'Pet deleted successfully',
  });
};
