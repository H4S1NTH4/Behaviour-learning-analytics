/**
 * Request Validation Middleware
 *
 * Validates incoming requests using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate as uuidValidate } from 'uuid';

/**
 * Validation schema for keystroke events
 */
export const KeystrokeEventSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_type: z.enum(['keyDown', 'keyUp']),
  timestamp_ms: z.number().positive(),
  key_code: z.string().min(1).max(50),
  key_value: z.string().max(50),
  cursor_offset: z.number().int().nonnegative(),
  modifier_state: z.object({
    shift: z.boolean(),
    ctrl: z.boolean(),
    alt: z.boolean(),
    meta: z.boolean()
  })
});

/**
 * Validation schema for batch payload
 */
export const BatchPayloadSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  assignment_id: z.string().optional(),
  events: z.array(KeystrokeEventSchema).min(1).max(500), // Max 500 events per batch
  metadata: z.object({
    batch_size: z.number().int().positive(),
    client_timestamp: z.number().positive(),
    browser: z.object({
      userAgent: z.string().optional(),
      language: z.string().optional(),
      platform: z.string().optional(),
      screenResolution: z.string().optional()
    }).optional(),
    session_end: z.boolean().optional()
  }).optional()
});

/**
 * Middleware to validate keystroke batch payload
 */
export function validateKeystrokeBatch(req: Request, res: Response, next: NextFunction): void {
  try {
    const validatedPayload = BatchPayloadSchema.parse(req.body);
    req.body = validatedPayload; // Replace with validated data
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  }
}

/**
 * Middleware to validate session ID header
 */
export function validateSessionHeader(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.headers['x-session-id'] as string;

  if (!sessionId || !uuidValidate(sessionId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid or missing X-Session-ID header'
    });
    return;
  }

  next();
}

/**
 * Middleware to validate UUID parameter
 */
export function validateUUIDParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value || !uuidValidate(value)) {
      res.status(400).json({
        success: false,
        message: `Invalid UUID for parameter: ${paramName}`
      });
      return;
    }

    next();
  };
}

/**
 * Generic schema validation middleware factory
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    }
  };
}

/**
 * Middleware to validate query parameters
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    }
  };
}

export default {
  validateKeystrokeBatch,
  validateSessionHeader,
  validateUUIDParam,
  validateBody,
  validateQuery
};
