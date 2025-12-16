# Behavioral Analytics Client

Client-side package for capturing keystroke dynamics in educational coding environments. Designed for seamless integration with Monaco Editor and React applications.

## Features

- **High-Fidelity Keystroke Capture**: Captures detailed timing and context for every keystroke
- **Monaco Editor Integration**: Drop-in component with built-in capture functionality
- **React Hooks**: Composable hooks for flexible integration patterns
- **Consent Management**: Built-in GDPR-compliant consent flow
- **Batch Processing**: Efficient event batching with configurable size and time limits
- **Session Management**: Automatic session tracking and persistence
- **Offline Support**: Failed batch retry mechanism with queue management
- **TypeScript**: Full type safety with comprehensive type definitions

## Installation

```bash
npm install behavioral-analytics-client
# or
yarn add behavioral-analytics-client
# or
pnpm add behavioral-analytics-client
```

## Quick Start

### 1. Basic Usage with MonacoEditor Component

```tsx
import { MonacoEditor } from 'behavioral-analytics-client';

function App() {
  return (
    <MonacoEditor
      defaultValue="// Start coding..."
      language="javascript"
      theme="vs-dark"
      height="600px"
      captureConfig={{
        apiEndpoint: 'http://localhost:3000/api/keystroke',
        userId: 'user-123',
        batchSizeLimit: 100,
        batchTimeLimit: 5000,
        enableConsent: true,
        debug: true
      }}
    />
  );
}
```

### 2. Custom Integration with Hooks

```tsx
import { useKeystrokeCapture, useConsentManager } from 'behavioral-analytics-client';
import Editor from '@monaco-editor/react';

function CustomEditor() {
  const userId = 'user-123';

  // Consent management
  const { consentGranted, grantConsent } = useConsentManager({ userId });

  // Keystroke capture
  const { handleEditorMount } = useKeystrokeCapture({
    apiEndpoint: 'http://localhost:3000/api/keystroke',
    userId,
    batchSizeLimit: 100,
    batchTimeLimit: 5000,
    enableConsent: true
  });

  if (!consentGranted) {
    return <ConsentDialog onAccept={grantConsent} />;
  }

  return (
    <Editor
      onMount={handleEditorMount}
      defaultLanguage="javascript"
      defaultValue="// Start coding..."
    />
  );
}
```

### 3. Low-Level API Usage

```tsx
import { createKeystrokeCapture } from 'behavioral-analytics-client';

const capture = createKeystrokeCapture({
  apiEndpoint: 'http://localhost:3000/api/keystroke',
  userId: 'user-123',
  batchSizeLimit: 100,
  batchTimeLimit: 5000,
  enableConsent: true
});

// On editor mount
function handleEditorMount(editor) {
  capture.initialize(editor);
}

// Get session info
const info = capture.getSessionInfo();
console.log(info);

// Stop capture when done
capture.stopCapture();
```

## Components

### MonacoEditor

Pre-configured Monaco Editor component with keystroke capture.

```tsx
<MonacoEditor
  defaultValue="// Code here"
  language="javascript"
  theme="vs-dark"
  height="600px"
  width="100%"
  captureConfig={{
    apiEndpoint: 'http://localhost:3000/api/keystroke',
    userId: 'user-123'
  }}
  onChange={(value) => console.log(value)}
  options={{
    fontSize: 14,
    minimap: { enabled: true }
  }}
/>
```

### ConsentDialog

GDPR-compliant consent dialog component.

```tsx
<ConsentDialog
  isOpen={!consentGranted}
  onAccept={grantConsent}
  onDecline={() => console.log('Declined')}
  title="Data Collection Consent"
  message="Custom consent message..."
/>
```

### CaptureStatus

Real-time status indicator for capture activity.

```tsx
<CaptureStatus
  getSessionInfo={getSessionInfo}
  showDetails={true}
  position="top-right"
  updateInterval={1000}
/>
```

## Hooks

### useKeystrokeCapture

Main hook for keystroke capture integration.

```tsx
const {
  handleEditorMount,
  startCapture,
  stopCapture,
  getSessionInfo,
  isInitialized
} = useKeystrokeCapture({
  apiEndpoint: 'http://localhost:3000/api/keystroke',
  userId: 'user-123',
  batchSizeLimit: 100,
  batchTimeLimit: 5000,
  enableConsent: true,
  autoStart: true
});
```

### useConsentManager

Hook for managing user consent.

```tsx
const {
  consentGranted,
  consentTimestamp,
  grantConsent,
  revokeConsent,
  checkConsent
} = useConsentManager({
  userId: 'user-123',
  onConsentChange: (granted) => console.log('Consent:', granted)
});
```

## Configuration

### CaptureConfig

```typescript
interface CaptureConfig {
  apiEndpoint: string;           // Required: API endpoint for data submission
  userId: string;                // Required: Unique user identifier
  batchSizeLimit: number;        // Events per batch (default: 100)
  batchTimeLimit: number;        // Time between batches in ms (default: 5000)
  enableConsent: boolean;        // Enable consent flow (default: true)
  assignmentId?: string;         // Optional: Assignment/task identifier
  debug?: boolean;               // Enable debug logging (default: false)
}
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# For Vite
VITE_API_ENDPOINT=http://localhost:3000/api/keystroke
VITE_DEBUG=true
VITE_ENVIRONMENT=development

# For Create React App
REACT_APP_API_ENDPOINT=http://localhost:3000/api/keystroke
REACT_APP_DEBUG=true
REACT_APP_ENVIRONMENT=development

# For Next.js
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000/api/keystroke
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_ENVIRONMENT=development
```

### Configuration Presets

```typescript
import { getPresetConfig, createCaptureConfig } from 'behavioral-analytics-client';

// Use development preset
const config = createCaptureConfig('user-123', getPresetConfig('development'));

// Available presets: 'development', 'production', 'testing'
```

## API Reference

### KeystrokeCapture Class

```typescript
class KeystrokeCapture {
  constructor(config: CaptureConfig);
  initialize(editor: any): void;
  stopCapture(): void;
  grantConsent(): void;
  revokeConsent(): void;
  getSessionInfo(): SessionInfo;
}
```

### BatchManager

Utility for managing event batching and transmission.

```typescript
import { createBatchManager } from 'behavioral-analytics-client';

const batchManager = createBatchManager({
  apiEndpoint: 'http://localhost:3000/api/keystroke',
  batchSizeLimit: 100,
  batchTimeLimit: 5000,
  onBatchSuccess: (batch) => console.log('Sent:', batch.length),
  onBatchError: (batch, error) => console.error(error)
});
```

### SessionManager

Utility for session state management.

```typescript
import { createSessionManager } from 'behavioral-analytics-client';

const sessionManager = createSessionManager({
  userId: 'user-123',
  assignmentId: 'assignment-001',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  persistSession: true
});
```

## Data Structure

### KeystrokeEvent

Each captured keystroke event contains:

```typescript
interface KeystrokeEvent {
  session_id: string;
  user_id: string;
  event_type: 'keyDown' | 'keyUp';
  timestamp_ms: number;
  key_code: string;
  key_value: string;
  cursor_offset: number;
  modifier_state: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}
```

### BatchPayload

Events are sent to the server in batches:

```typescript
interface BatchPayload {
  session_id: string;
  user_id: string;
  assignment_id?: string;
  events: KeystrokeEvent[];
  metadata: {
    batch_size: number;
    client_timestamp: number;
    browser?: object;
    session_end?: boolean;
  };
}
```

## Advanced Usage

### Custom Consent Flow

```tsx
import { getConsentStatus, setConsentStatus } from 'behavioral-analytics-client';

// Check consent without React
const { granted, timestamp } = getConsentStatus('user-123');

// Set consent programmatically
setConsentStatus('user-123', true);
```

### Session Persistence

```typescript
const sessionManager = createSessionManager({
  userId: 'user-123',
  persistSession: true,
  sessionTimeout: 30 * 60 * 1000,
  onSessionStart: (session) => console.log('Session started:', session),
  onSessionEnd: (session) => console.log('Session ended:', session)
});

// Update activity
sessionManager.updateActivity();

// Get session duration
const duration = sessionManager.getSessionDuration();

// End session manually
sessionManager.endSession();
```

### Failed Batch Handling

The client automatically retries failed batches. Access statistics:

```typescript
const batchManager = createBatchManager(config);

// Get batch statistics
const stats = batchManager.getStats();
console.log(stats.failedBatches); // Number of failed batches
console.log(stats.totalFailedEvents); // Total events in failed batches

// Manual flush
await batchManager.flush();

// Send beacon on page unload (automatic)
batchManager.sendBeacon();
```

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Development Mode

```bash
npm run dev
```

## Server API Requirements

The client expects the server to implement the following endpoint:

```
POST /api/keystroke
Content-Type: application/json
X-Session-ID: <session-id>

Body: BatchPayload (see Data Structure section)

Response: 200 OK on success
```

## Privacy & Compliance

- All data is transmitted over HTTPS in production
- User consent is required before any data collection
- Consent status is stored in localStorage
- Users can revoke consent at any time
- Session IDs are randomly generated UUIDs
- Browser metadata is collected for research purposes only

## Best Practices

1. **Always enable consent in production**: Set `enableConsent: true`
2. **Use HTTPS endpoints**: Never transmit keystroke data over HTTP in production
3. **Configure appropriate batch limits**: Balance between real-time capture and server load
4. **Monitor failed batches**: Implement server-side retry logic for reliability
5. **Respect user privacy**: Clearly communicate data usage in consent dialogs
6. **Test thoroughly**: Use debug mode during development

## Troubleshooting

### Events not being captured

- Ensure the editor is properly mounted before capture initialization
- Check that consent has been granted
- Verify the API endpoint is accessible
- Enable debug mode to see console logs

### TypeScript errors

- Ensure you have `@types/react` and `@types/node` installed
- Check that your `tsconfig.json` includes DOM types
- Verify Monaco Editor peer dependency is installed

### Build errors

- Clear `node_modules` and reinstall dependencies
- Ensure TypeScript version is >= 5.0
- Check that all peer dependencies are installed

## License

MIT

## Support

For issues, questions, or contributions, please visit the project repository.

## Related Packages

- `@behavioral-analytics/shared` - Shared types and utilities
- `@monaco-editor/react` - React wrapper for Monaco Editor (peer dependency)
