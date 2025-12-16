# @behavioral-analytics/shared

Shared types, interfaces, constants, and utilities for the Behavioral Analytics System.

## Overview

This package provides common definitions and utilities used across all microservices in the behavioral analytics system, ensuring type safety and consistency.

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Development

```bash
npm run dev
```

## Package Contents

### Types

- **keystroke.ts**: Keystroke event types, features, and capture configuration
- **analytics.ts**: Behavioral states, session metrics, and intervention recommendations
- **inference.ts**: Prediction types and inference engine configuration
- **auth.ts**: Biometric profiles and authentication results

### Constants

- **api.ts**: API endpoints, ports, batch configuration, and HTTP status codes
- **events.ts**: Event types, special keys, and system events
- **states.ts**: Behavioral states, thresholds, and metric definitions

### Schemas

- **keystroke.ts**: Zod validation schemas for keystroke data

### Utilities

- **validation.ts**: Common validation functions and helpers

## Usage

Import types and utilities in your TypeScript projects:

```typescript
import {
  KeystrokeEvent,
  BehavioralState,
  API_ENDPOINTS,
  BEHAVIORAL_STATES,
  validateKeystrokeEvent,
  isValidUuid,
} from '@behavioral-analytics/shared';
```

## TypeScript Configuration

This package is compiled with strict TypeScript settings and generates declaration files for full type support.

## License

MIT
