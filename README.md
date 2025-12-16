# Behavioral Analytics System

A comprehensive behavioral analytics platform for keystroke dynamics-based continuous authentication, real-time cognitive load detection, and academic integrity monitoring in learning environments.

## Overview

This system captures, analyzes, and interprets behavioral patterns from programming students through keystroke dynamics to enable:

- **Continuous Authentication**: Non-intrusive identity verification based on typing patterns
- **Cognitive Load Detection**: Real-time monitoring of mental workload during coding tasks
- **Academic Integrity Monitoring**: Detection of anomalous behaviors indicating potential cheating
- **Personalized Learning**: Adaptive interventions based on behavioral insights

## Architecture

The system is built as a monorepo with multiple specialized services:

```
behavioral-analytics-monorepo/
├── shared/              # Shared types, utilities, and validation schemas
├── server/              # Express.js API server for data ingestion
├── client/              # Client-side keystroke capture library
├── dashboard/           # React-based real-time analytics dashboard
├── inference-engine/    # ML-powered behavioral state inference
└── docker-compose.yml   # Containerized deployment configuration
```

### Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, Vite, TypeScript
- **Database**: PostgreSQL with TimescaleDB (time-series optimization)
- **ML/AI**: LSTM neural networks, feature engineering
- **Real-time**: Socket.IO for WebSocket connections
- **DevOps**: Docker, Docker Compose, npm workspaces

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14 (or Docker)
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **Python** 3.8+ (for ML model training)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd Implementation

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
npm install -ws

# Or use Make
make install
```

### 3. Build All Packages

```bash
# Build all workspaces
npm run build

# Or use Make
make build
```

### 4. Development Mode

#### Option A: Run All Services Locally

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:server      # API Server (port 3000)
npm run dev:inference   # Inference Engine (port 3001)
npm run dev:dashboard   # Dashboard (port 3002)
```

#### Option B: Use Docker Compose

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Or use Make
make docker-up
make docker-logs
```

### 5. Access the Services

- **API Server**: http://localhost:3000
- **Inference Engine**: http://localhost:3001
- **Dashboard**: http://localhost:3002
- **Database**: localhost:5432

## Workspace Structure

The project is organized as a monorepo using npm workspaces. Each package has a specific role in the behavioral analytics system:

### 1. Shared (`/shared`) - Core Types & Utilities

**Purpose:** Provides shared TypeScript types, interfaces, validation schemas, and utility functions used across all packages.

**Key Responsibilities:**
- Define data models for keystroke events, features, and inference results
- Provide Zod validation schemas for data integrity
- Export common utility functions (ID generation, timestamps, etc.)
- Ensure type safety across the entire system

**Key Files:**
- `src/types/keystroke.ts` - Keystroke event definitions
- `src/types/feature.ts` - Feature extraction types
- `src/schemas/` - Zod validation schemas
- `src/utils/` - Shared utility functions

**Usage Example:**
```typescript
import { KeystrokeEvent, FeatureVector } from '@behavioral-analytics/shared';
```

**Build:**
```bash
cd shared
npm run build      # Build TypeScript
npm run dev        # Watch mode
npm run clean      # Remove build artifacts
```

---

### 2. Server (`/server`) - API & Data Ingestion

**Purpose:** Express.js API server that serves as the central hub for keystroke data ingestion, user authentication, session management, and database operations.

**Key Responsibilities:**
- Receive and validate keystroke events from clients
- Store keystroke data in PostgreSQL
- Extract behavioral features from raw keystroke data
- Manage user authentication and sessions
- Provide REST API endpoints for dashboard and clients
- Handle data persistence and querying

**API Endpoints:**
- `POST /api/v1/keystrokes/log` - Log keystroke events
- `GET /api/v1/keystrokes/:userId` - Retrieve user keystrokes
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/sessions/:sessionId` - Get session details
- `GET /health` - Health check endpoint

**Development Setup:**
```bash
cd server

# Install dependencies
npm install

# Development mode (auto-reload with tsx)
npm run dev

# Build for production
npm run build

# Production mode
npm start

# Watch mode
npm run start:watch
```

**Port:** 3000 (configurable via `API_PORT` env var)

**Database:** PostgreSQL (configured via DB_* env vars)

---

### 3. Client (`/client`) - Keystroke Capture Library

**Purpose:** Client-side library that captures keystroke events in browser environments and sends them to the server for analysis.

**Key Responsibilities:**
- Intercept keyboard events in real-time
- Collect keystroke timing data (press time, release time, inter-keystroke intervals)
- Buffer events for batch transmission
- Send events to the server API endpoint
- Manage user consent for data collection
- Integrate with React/Monaco editor environments

**Features:**
- Non-intrusive keystroke capture
- Configurable buffer sizes and flush intervals
- Error handling and retry logic
- TypeScript support for integrations

**Integration Example:**
```typescript
import { KeystrokeCapture } from 'behavioral-analytics-client';

const capture = new KeystrokeCapture({
  userId: 'user123',
  sessionId: 'session456',
  apiEndpoint: 'http://localhost:3000/api/v1/keystrokes/log',
  bufferSize: 10,
  flushInterval: 5000
});

// Start capturing keystrokes
capture.start();

// Stop capturing when done
capture.stop();
```

**Development Setup:**
```bash
cd client

# Install dependencies
npm install

# Development mode
npm run dev

# Build library
npm run build:lib

# Type check
npm run type-check

# Clean build artifacts
npm run clean
```

**Supported Environments:**
- React applications
- Monaco Editor
- Any web-based coding environment

---

### 4. Dashboard (`/dashboard`) - Analytics Visualization

**Purpose:** Real-time web-based dashboard for monitoring behavioral analytics, visualization of keystroke patterns, cognitive load, and authentication risk.

**Key Responsibilities:**
- Visualize real-time keystroke data
- Display cognitive load indicators
- Show authentication risk scores
- Alert on detected anomalies
- Analyze historical trends
- Connect to server via REST API and WebSockets
- Provide admin interface for system monitoring

**Features:**
- Real-time keystroke heatmaps
- Cognitive load graphs and trends
- Authentication risk scoring dashboard
- Anomaly detection alerts
- Session analytics
- User behavior analytics
- Real-time WebSocket updates via Socket.IO

**Development Setup:**
```bash
cd dashboard

# Install dependencies
npm install

# Development mode (Vite dev server on port 3002)
npm run dev

# Run backend server alongside frontend
npm run dev:full

# Backend server only
npm run server

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Linting
npm run lint
```

**Port:** 3002 (configurable via `DASHBOARD_PORT` env var)

**Access:** Open http://localhost:3002 in your browser

**Real-time Updates:** The dashboard receives live updates via WebSocket connection to the inference engine (port 3001)

---

### 5. Inference Engine (`/inference-engine`) - ML & Real-time Analysis

**Purpose:** ML-powered microservice that performs real-time behavioral state inference using LSTM neural networks and statistical analysis.

**Key Responsibilities:**
- Read keystroke events from the database
- Extract behavioral features in real-time
- Run LSTM models for pattern recognition
- Calculate cognitive load scores
- Detect anomalies in typing behavior
- Generate authentication risk scores
- Broadcast inference results via WebSocket to dashboard

**Capabilities:**
- Real-time feature extraction from keystroke sequences
- LSTM-based sequence modeling for behavioral classification
- Cognitive load detection (stress, fatigue, focus levels)
- Anomaly detection (identifies unusual typing patterns)
- Authentication risk scoring (confidence in user identity)
- Session-based inference for context awareness

**ML Models:**
- LSTM network for keystroke pattern classification
- Anomaly detection algorithms
- Risk scoring models

**Development Setup:**
```bash
cd inference-engine

# Install dependencies
npm install

# Development mode (with tsx auto-reload)
npm run dev

# Build for production
npm run build

# Production mode
npm start

# Clean build artifacts
npm run clean
```

**Port:** 3001 (configurable via `INFERENCE_PORT` env var)

**Real-time Communication:**
- Connects to PostgreSQL for data access
- Broadcasts inference results via Socket.IO WebSocket to connected clients
- Subscribes to keystroke events for real-time inference

---

## Component Communication Flow

```
┌─────────────────┐
│   Web Browser   │
│   (Client App)  │
└────────┬────────┘
         │
         │ Keystroke Events (HTTP POST)
         ↓
┌──────────────────┐       ┌──────────────────┐
│  Server (3000)   │◄────►│  PostgreSQL DB   │
│  - REST API      │       │  - Keystroke Data│
│  - Auth          │       │  - Sessions      │
│  - Data Storage  │       │  - Features      │
└────────┬─────────┘       └──────────────────┘
         │                          ▲
         │ Queries Data             │
         │                          │
         ↓                          │
┌──────────────────────────────────┴─────┐
│  Inference Engine (3001)                │
│  - Real-time Inference (LSTM)           │
│  - Anomaly Detection                    │
│  - Risk Scoring                         │
└────────────┬──────────────────────────┘
             │
             │ WebSocket (Socket.IO)
             │ Real-time Results
             ↓
┌──────────────────┐
│  Dashboard (3002)│
│  - Visualization │
│  - Charts        │
│  - Alerts        │
└──────────────────┘
```

## Running the System

### Quick Start (All Services)

The fastest way to get everything running:

#### Option 1: Using npm Scripts from Root

```bash
# From project root, start all services together
npm run dev

# This starts:
# - Server on port 3000
# - Inference engine on port 3001
# - Dashboard on port 3002
```

#### Option 2: Using Docker Compose (Recommended)

```bash
# Build and start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Option 3: Using Make

```bash
# Start everything with Make
make dev

# Or with Docker
make docker-up
make docker-logs

# Stop
make docker-down
```

### Individual Component Startup

If you need to run components separately:

#### Terminal 1: Start the Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3000
```

#### Terminal 2: Start the Inference Engine
```bash
cd inference-engine
npm install
npm run dev
# Inference engine runs on http://localhost:3001
```

#### Terminal 3: Start the Dashboard
```bash
cd dashboard
npm install
npm run dev
# Dashboard runs on http://localhost:3002
```

**Note:** The dashboard will also have a backend server running on port 3003 for serving API requests.

### Verify Services are Running

```bash
# Check server health
curl http://localhost:3000/health

# Check inference engine health
curl http://localhost:3001/health

# Check dashboard
open http://localhost:3002
```

### Expected Startup Sequence

1. **Server starts first** → Initializes database connection
2. **Inference engine starts** → Connects to database and listens for inference requests
3. **Dashboard starts** → Connects to server and inference engine via WebSocket

Once all services are running, you should see:
- Server listening on port 3000
- Inference engine listening on port 3001
- Dashboard accessible at http://localhost:3002

---

## Development Workflow

### Using npm Scripts

```bash
# Install dependencies for all workspaces
npm run install-all

# Build all packages
npm run build

# Build specific workspace
npm run build:shared
npm run build:server
npm run build:client
npm run build:dashboard
npm run build:inference

# Development mode
npm run dev                 # All services
npm run dev:server          # Server only
npm run dev:dashboard       # Dashboard only
npm run dev:inference       # Inference engine only

# Production
npm run start:all           # All services
npm run start:server        # Server only
npm run start:dashboard     # Dashboard only
npm run start:inference     # Inference engine only

# Docker operations
npm run docker-build        # Build images
npm run docker-up           # Start containers
npm run docker-down         # Stop containers
npm run docker-logs         # View logs
npm run docker-clean        # Remove volumes

# Testing
npm test                    # Run all tests

# Cleanup
npm run clean               # Clean build artifacts
```

### Using Makefile

```bash
# View all available commands
make help

# Development
make install                # Install dependencies
make build                  # Build all packages
make dev                    # Start dev mode
make dev-server             # Start server only

# Docker
make docker-up              # Start containers
make docker-down            # Stop containers
make docker-logs            # View logs
make docker-build           # Build images

# Database
make db-connect             # Connect to database
make db-backup              # Backup database
make db-restore FILE=backup.sql  # Restore database

# Utilities
make status                 # Show service status
make ports                  # Show port usage
make env-check              # Check environment
make clean                  # Clean artifacts
make setup                  # Initial setup
```

## Environment Variables

Configure the system using environment variables in `.env`:

### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=behavioral_analytics
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

### Services
```env
API_PORT=3000
INFERENCE_PORT=3001
DASHBOARD_PORT=3002
```

### Security
```env
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32chars
```

### Feature Flags
```env
ENABLE_CONSENT=true
ENABLE_AUTHENTICATION=true
ENABLE_COGNITIVE_LOAD_DETECTION=true
ENABLE_ANOMALY_DETECTION=true
ENABLE_REAL_TIME_INFERENCE=true
```

See `.env.example` for complete configuration options.

## Database Schema

The system uses PostgreSQL with TimescaleDB for efficient time-series data storage.

**Main Tables:**
- `users` - User accounts and profiles
- `sessions` - Coding sessions
- `keystroke_events` - Raw keystroke data (hypertable)
- `feature_vectors` - Extracted features (hypertable)
- `inference_results` - ML predictions
- `anomaly_detections` - Detected anomalies

**Migrations:**
Database schema is automatically initialized from `server/src/database/migrations/`.

## API Documentation

### Keystroke Ingestion

```http
POST /api/v1/keystrokes/log
Content-Type: application/json

{
  "userId": "user123",
  "sessionId": "session456",
  "events": [
    {
      "key": "a",
      "type": "keydown",
      "timestamp": 1234567890000,
      "pressTime": 50,
      "releaseTime": 100
    }
  ]
}
```

### Authentication

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "student1",
  "email": "student1@example.com",
  "password": "secure_password"
}
```

### Real-time WebSocket

```javascript
const socket = io('http://localhost:3001');

socket.on('inference:result', (data) => {
  console.log('Cognitive Load:', data.cognitiveLoad);
  console.log('Auth Risk:', data.authenticationRisk);
});
```

## Production Deployment

### Using Docker

```bash
# Build production images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Manual Deployment

```bash
# Build all packages
npm run build

# Set production environment
export NODE_ENV=production

# Start services
npm run start:all
```

### Scaling Considerations

- Use load balancers for API server
- Implement Redis for session management
- Enable database connection pooling
- Configure TimescaleDB compression policies
- Deploy ML models to separate GPU instances

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Testing

```bash
# Run all tests
npm test

# Test specific workspace
npm test -w server
npm test -w client
npm test -w dashboard

# Type checking
npm run type-check
```

## Monitoring and Logging

### Logs

```bash
# Docker logs
docker-compose logs -f server-api
docker-compose logs -f inference-engine
docker-compose logs -f dashboard

# Or use Make
make docker-logs-server
make docker-logs-inference
make docker-logs-dashboard
```

### Health Checks

- Server: `http://localhost:3000/health`
- Inference: `http://localhost:3001/health`
- Dashboard: `http://localhost:3002/health`

## Performance Tuning

### Database Optimization

```sql
-- Enable TimescaleDB compression
SELECT add_compression_policy('keystroke_events', INTERVAL '7 days');

-- Create additional indexes
CREATE INDEX idx_keystrokes_user_time ON keystroke_events (user_id, timestamp DESC);
```

### Node.js Tuning

```env
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=128
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

**Database Connection Failed:**
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Restart database
docker-compose restart postgres
```

**Build Errors:**
```bash
# Clean and rebuild
make clean-all
make install
make build
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Security

- All data is encrypted at rest and in transit
- JWT-based authentication
- CORS protection enabled
- Rate limiting on API endpoints
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries

**Reporting Security Issues:**
Please email security@behavioral-analytics.com (do not create public issues).

## License

ISC License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- SLIIT Research Team
- Contributors and testers
- Open-source libraries used in this project

## Support

- Documentation: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Deployment Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Issues: GitHub Issues
- Email: support@behavioral-analytics.com

## Project Status

Active development - v1.0.0

**Key Features:**
- ✅ Keystroke capture and storage
- ✅ Real-time feature extraction
- ✅ LSTM-based inference
- ✅ Real-time dashboard
- ✅ Docker deployment
- 🚧 Advanced anomaly detection
- 🚧 Personalized interventions
- 📋 Mobile client support

## Roadmap

- [ ] Enhanced ML models (Transformer-based)
- [ ] Multi-modal behavioral analysis
- [ ] Advanced privacy-preserving techniques
- [ ] Mobile SDK
- [ ] Cloud-native deployment (Kubernetes)
- [ ] Real-time collaboration features
- [ ] Advanced analytics and reporting
