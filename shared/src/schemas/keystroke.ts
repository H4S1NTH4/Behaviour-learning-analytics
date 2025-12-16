/**
 * Zod Schemas for Keystroke Data Validation
 */

import { z } from 'zod';

// Modifier state schema
export const ModifierStateSchema = z.object({
  shift: z.boolean(),
  ctrl: z.boolean(),
  alt: z.boolean(),
  meta: z.boolean(),
});

// Keystroke event schema
export const KeystrokeEventSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().min(1),
  event_type: z.enum(['keydown', 'keyup']),
  timestamp_ms: z.number().positive(),
  key_code: z.string().min(1),
  key_value: z.string(),
  cursor_offset: z.number().int().nonnegative(),
  modifier_state: ModifierStateSchema,
});

// Keystroke features schema
export const KeystrokeFeaturesSchema = z.object({
  // Timing features
  hold_time: z.number().nonnegative(),
  flight_time: z.number().nonnegative(),
  dwell_time: z.number().nonnegative(),

  // Statistical features
  avg_hold_time: z.number().nonnegative(),
  std_hold_time: z.number().nonnegative(),
  avg_flight_time: z.number().nonnegative(),
  std_flight_time: z.number().nonnegative(),

  // Rhythm features
  typing_speed: z.number().nonnegative(),
  pause_count: z.number().int().nonnegative(),
  avg_pause_duration: z.number().nonnegative(),

  // Error features
  backspace_count: z.number().int().nonnegative(),
  correction_rate: z.number().min(0).max(1),

  // Pressure features (optional)
  key_pressure: z.number().optional(),

  // Sequence features
  bigram_frequency: z.record(z.string(), z.number()),
  trigram_frequency: z.record(z.string(), z.number()),

  // Session context
  session_duration: z.number().positive(),
  total_keystrokes: z.number().int().positive(),
  timestamp: z.number().positive(),
});

// Capture config schema
export const CaptureConfigSchema = z.object({
  apiEndpoint: z.string().url(),
  batchSizeLimit: z.number().int().min(1).max(200),
  batchTimeLimit: z.number().int().min(1000).max(30000),
  enableConsent: z.boolean(),
  userId: z.string().min(1),
  assignmentId: z.string().min(1),
  debug: z.boolean(),
});

// Batch metadata schema
export const BatchMetadataSchema = z.object({
  batch_number: z.number().int().positive(),
  batch_size: z.number().int().positive(),
  start_timestamp: z.number().positive(),
  end_timestamp: z.number().positive(),
  user_agent: z.string(),
  screen_resolution: z.string(),
  timezone: z.string(),
});

// Batch payload schema
export const BatchPayloadSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().min(1),
  assignment_id: z.string().min(1),
  events: z.array(KeystrokeEventSchema).min(1),
  metadata: BatchMetadataSchema,
});

// Partial schemas for flexible validation
export const PartialKeystrokeFeaturesSchema = KeystrokeFeaturesSchema.partial();
export const PartialCaptureConfigSchema = CaptureConfigSchema.partial();

// Type inference helpers
export type KeystrokeEventInput = z.input<typeof KeystrokeEventSchema>;
export type KeystrokeEventOutput = z.output<typeof KeystrokeEventSchema>;

export type KeystrokeFeaturesInput = z.input<typeof KeystrokeFeaturesSchema>;
export type KeystrokeFeaturesOutput = z.output<typeof KeystrokeFeaturesSchema>;

export type CaptureConfigInput = z.input<typeof CaptureConfigSchema>;
export type CaptureConfigOutput = z.output<typeof CaptureConfigSchema>;

export type BatchPayloadInput = z.input<typeof BatchPayloadSchema>;
export type BatchPayloadOutput = z.output<typeof BatchPayloadSchema>;

// Validation functions
export const validateKeystrokeEvent = (data: unknown) => {
  return KeystrokeEventSchema.safeParse(data);
};

export const validateKeystrokeFeatures = (data: unknown) => {
  return KeystrokeFeaturesSchema.safeParse(data);
};

export const validateCaptureConfig = (data: unknown) => {
  return CaptureConfigSchema.safeParse(data);
};

export const validateBatchPayload = (data: unknown) => {
  return BatchPayloadSchema.safeParse(data);
};

// Strict validation (throws on error)
export const parseKeystrokeEvent = (data: unknown) => {
  return KeystrokeEventSchema.parse(data);
};

export const parseKeystrokeFeatures = (data: unknown) => {
  return KeystrokeFeaturesSchema.parse(data);
};

export const parseCaptureConfig = (data: unknown) => {
  return CaptureConfigSchema.parse(data);
};

export const parseBatchPayload = (data: unknown) => {
  return BatchPayloadSchema.parse(data);
};
