/**
 * Model Loading and Management
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface ModelMetadata {
  version: string;
  created_at: string;
  features: string[];
  classes: string[];
  sequence_length: number;
  feature_scaler_type: string;
  performance_metrics: {
    accuracy: number;
    f1_score: number;
    precision: number;
    recall: number;
  };
}

/**
 * Model configuration
 */
export interface ModelConfig {
  modelPath: string;
  scalerPath: string;
  metadataPath: string;
}

/**
 * Load model metadata from JSON file
 */
export function loadModelMetadata(metadataPath: string): ModelMetadata {
  try {
    const fullPath = resolve(metadataPath);
    const content = readFileSync(fullPath, 'utf-8');
    const metadata = JSON.parse(content) as ModelMetadata;

    console.log(`Loaded model metadata: v${metadata.version}`);
    console.log(`Features: ${metadata.features.length}`);
    console.log(`Classes: ${metadata.classes.join(', ')}`);
    console.log(`Accuracy: ${(metadata.performance_metrics.accuracy * 100).toFixed(2)}%`);

    return metadata;
  } catch (error) {
    console.error('Failed to load model metadata:', error);
    throw new Error(`Failed to load model metadata from ${metadataPath}`);
  }
}

/**
 * Validate model configuration
 */
export function validateModelConfig(config: ModelConfig): void {
  const requiredPaths = [
    { path: config.modelPath, name: 'Model' },
    { path: config.scalerPath, name: 'Scaler' },
    { path: config.metadataPath, name: 'Metadata' }
  ];

  for (const { path, name } of requiredPaths) {
    try {
      const fullPath = resolve(path);
      // Note: We don't check file existence here as paths might be relative to Python script
      console.log(`${name} path configured: ${fullPath}`);
    } catch (error) {
      throw new Error(`Invalid ${name.toLowerCase()} path: ${path}`);
    }
  }
}

/**
 * Get model version from metadata
 */
export function getModelVersion(metadataPath: string): string {
  try {
    const metadata = loadModelMetadata(metadataPath);
    return metadata.version;
  } catch (error) {
    console.warn('Could not load model version, using default');
    return '1.0.0';
  }
}
