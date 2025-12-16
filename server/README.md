# Behavioral Analytics Server

Server-side API for the Behavioral Learning Analytics system. Handles keystroke data ingestion, feature extraction, and continuous passive authentication for academic integrity monitoring.

## Overview

This server provides REST API endpoints for:
- Keystroke event ingestion and storage
- Behavioral feature extraction
- Continuous passive authentication
- Real-time analytics and monitoring
- Health checks and system status

## Architecture

```
server/
├── src/
│   ├── api/                    # API route handlers
│   │   ├── keystroke/         # Keystroke ingestion endpoints
│   │   ├── analytics/         # Analytics & auth endpoints
│   │   └── health/            # Health check endpoints
│   ├── services/              # Business logic services
│   │   ├── keystrokeIngestion.ts
│   │   ├── featureExtraction.ts
│   │   └── continuousAuth.ts
│   ├── middleware/            # Express middleware
│   │   ├── validation.ts      # Request validation
│   │   ├── cors.ts            # CORS configuration
│   │   └── errorHandler.ts   # Error handling
│   ├── config/                # Configuration
│   │   ├── environment.ts     # Environment variables
│   │   └── database.ts        # Database connection
│   ├── database/              # Database related
│   │   └── migrations/        # SQL migration scripts
│   ├── server.ts              # Main server entry point
│   └── index.ts               # Barrel exports
├── package.json
├── tsconfig.json
└── .env.example               # Environment template
```

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=behavioral_analytics
DB_USER=postgres
DB_PASSWORD=your_password
API_PORT=3000
```

5. Set up the database:
```bash
# Create database
createdb behavioral_analytics

# Run migrations
psql -U postgres -d behavioral_analytics -f src/database/migrations/001_initial_schema.sql
```

## Usage

### Development Mode

Start the server with hot-reloading:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

## API Endpoints

### Health Checks

#### `GET /api/v1/health`
Basic health check
```bash
curl http://localhost:3000/api/v1/health
```

#### `GET /api/v1/health/database`
Database connection health check
```bash
curl http://localhost:3000/api/v1/health/database
```

#### `GET /api/v1/health/stats`
System statistics
```bash
curl http://localhost:3000/api/v1/health/stats
```

### Keystroke Ingestion

#### `POST /api/v1/keystrokes/log`
Ingest a batch of keystroke events

Headers:
- `X-Session-ID`: UUID of the session
- `Content-Type`: application/json

Request body:
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "assignment_id": "uuid",
  "events": [
    {
      "session_id": "uuid",
      "user_id": "uuid",
      "event_type": "keyDown",
      "timestamp_ms": 1234567890,
      "key_code": "KeyA",
      "key_value": "a",
      "cursor_offset": 0,
      "modifier_state": {
        "shift": false,
        "ctrl": false,
        "alt": false,
        "meta": false
      }
    }
  ],
  "metadata": {
    "batch_size": 10,
    "client_timestamp": 1234567890,
    "browser": {
      "userAgent": "Mozilla/5.0...",
      "language": "en-US",
      "platform": "MacIntel"
    }
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully ingested 10 events",
  "data": {
    "session_id": "uuid",
    "events_ingested": 10,
    "server_timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `GET /api/v1/keystrokes/session/:sessionId/stats`
Get statistics for a session
```bash
curl http://localhost:3000/api/v1/keystrokes/session/{sessionId}/stats
```

### Analytics & Feature Extraction

#### `POST /api/v1/analytics/features/extract`
Extract features for a session
```json
{
  "sessionId": "uuid"
}
```

#### `POST /api/v1/analytics/features/batch`
Extract features for multiple sessions
```json
{
  "sessionIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### `GET /api/v1/analytics/features/session/:sessionId`
Get extracted features for a session
```bash
curl http://localhost:3000/api/v1/analytics/features/session/{sessionId}
```

### Continuous Authentication

#### `POST /api/v1/analytics/auth/enroll`
Enroll a user for continuous authentication
```json
{
  "userId": "uuid",
  "sessionIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### `POST /api/v1/analytics/auth/authenticate`
Authenticate a session
```json
{
  "sessionId": "uuid",
  "userId": "uuid"
}
```

#### `GET /api/v1/analytics/auth/profile/:userId`
Get user's biometric profile
```bash
curl http://localhost:3000/api/v1/analytics/auth/profile/{userId}
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables
- `DB_PASSWORD`: PostgreSQL password
- `API_PORT`: Server port (default: 3000)

### Optional Variables
- `JWT_SECRET`: JWT signing secret
- `ENCRYPTION_KEY`: Data encryption key
- `CORS_ORIGIN`: Allowed CORS origins
- `DEBUG_MODE`: Enable debug logging

## Database Schema

The server uses PostgreSQL with the following main tables:
- `coding_sessions`: Session metadata
- `keystroke_events`: Raw keystroke events
- `keystroke_features`: Extracted behavioral features
- `biometric_profiles`: User authentication profiles
- `authentication_events`: Authentication log

See `src/database/migrations/001_initial_schema.sql` for complete schema.

## Services

### KeystrokeIngestionService
Handles validation, storage, and session management for keystroke events.

### FeatureExtractionService
Extracts behavioral features from raw keystroke data:
- Timing features (dwell time, flight time)
- Dynamic features (typing speed, error correction)
- Pause and burst detection
- Key usage patterns
- N-gram analysis

### ContinuousAuthenticationService
Provides passive authentication using behavioral biometrics:
- User enrollment with training sessions
- Real-time authentication checks
- Risk scoring and anomaly detection
- Automatic challenge and session lock

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": {
    "name": "ErrorName",
    "message": "Error description",
    "details": {}
  }
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Credentials**: Use strong passwords
3. **CORS**: Restrict origins in production
4. **Rate Limiting**: Configure appropriate limits
5. **SSL/TLS**: Enable in production
6. **Input Validation**: All inputs validated with Zod

## Performance

- Connection pooling for database
- Batch processing for events
- Optimized queries with indexes
- Request validation caching
- Graceful shutdown handling

## Deployment

### Docker
```bash
docker build -t behavioral-analytics-server .
docker run -p 3000:3000 --env-file .env behavioral-analytics-server
```

### Kubernetes
See `k8s/` directory for deployment manifests.

## Monitoring

- Health endpoints for load balancers
- Structured logging
- Database connection monitoring
- Memory usage tracking

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages

## License

ISC

## Support

For issues and questions, please open a GitHub issue or contact the development team.
