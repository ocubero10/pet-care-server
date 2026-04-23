import mongoose, { Schema, Document } from 'mongoose';

export type PetSize = 'small' | 'medium' | 'large';

export interface IPet extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  breed: string;
  age: number;
  size: PetSize;
  specialNotes?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const petSchema = new Schema<IPet>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Pet name is required'],
      trim: true,
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: 0,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: [true, 'Size is required'],
    },
    specialNotes: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for owner queries
petSchema.index({ ownerId: 1 });

export default mongoose.model<IPet>('Pet', petSchema);
