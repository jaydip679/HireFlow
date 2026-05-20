import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type:     String,
    required: true,
    index:    true,    // Looked up on every refresh request
  },

  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,    // For revokeAllUserTokens()
  },

  expiresAt: {
    type:     Date,
    required: true,
  },

  isRevoked: {
    type:    Boolean,
    default: false,
    index:   true,
  },

  userAgent: {
    type:    String,
    default: '',
  },

  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

// TTL index: MongoDB auto-deletes documents when expiresAt is reached
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', RefreshTokenSchema);
