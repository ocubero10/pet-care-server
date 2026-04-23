import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Pet from '../models/Pet';
import { NotFoundError, ValidationError, ForbiddenError, AuthError } from '../utils/errors';

export const getPets = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  const ownerId = (req.query.ownerId as string) || req.user.id;
  const pets = await Pet.find({ ownerId, isActive: true });

  res.json({
    success: true,
    data: pets,
  });
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

  const { name, breed, age, size, specialNotes, profileImage } = req.body;

  if (!name || !breed || age === undefined || !size) {
    throw new ValidationError('Name, breed, age, and size are required');
  }

  const pet = new Pet({
    ownerId: req.user.id,
    name,
    breed,
    age,
    size,
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
  const { name, breed, age, size, specialNotes, profileImage } = req.body;

  const pet = await Pet.findById(id);
  if (!pet) {
    throw new NotFoundError('Pet');
  }

  // Check authorization
  if (pet.ownerId.toString() !== req.user.id) {
    throw new ForbiddenError('You cannot update this pet');
  }

  const updatedPet = await Pet.findByIdAndUpdate(
    id,
    { name, breed, age, size, specialNotes, profileImage },
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
