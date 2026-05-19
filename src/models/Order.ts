import mongoose, { Schema, Document } from 'mongoose';

export type ServiceType =
  | 'bath'
  | 'breed_cut'
  | 'nails'
  | 'ear_cleaning'
  | 'de_shedding'
  | 'hygienic_cut'
  | 'grooming'
  | 'haircut'
  | 'other';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'in_service'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export interface IOrderRequirements {
  grooming?: string;
  haircut?: string;
  nails?: string;
  bath?: string;
  otherRequirements?: string;
  temperamentNotes?: string;
  dietaryNeeds?: string;
  medicalConditions?: string;
}

export interface IOrder extends Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  services: ServiceType[];
  requirements: IOrderRequirements;
  status: OrderStatus;
  pickupDateTime: Date;
  estimatedCompletionTime: Date;
  actualCompletionTime?: Date;
  driverId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  coatCondition?: string;
  notes?: string;
  images?: string[];
  clarificationRequests?: Array<{
    id: string;
    question: string;
    answer?: string;
    askedAt: Date;
    answeredAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      required: [true, 'Pet ID is required'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    services: [
      {
        type: String,
        enum: [
          'bath',
          'breed_cut',
          'nails',
          'ear_cleaning',
          'de_shedding',
          'hygienic_cut',
          'grooming',
          'haircut',
          'other',
        ],
        required: true,
      },
    ],
    requirements: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'picked_up',
        'in_service',
        'completed',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    pickupDateTime: {
      type: Date,
      required: [true, 'Pickup date/time is required'],
    },
    estimatedCompletionTime: {
      type: Date,
      required: [true, 'Estimated completion time is required'],
    },
    actualCompletionTime: {
      type: Date,
      default: null,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    coatCondition: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    images: [String],
    clarificationRequests: [
      {
        id: String,
        question: String,
        answer: { type: String, required: false },
        askedAt: Date,
        answeredAt: { type: Date, required: false },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for queries
orderSchema.index({ ownerId: 1 });
orderSchema.index({ driverId: 1 });
orderSchema.index({ staffId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ pickupDateTime: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);
