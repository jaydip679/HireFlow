import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    passwordHash: {
      type:     String,
      required: true,
      select:   false,    // NEVER returned in queries by default
    },

    role: {
      type:    String,
      enum:    ['applicant', 'employer', 'admin'],
      default: 'applicant',
    },

    // Profile fields
    avatar: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },  // Cloudinary public_id for deletion
    },

    headline: {
      type:      String,
      maxlength: [120, 'Headline cannot exceed 120 characters'],
      default:   null,
    },

    bio: {
      type:      String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default:   null,
    },

    skills: {
      type:    [String],
      default: [],
    },

    // Applicant-only
    resume: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // Employer-only
    company: {
      name:    { type: String, default: null },
      website: { type: String, default: null },
      logo:    {
        url:      { type: String, default: null },
        publicId: { type: String, default: null },
      },
    },

    // Account state
    isVerified: {
      type:    Boolean,
      default: true,
    },

    isSuspended: {
      type:    Boolean,
      default: false,
    },

    // Email verification
    verificationToken:         { type: String, select: false, default: null },
    verificationTokenExpires:  { type: Date,   select: false, default: null },

    // Password reset
    resetToken:         { type: String, select: false, default: null },
    resetTokenExpires:  { type: Date,   select: false, default: null },
  },
  {
    timestamps: true,             // Adds createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Pre-save hook: hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: compare raw password to hash
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Safe serialization: removes sensitive fields for API responses
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetToken;
  delete obj.resetTokenExpires;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', UserSchema);
