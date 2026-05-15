import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      required: true,
      default: 'employee',
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, name: 1 });
userSchema.index({ role: 1, email: 1 });

export const User = mongoose.model('User', userSchema);
