export const success = (data, message = 'Success', pagination = null) => {
  return {
    success: true,
    ...(message && { message }),
    data,
    ...(pagination && { pagination })
  };
};

export const error = (message, code = 'INTERNAL_ERROR', errors = []) => {
  return {
    success: false,
    message,
    code,
    ...(errors.length > 0 && { errors })
  };
};
