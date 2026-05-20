import ApiError from '../utils/apiError.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
};

export default notFoundHandler;
