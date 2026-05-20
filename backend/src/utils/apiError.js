class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    
    // Capture the stack trace, keeping the constructor call clean
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
