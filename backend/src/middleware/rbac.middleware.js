import ApiError from '../utils/apiError.js';

/**
 * Middleware to authorize specific user roles (e.g. admin, employer, applicant).
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'You are not authenticated.', 'UNAUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied. Insufficient permissions.', 'FORBIDDEN'));
    }

    next();
  };
};

/**
 * High-fidelity middleware to verify if the requesting user is the owner of a document or an admin.
 * If ownership is verified, the document is attached to `req.ownedResource` to prevent duplicate DB queries.
 */
export const authorizeOwnerOrAdmin = (Model, idParamName = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'You are not authenticated.', 'UNAUTHENTICATED'));
    }

    // Admins bypass ownership check
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const resourceId = req.params[idParamName];
      const doc = await Model.findById(resourceId);

      if (!doc) {
        return next(new ApiError(404, 'Requested resource not found.', 'NOT_FOUND'));
      }

      // Check different potential owner fields on Mongoose documents
      const ownerId = doc.employer || doc.applicant || doc.user || doc._id;

      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, 'Access denied. You do not own this resource.', 'FORBIDDEN'));
      }

      // Attach parsed document to request for use in subsequent controllers
      req.ownedResource = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
};
