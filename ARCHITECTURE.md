# System Architecture

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Database Design](#database-design)
6. [API Specifications](#api-specifications)
7. [Machine Learning Pipeline](#machine-learning-pipeline)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Technology Stack](#technology-stack)

## Overview

The Behavioral Analytics System is a distributed, real-time platform designed to capture, process, and analyze keystroke dynamics data for educational applications. The system employs a microservices architecture with specialized components for data ingestion, feature extraction, machine learning inference, and visualization.

### Key Objectives

- **Real-time Processing**: Sub-second latency for keystroke event processing
- **Scalability**: Support for 10,000+ concurrent users
- **Reliability**: 99.9% uptime with data loss prevention
- **Privacy**: GDPR/FERPA compliant data handling
- **Extensibility**: Modular design for future enhancements

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Browser (Monaco Editor + Keystroke Capture Library)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   API Server │  │  Inference   │  │  Dashboard Server  │   │
│  │  (Express.js)│  │   Engine     │  │   (React + Vite)   │   │
│  │   Port 3000  │  │  Port 3001   │  │    Port 3002       │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ↓ TCP
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │  PostgreSQL +        │  │  Redis (Optional)              │  │
│  │  TimescaleDB         │  │  Session & Cache               │  │
│  │  Port 5432           │  │  Port 6379                     │  │
│  └──────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
behavioral-analytics-monorepo/
│
├── shared/                          # Shared library
│   ├── src/
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── keystroke.ts         # Keystroke event types
│   │   │   ├── feature.ts           # Feature vector types
│   │   │   ├── inference.ts         # ML inference types
│   │   │   └── user.ts              # User & session types
│   │   ├── schemas/                 # Zod validation schemas
│   │   │   ├── keystroke.schema.ts
│   │   │   ├── feature.schema.ts
│   │   │   └── api.schema.ts
│   │   ├── utils/                   # Utility functions
│   │   │   ├── time.ts              # Time manipulation
│   │   │   ├── validation.ts        # Data validation
│   │   │   └── crypto.ts            # Encryption/hashing
│   │   └── constants/               # Shared constants
│   └── package.json
│
├── server/                          # API Server
│   ├── src/
│   │   ├── api/                     # API routes
│   │   │   ├── keystroke/           # Keystroke endpoints
│   │   │   │   ├── controller.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── routes.ts
│   │   │   ├── analytics/           # Analytics endpoints
│   │   │   ├── auth/                # Authentication
│   │   │   └── health/              # Health checks
│   │   ├── services/                # Business logic
│   │   │   ├── keystroke.service.ts
│   │   │   ├── feature.service.ts
│   │   │   └── auth.service.ts
│   │   ├── database/                # Database layer
│   │   │   ├── migrations/          # SQL migrations
│   │   │   ├── connection.ts        # DB connection pool
│   │   │   └── repositories/        # Data access layer
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── config/                  # Configuration
│   │   └── server.ts                # Entry point
│   └── package.json
│
├── client/                          # Client Library
│   ├── src/
│   │   ├── KeystrokeCapture.ts      # Main capture class
│   │   ├── BufferManager.ts         # Event buffering
│   │   ├── NetworkManager.ts        # HTTP/WebSocket client
│   │   ├── ConsentManager.ts        # User consent handling
│   │   └── types.ts                 # Client-specific types
│   └── package.json
│
├── inference-engine/                # ML Inference Service
│   ├── src/
│   │   ├── index.ts                 # Entry point
│   │   ├── InferenceEngine.ts       # Main inference logic
│   │   ├── FeatureExtractor.ts      # Feature computation
│   │   ├── ModelManager.ts          # ML model loading
│   │   ├── WebSocketServer.ts       # Real-time updates
│   │   └── database/                # DB queries
│   ├── models/                      # Pre-trained models
│   │   ├── lstm_model.h5
│   │   └── scaler.pkl
│   └── package.json
│
├── dashboard/                       # Analytics Dashboard
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── KeystrokeVisualizer.tsx
│   │   │   ├── CognitiveLoadChart.tsx
│   │   │   └── AlertPanel.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API clients
│   │   ├── types/                   # Frontend types
│   │   ├── App.tsx                  # Root component
│   │   ├── main.tsx                 # Entry point
│   │   └── server.ts                # Express server
│   └── package.json
│
└── docker-compose.yml               # Orchestration
```

## Component Details

### 1. Shared Library (`@behavioral-analytics/shared`)

**Purpose**: Centralized type definitions, validation schemas, and utilities used across all services.

**Key Features**:
- TypeScript interfaces for type safety
- Zod schemas for runtime validation
- Utility functions for common operations
- Constants and enums

**Example Types**:
```typescript
// keystroke.ts
export interface KeystrokeEvent {
  id: string;
  userId: string;
  sessionId: string;
  key: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
  pressTime?: number;
  releaseTime?: number;
  modifiers: KeyModifiers;
}

// feature.ts
export interface FeatureVector {
  userId: string;
  timestamp: number;
  dwellTime: number;        // Key hold duration
  flightTime: number;       // Inter-key interval
  typingSpeed: number;      // Characters per minute
  errorRate: number;        // Backspace ratio
  pauseFrequency: number;   // Long pauses
  rhythmVariability: number; // Timing consistency
}
```

### 2. API Server (`/server`)

**Purpose**: Central data ingestion and management service.

**Responsibilities**:
- Accept keystroke events from clients
- Validate and sanitize input data
- Store events in TimescaleDB
- Compute basic feature vectors
- Handle authentication and authorization
- Provide query endpoints for historical data

**Technology**:
- Node.js + Express.js
- TypeScript
- PostgreSQL client (pg)
- Zod validation
- JWT authentication

**Key Endpoints**:

```typescript
// POST /api/v1/keystrokes/log
// Batch insert keystroke events
interface KeystrokeBatch {
  userId: string;
  sessionId: string;
  events: KeystrokeEvent[];
}

// GET /api/v1/keystrokes/:userId
// Query user's keystroke history
interface QueryParams {
  startTime?: number;
  endTime?: number;
  limit?: number;
  sessionId?: string;
}

// POST /api/v1/auth/register
// User registration
interface RegistrationData {
  username: string;
  email: string;
  password: string;
}

// GET /health
// Health check endpoint
interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    database: boolean;
    cache: boolean;
  };
}
```

**Database Connection**:
```typescript
// connection.ts
export class DatabaseConnection {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T>(sql: string, params: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

### 3. Client Library (`/client`)

**Purpose**: Browser-side library for capturing keystroke events with minimal performance impact.

**Features**:
- Monaco Editor integration
- Event buffering (size-based and time-based)
- Automatic retry with exponential backoff
- Session end recovery using sendBeacon
- Consent management
- Offline queue support

**Architecture**:

```typescript
// KeystrokeCapture.ts
export class KeystrokeCapture {
  private buffer: BufferManager;
  private network: NetworkManager;
  private consent: ConsentManager;

  constructor(config: CaptureConfig) {
    this.buffer = new BufferManager(config.bufferSize);
    this.network = new NetworkManager(config.apiEndpoint);
    this.consent = new ConsentManager();
  }

  initialize(editor: monaco.editor.IStandaloneCodeEditor) {
    if (!this.consent.hasConsent()) {
      return;
    }

    editor.onKeyDown((e) => this.handleKeyDown(e));
    editor.onKeyUp((e) => this.handleKeyUp(e));

    // Flush buffer periodically
    setInterval(() => this.flush(), 5000);

    // Handle page unload
    window.addEventListener('beforeunload', () => this.finalFlush());
  }

  private async handleKeyDown(e: IKeyboardEvent) {
    const event: KeystrokeEvent = {
      id: generateId(),
      key: e.code,
      type: 'keydown',
      timestamp: performance.now(),
      pressTime: performance.now(),
      modifiers: {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey
      }
    };

    this.buffer.add(event);

    if (this.buffer.isFull()) {
      await this.flush();
    }
  }

  private async flush() {
    const events = this.buffer.drain();
    if (events.length > 0) {
      await this.network.send(events);
    }
  }
}
```

**Buffer Management**:
```typescript
// BufferManager.ts
export class BufferManager {
  private buffer: KeystrokeEvent[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  add(event: KeystrokeEvent): void {
    this.buffer.push(event);
  }

  isFull(): boolean {
    return this.buffer.length >= this.maxSize;
  }

  drain(): KeystrokeEvent[] {
    const events = [...this.buffer];
    this.buffer = [];
    return events;
  }
}
```

### 4. Inference Engine (`/inference-engine`)

**Purpose**: Real-time behavioral state inference using machine learning models.

**Capabilities**:
- Feature extraction from raw keystrokes
- LSTM-based sequence modeling
- Cognitive load classification (Low, Medium, High)
- Anomaly detection
- Authentication risk scoring
- Real-time WebSocket updates

**Architecture**:

```typescript
// InferenceEngine.ts
export class InferenceEngine {
  private featureExtractor: FeatureExtractor;
  private modelManager: ModelManager;
  private wsServer: WebSocketServer;

  async processKeystrokeSequence(
    userId: string,
    events: KeystrokeEvent[]
  ): Promise<InferenceResult> {
    // 1. Extract features
    const features = this.featureExtractor.extract(events);

    // 2. Normalize features
    const normalized = this.modelManager.normalize(features);

    // 3. Run LSTM inference
    const prediction = await this.modelManager.predict(normalized);

    // 4. Interpret results
    const result: InferenceResult = {
      userId,
      timestamp: Date.now(),
      cognitiveLoad: this.classifyCognitiveLoad(prediction),
      authenticationRisk: this.calculateAuthRisk(prediction),
      anomalyScore: this.detectAnomaly(prediction),
      confidence: prediction.confidence
    };

    // 5. Broadcast to dashboard
    this.wsServer.broadcast('inference:result', result);

    return result;
  }

  private classifyCognitiveLoad(
    prediction: ModelPrediction
  ): CognitiveLoad {
    if (prediction.score < 0.33) return 'low';
    if (prediction.score < 0.66) return 'medium';
    return 'high';
  }
}
```

**Feature Extraction**:
```typescript
// FeatureExtractor.ts
export class FeatureExtractor {
  extract(events: KeystrokeEvent[]): FeatureVector {
    return {
      // Temporal features
      dwellTime: this.calculateDwellTime(events),
      flightTime: this.calculateFlightTime(events),
      typingSpeed: this.calculateTypingSpeed(events),

      // Error features
      errorRate: this.calculateErrorRate(events),

      // Rhythm features
      pauseFrequency: this.calculatePauseFrequency(events),
      rhythmVariability: this.calculateRhythmVariability(events),

      // Statistical features
      dwellTimeMean: this.mean(dwellTimes),
      dwellTimeStd: this.std(dwellTimes),
      flightTimeMean: this.mean(flightTimes),
      flightTimeStd: this.std(flightTimes),

      // Digraph features (two-key combinations)
      commonDigraphLatency: this.calculateDigraphLatency(events)
    };
  }

  private calculateDwellTime(events: KeystrokeEvent[]): number {
    const dwellTimes = events
      .filter(e => e.releaseTime)
      .map(e => e.releaseTime! - e.pressTime!);
    return this.mean(dwellTimes);
  }
}
```

### 5. Dashboard (`/dashboard`)

**Purpose**: Real-time visualization and monitoring interface.

**Features**:
- Live keystroke visualization
- Cognitive load trends
- Authentication risk indicators
- Anomaly alerts
- Historical data analysis
- User session management

**Technology**:
- React 18+
- Vite (build tool)
- Recharts (visualization)
- Socket.IO Client (real-time)
- TypeScript

**Component Architecture**:

```typescript
// Dashboard.tsx
export const Dashboard: React.FC = () => {
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoadData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const socket = useSocket('http://localhost:3001');

  useEffect(() => {
    socket.on('inference:result', (data: InferenceResult) => {
      setCognitiveLoad(prev => [...prev, {
        timestamp: data.timestamp,
        value: data.cognitiveLoad
      }]);
    });

    socket.on('anomaly:detected', (anomaly: Anomaly) => {
      setAnomalies(prev => [anomaly, ...prev]);
      toast.warning('Anomaly detected!');
    });

    return () => {
      socket.off('inference:result');
      socket.off('anomaly:detected');
    };
  }, [socket]);

  return (
    <div className="dashboard">
      <CognitiveLoadChart data={cognitiveLoad} />
      <AlertPanel anomalies={anomalies} />
      <KeystrokeVisualizer />
      <AuthenticationRiskMeter />
    </div>
  );
};
```

## Data Flow

### 1. Keystroke Capture Flow

```
User Types
    ↓
Monaco Editor Event
    ↓
KeystrokeCapture Library
    ↓
Local Buffer (in-memory)
    ↓
Buffer Full or Timer Triggered
    ↓
HTTP POST to API Server
    ↓
API Validation & Sanitization
    ↓
TimescaleDB Storage
    ↓
Response to Client (ACK)
```

### 2. Real-time Inference Flow

```
Keystroke Events in DB
    ↓
Inference Engine Polling (every 5s)
    ↓
Feature Extraction
    ↓
LSTM Model Inference
    ↓
Classification & Scoring
    ↓
WebSocket Broadcast
    ↓
Dashboard Update (React)
```

### 3. Historical Analysis Flow

```
Dashboard Query Request
    ↓
API Server GET Endpoint
    ↓
PostgreSQL Query
    ↓
Aggregate & Transform
    ↓
JSON Response
    ↓
Dashboard Visualization
```

## Database Design

### Schema Overview

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE coding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id VARCHAR(255),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_keystrokes INTEGER DEFAULT 0,
    metadata JSONB
);

-- Keystroke events (TimescaleDB hypertable)
CREATE TABLE keystroke_events (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES coding_sessions(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    key_code VARCHAR(50) NOT NULL,
    event_type VARCHAR(10) NOT NULL, -- 'keydown' or 'keyup'
    press_time BIGINT,
    release_time BIGINT,
    modifiers JSONB,
    PRIMARY KEY (user_id, event_time, id)
);

-- Convert to hypertable
SELECT create_hypertable('keystroke_events', 'event_time',
    chunk_time_interval => INTERVAL '1 day');

-- Feature vectors (TimescaleDB hypertable)
CREATE TABLE feature_vectors (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    computed_at TIMESTAMPTZ NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    dwell_time_mean FLOAT,
    dwell_time_std FLOAT,
    flight_time_mean FLOAT,
    flight_time_std FLOAT,
    typing_speed FLOAT,
    error_rate FLOAT,
    pause_frequency FLOAT,
    rhythm_variability FLOAT,
    features_json JSONB,
    PRIMARY KEY (user_id, computed_at)
);

SELECT create_hypertable('feature_vectors', 'computed_at',
    chunk_time_interval => INTERVAL '1 day');

-- Inference results
CREATE TABLE inference_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES coding_sessions(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    cognitive_load VARCHAR(20), -- 'low', 'medium', 'high'
    authentication_risk FLOAT,
    anomaly_score FLOAT,
    confidence FLOAT,
    model_version VARCHAR(50)
);

-- Anomaly detections
CREATE TABLE anomaly_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    anomaly_type VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_keystrokes_user_time ON keystroke_events (user_id, event_time DESC);
CREATE INDEX idx_keystrokes_session ON keystroke_events (session_id, event_time DESC);
CREATE INDEX idx_features_user_time ON feature_vectors (user_id, computed_at DESC);
CREATE INDEX idx_inference_user ON inference_results (user_id, timestamp DESC);
```

### Compression Policies (TimescaleDB)

```sql
-- Compress keystroke events older than 7 days
SELECT add_compression_policy('keystroke_events', INTERVAL '7 days');

-- Compress feature vectors older than 14 days
SELECT add_compression_policy('feature_vectors', INTERVAL '14 days');

-- Retention policy: delete raw events older than 90 days
SELECT add_retention_policy('keystroke_events', INTERVAL '90 days');
```

## API Specifications

### REST API

**Base URL**: `http://localhost:3000/api/v1`

**Authentication**: Bearer JWT token in `Authorization` header

#### Endpoints

```yaml
POST /keystrokes/log:
  description: Batch insert keystroke events
  auth: Required
  body:
    userId: UUID
    sessionId: UUID
    events: KeystrokeEvent[]
  response:
    success: boolean
    count: number
    message: string

GET /keystrokes/:userId:
  description: Query user keystroke history
  auth: Required
  params:
    userId: UUID
  query:
    startTime: ISO8601 timestamp
    endTime: ISO8601 timestamp
    sessionId: UUID (optional)
    limit: number (default: 1000)
  response:
    events: KeystrokeEvent[]
    total: number

POST /auth/register:
  description: User registration
  auth: None
  body:
    username: string
    email: string
    password: string
  response:
    token: JWT string
    user: UserProfile

POST /auth/login:
  description: User authentication
  auth: None
  body:
    email: string
    password: string
  response:
    token: JWT string
    user: UserProfile

GET /analytics/cognitive-load/:userId:
  description: Get cognitive load history
  auth: Required
  params:
    userId: UUID
  query:
    startTime: ISO8601 timestamp
    endTime: ISO8601 timestamp
  response:
    data: CognitiveLoadPoint[]

GET /health:
  description: Health check
  auth: None
  response:
    status: 'healthy' | 'unhealthy'
    timestamp: number
    services: object
```

### WebSocket API

**URL**: `ws://localhost:3001`

**Protocol**: Socket.IO

```typescript
// Client subscribes to events
socket.on('inference:result', (data: InferenceResult) => {
  console.log('Cognitive Load:', data.cognitiveLoad);
  console.log('Auth Risk:', data.authenticationRisk);
});

socket.on('anomaly:detected', (anomaly: Anomaly) => {
  console.log('Anomaly:', anomaly.type, anomaly.severity);
});

socket.on('session:updated', (session: SessionUpdate) => {
  console.log('Session stats:', session);
});

// Client sends events
socket.emit('subscribe:user', { userId: 'uuid' });
socket.emit('unsubscribe:user', { userId: 'uuid' });
```

## Machine Learning Pipeline

### Feature Engineering

**Temporal Features**:
- Dwell Time: Duration key is held down
- Flight Time: Time between consecutive key presses
- Typing Speed: Characters per minute
- Inter-key Interval: Time between keystrokes

**Error Features**:
- Error Rate: Ratio of backspaces to total keys
- Correction Time: Time spent fixing errors

**Rhythm Features**:
- Pause Frequency: Number of long pauses (>2s)
- Rhythm Variability: Standard deviation of inter-key intervals
- Burst Typing: Consecutive rapid keystrokes

**Statistical Features**:
- Mean, Std, Min, Max of temporal features
- Skewness and Kurtosis
- Percentiles (25th, 50th, 75th, 95th)

### LSTM Model Architecture

```
Input Layer (Feature Vector)
    ↓
Dense Layer (128 units, ReLU)
    ↓
Dropout (0.3)
    ↓
LSTM Layer (64 units, return sequences)
    ↓
Dropout (0.3)
    ↓
LSTM Layer (32 units)
    ↓
Dense Layer (16 units, ReLU)
    ↓
Output Layer (Softmax for classification)
```

### Training Pipeline

1. **Data Collection**: Gather labeled keystroke sequences
2. **Preprocessing**: Clean, normalize, handle missing values
3. **Feature Extraction**: Compute temporal, error, and rhythm features
4. **Sequence Windowing**: Create fixed-length sequences (e.g., 100 keystrokes)
5. **Train/Val/Test Split**: 70/15/15
6. **Model Training**: LSTM with early stopping
7. **Hyperparameter Tuning**: Grid search or Bayesian optimization
8. **Evaluation**: Accuracy, F1-score, confusion matrix
9. **Model Export**: Save as .h5 (Keras) or .onnx

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **Refresh Tokens**: Long-lived tokens for renewing access
- **Role-Based Access Control (RBAC)**: Student, Instructor, Admin roles
- **Session Management**: Track active sessions

### Data Protection

- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Password Hashing**: bcrypt with 12 rounds
- **Input Sanitization**: Prevent SQL injection, XSS
- **Rate Limiting**: 1000 requests per 15 minutes per IP

### Privacy Measures

- **Data Anonymization**: Remove PII before analysis
- **Consent Management**: Explicit opt-in required
- **Right to Deletion**: GDPR compliance
- **Access Logging**: Audit trail for data access
- **Data Retention**: Automatic expiration after 90 days

## Scalability & Performance

### Horizontal Scaling

- **Load Balancer**: NGINX or HAProxy
- **API Server**: Multiple instances behind LB
- **Database**: Read replicas for queries
- **Inference Engine**: Separate instances per region

### Caching Strategy

- **Redis**: Session data, frequently accessed queries
- **In-Memory**: Feature vectors for active users
- **CDN**: Static assets for dashboard

### Performance Optimizations

- **Database**:
  - Connection pooling (max 20 connections)
  - Prepared statements
  - Batch inserts
  - TimescaleDB compression

- **API Server**:
  - Async/await for I/O operations
  - Streaming for large responses
  - Response compression (gzip)

- **Inference Engine**:
  - Batch processing
  - Model caching
  - GPU acceleration (if available)

### Monitoring

- **Metrics**: Prometheus + Grafana
- **Logging**: Winston or Pino (JSON format)
- **Tracing**: OpenTelemetry
- **Alerting**: PagerDuty or Opsgenie

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 16 + TimescaleDB
- **Cache**: Redis 7 (optional)
- **Validation**: Zod 4
- **Authentication**: jsonwebtoken
- **ORM**: Raw SQL with pg driver

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5+
- **UI Library**: Custom components
- **Charting**: Recharts 2
- **Real-time**: Socket.IO Client 4
- **State Management**: React hooks

### Machine Learning
- **Framework**: TensorFlow.js or ONNX Runtime
- **Training**: Python + Keras/PyTorch
- **Model Format**: .h5 or .onnx
- **Feature Scaling**: StandardScaler (scikit-learn)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (local), Kubernetes (prod)
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus, Grafana
- **Logging**: Winston, ELK Stack

### Development Tools
- **Package Manager**: npm workspaces
- **Linter**: ESLint
- **Formatter**: Prettier
- **Testing**: Jest, Supertest
- **API Testing**: Postman, k6 (load testing)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-16
**Maintained By**: SLIIT Research Team
