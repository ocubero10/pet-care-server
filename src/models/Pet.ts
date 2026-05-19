import mongoose, { Schema, Document } from 'mongoose';

export type PetSize = 'small' | 'medium' | 'large';
export type PetSex = 'male' | 'female';

export interface IPet extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  breed: string;
  age: number;
  size?: PetSize;
  sex: PetSex;
  weight: number;
  coatColor: string;
  allergies?: string[];
  vaccines?: string[];
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
      default: 'small',
    },
    sex: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Sex is required'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: 0,
    },
    coatColor: {
      type: String,
      required: [true, 'Coat color is required'],
      trim: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    vaccines: {
      type: [String],
      default: [],
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
