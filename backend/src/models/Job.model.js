import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Job title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type:      String,
      required:  [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    employer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    skillsRequired: {
      type:      [String],
      default:   [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message:   'Cannot require more than 20 skills',
      },
    },

    jobType: {
      type:     String,
      enum:     ['full-time', 'part-time', 'contract', 'internship'],
      required: [true, 'Job type is required'],
    },

    location: {
      type:    String,
      trim:    true,
      default: null,
    },

    isRemote: {
      type:    Boolean,
      default: false,
    },

    salary: {
      min:      { type: Number, min: 0, default: null },
      max:      { type: Number, min: 0, default: null },
      currency: { type: String, default: 'USD', maxlength: 3 },
    },

    deadline: {
      type:  Date,
      index: true,
    },

    status: {
      type:    String,
      enum:    ['active', 'closed', 'draft'],
      default: 'active',
      index:   true,
    },

    isDeleted: {
      type:    Boolean,
      default: false,
      index:   true,
    },

    // Denormalized for performance
    applicationCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
  }
);

// Text index for full-text search on title + description with custom weights
JobSchema.index(
  { title: 'text', description: 'text' }, 
  { weights: { title: 3, description: 1 }, name: 'JobTextSearchIndex' }
);

// Compound index for the most common filter combination
JobSchema.index({ status: 1, isDeleted: 1, deadline: 1, createdAt: -1 });
JobSchema.index({ employer: 1, status: 1 });
JobSchema.index({ skillsRequired: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

// Query helper: excludes deleted + expired jobs (default public filter)
JobSchema.query.active = function () {
  return this.where({
    isDeleted: false,
    status:    'active',
    $or: [
      { deadline: null },
      { deadline: { $gte: new Date() } },
    ],
  });
};

export default mongoose.model('Job', JobSchema);
