# Behavioral Analytics Inference Engine

Real-time behavioral state inference engine for student learning analytics using LSTM models.

## Overview

The Inference Engine continuously monitors active coding sessions and provides real-time predictions of student behavioral states including:

- Flow state
- Productive struggle
- Unproductive struggle
- Disengagement

It also calculates derived metrics such as cognitive load, frustration scores, and engagement levels, and can trigger intelligent interventions when needed.

## Features

- Real-time LSTM model inference
- WebSocket support for live updates
- Automatic session monitoring
- Intervention recommendations
- Cognitive load estimation
- PostgreSQL + TimescaleDB integration
- Docker support

## Prerequisites

- Node.js 18+
- Python 3.8+ with TensorFlow/Keras
- PostgreSQL 13+ with TimescaleDB extension
- Trained LSTM model files

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
nano .env
```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=behavioral_analytics
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_SIZE=20

# Model Paths
MODEL_PATH=models/lstm_behavioral_model.keras
SCALER_PATH=models/feature_scaler.pkl
METADATA_PATH=models/model_metadata.json

# Python Configuration
PYTHON_PATH=python3

# Inference Configuration
CONFIDENCE_THRESHOLD=0.6
INFERENCE_INTERVAL_SECONDS=30

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=3001
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```bash
# Build image
docker build -t inference-engine .

# Run container
docker run -d \
  --name inference-engine \
  -p 3001:3001 \
  --env-file .env \
  inference-engine
```

## Architecture

```
inference-engine/
├── src/
│   ├── config/
│   │   └── environment.ts      # Environment configuration
│   ├── models/
│   │   ├── types.ts            # Type definitions
│   │   └── loader.ts           # Model loading utilities
│   ├── engine.ts               # Core inference engine
│   ├── websocket.ts            # WebSocket server
│   ├── starter.ts              # Application starter
│   └── index.ts                # Main entry point
├── dist/                       # Compiled JavaScript
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## API

### Events

The engine emits the following events:

#### `prediction`
Emitted when a behavioral state prediction is made.

```typescript
{
  userId: string;
  sessionId: string;
  timestamp: Date;
  predictedState: 'flow' | 'productive_struggle' | 'unproductive_struggle' | 'disengaged';
  confidence: number;
  probabilities: {
    flow: number;
    productive_struggle: number;
    unproductive_struggle: number;
    disengaged: number;
  };
  cognitiveLoadEstimate: number;
  frustrationScore: number;
  engagementScore: number;
  interventionRecommended: boolean;
  interventionType?: string;
}
```

#### `intervention_needed`
Emitted when an intervention is recommended.

```typescript
{
  prediction: BehavioralPrediction;
  intervention: {
    type: 'hint' | 'scaffold' | 'break_suggestion' | 'resource' | 'instructor_alert';
    priority: 'low' | 'medium' | 'high';
    message: string;
    data?: any;
  };
}
```

### WebSocket Events

#### Client → Server

- `subscribe_session(sessionId)` - Subscribe to session updates
- `unsubscribe_session(sessionId)` - Unsubscribe from session
- `subscribe_user(userId)` - Subscribe to user updates
- `unsubscribe_user(userId)` - Unsubscribe from user

#### Server → Client

- `behavioral_state` - Behavioral state prediction
- `intervention` - Intervention recommendation

## Model Requirements

The inference engine expects the following model files:

1. **LSTM Model** (`.keras` or `.h5`)
   - Trained LSTM model for behavioral state classification
   - Input: Sequence of feature vectors (default: 6 time windows)
   - Output: 4-class probabilities (flow, productive_struggle, unproductive_struggle, disengaged)

2. **Feature Scaler** (`.pkl`)
   - Scikit-learn StandardScaler or MinMaxScaler
   - Fitted on training data feature distributions

3. **Model Metadata** (`.json`)
   - Model version and configuration
   - Feature names and order
   - Class names
   - Performance metrics

## Database Schema

The engine requires the following tables:

- `coding_sessions` - Active session tracking
- `keystroke_features` - Pre-computed feature windows
- `behavioral_states` - Prediction results storage

## Performance

- Inference latency: < 100ms per prediction
- Memory usage: ~500MB (including model)
- CPU usage: Low (inference runs in separate Python process)
- Supports: 1000+ concurrent sessions

## Monitoring

The engine logs:
- Connection status
- Prediction events
- Intervention triggers
- Session monitoring status
- WebSocket connections

Check logs for status updates every minute:
```
[STATUS] Active Sessions: 42, WebSocket Connections: 15
```

## Troubleshooting

### Python Process Fails to Start

- Verify Python path in `.env`
- Ensure TensorFlow/Keras is installed: `pip install tensorflow`
- Check model file paths

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials
- Ensure TimescaleDB extension is enabled

### No Predictions Generated

- Verify sessions have sufficient keystroke data (6+ windows)
- Check feature extraction is running
- Review Python process logs

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Clean
npm run clean
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Integration test with mock data
npm run test:integration
```

## Contributing

1. Follow TypeScript best practices
2. Add JSDoc comments for public APIs
3. Update README for new features
4. Test with real session data

## License

MIT
