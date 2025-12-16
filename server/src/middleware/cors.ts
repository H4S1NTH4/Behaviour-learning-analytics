/**
 * CORS Middleware Configuration
 *
 * Handles Cross-Origin Resource Sharing for the API
 */

import { Request, Response, NextFunction } from 'express';

/**
 * CORS configuration options
 */
export interface CorsOptions {
  origin?: string | string[];
  credentials?: boolean;
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  methods?: string[];
  maxAge?: number;
}

/**
 * Default CORS options
 */
const defaultOptions: CorsOptions = {
  origin: '*',
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Session-ID',
    'X-User-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Size'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400 // 24 hours
};

/**
 * CORS middleware factory
 */
export function createCorsMiddleware(options: CorsOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Set origin
    if (typeof config.origin === 'string') {
      res.header('Access-Control-Allow-Origin', config.origin);
    } else if (Array.isArray(config.origin)) {
      const origin = req.headers.origin;
      if (origin && config.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }

    // Set credentials
    if (config.credentials) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    // Set allowed headers
    if (config.allowedHeaders) {
      res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    }

    // Set exposed headers
    if (config.exposedHeaders) {
      res.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }

    // Set allowed methods
    if (config.methods) {
      res.header('Access-Control-Allow-Methods', config.methods.join(', '));
    }

    // Set max age
    if (config.maxAge) {
      res.header('Access-Control-Max-Age', config.maxAge.toString());
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    next();
  };
}

/**
 * Default CORS middleware
 */
export const corsMiddleware = createCorsMiddleware();

/**
 * Development CORS middleware (allows all origins)
 */
export const developmentCors = createCorsMiddleware({
  origin: '*',
  credentials: false
});

/**
 * Production CORS middleware (restrict origins)
 */
export function productionCors(allowedOrigins: string[]) {
  return createCorsMiddleware({
    origin: allowedOrigins,
    credentials: true
  });
}

export default corsMiddleware;
