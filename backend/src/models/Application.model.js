import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
  {
    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
      index:    true,
    },

    applicant: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // Resume at time of application (may differ from profile resume)
    resume: {
      url:      { type: String, required: [true, 'Resume URL is required'] },
      publicId: { type: String, required: [true, 'Resume public ID is required'] },
    },

    coverLetter: {
      type:      String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default:   null,
    },

    status: {
      type:    String,
      enum:    ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn'],
      default: 'pending',
      index:   true,
    },

    // AI Screening results
    aiScore: {
      type:    Number,
      min:     0,
      max:     100,
      default: null,
    },

    aiSummary: {
      type:    String,
      default: null,
    },

    aiStrengths: {
      type:    [String],
      default: [],
    },

    aiGaps: {
      type:    [String],
      default: [],
    },

    aiRecommendation: {
      type:    String,
      enum:    ['shortlist', 'consider', 'reject', null],
      default: null,
    },

    aiScreenedAt: {
      type:    Date,
      default: null,
      index:   true,    // For "find unscreened" queries
    },

    // Employer notes (private, not visible to applicant)
    employerNote: {
      type:    String,
      default: null,
    },

    // Track when status changed (for timeline display)
    statusHistory: [
      {
        status:    String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Compound unique index: one application per (applicant, job) pair
ApplicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// For employer's "get all applicants for job" sorted by AI score
ApplicationSchema.index({ job: 1, aiScore: -1 });

// For applicant's "my applications" list
ApplicationSchema.index({ applicant: 1, createdAt: -1 });

// For batch screening: unscreened applications for a job
ApplicationSchema.index({ job: 1, aiScreenedAt: 1 });

export default mongoose.model('Application', ApplicationSchema);
