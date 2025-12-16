/**
 * Error Handling Middleware
 *
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(500, message, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Error response formatter
 */
function formatErrorResponse(error: Error, includeStack: boolean = false) {
  const response: any = {
    success: false,
    error: {
      name: error.name,
      message: error.message
    }
  };

  // Add details for API errors
  if (error instanceof ApiError && error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    path: req.path,
    method: req.method,
    stack: isDevelopment ? error.stack : undefined
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: 'Request validation failed',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
    return;
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(formatErrorResponse(error, isDevelopment));
    return;
  }

  // Handle PostgreSQL errors
  if ('code' in error) {
    const pgError = error as any;

    // Duplicate key error
    if (pgError.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          name: 'ConflictError',
          message: 'Resource already exists',
          details: isDevelopment ? pgError.detail : undefined
        }
      });
      return;
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        success: false,
        error: {
          name: 'ValidationError',
          message: 'Invalid reference',
          details: isDevelopment ? pgError.detail : undefined
        }
      });
      return;
    }

    // Not null violation
    if (pgError.code === '23502') {
      res.status(400).json({
        success: false,
        error: {
          name: 'ValidationError',
          message: 'Required field missing',
          details: isDevelopment ? pgError.column : undefined
        }
      });
      return;
    }
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      stack: isDevelopment ? error.stack : undefined
    }
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      name: 'NotFoundError',
      message: `Route not found: ${req.method} ${req.path}`
    }
  });
}

/**
 * Async route handler wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ApiError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError
};
