# Behavioral Analytics Dashboard

Real-time visualization dashboard for the behavioral analytics system. Provides comprehensive insights into student learning states, keystroke dynamics, and AI-driven interventions.

## Features

- **Real-time State Monitoring**: Live visualization of behavioral states (flow, productive struggle, unproductive struggle, disengaged)
- **Keystroke Analytics**: Detailed metrics on typing speed, error rates, pauses, and dwell times
- **Intervention Tracking**: Log and visualization of AI-recommended interventions
- **Session Analytics**: Deep dive into individual learning sessions
- **User Progress**: Aggregated analytics across multiple sessions
- **WebSocket Integration**: Real-time updates via Socket.IO
- **Responsive Design**: Mobile-friendly UI with adaptive layouts

## Architecture

```
dashboard/
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard.tsx
│   │   ├── StateDisplay.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── InterventionLog.tsx
│   │   └── ChartComponents.tsx
│   ├── pages/            # Page components
│   │   ├── SessionView.tsx
│   │   └── UserView.tsx
│   ├── services/         # API and WebSocket clients
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── hooks/           # Custom React hooks
│   │   ├── useDashboardData.ts
│   │   └── useWebSocket.ts
│   ├── styles/          # CSS stylesheets
│   ├── config/          # Configuration
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── server.ts        # Express server
├── public/              # Static assets
├── dist/                # Production build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development mode**:
   ```bash
   # Run Vite dev server (frontend)
   npm run dev

   # In another terminal, run Express server (backend proxy)
   npm run server

   # Or run both concurrently
   npm run dev:full
   ```

4. **Production build**:
   ```bash
   npm run build
   npm run preview
   ```

## Configuration

### Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3001/api/v1)
- `VITE_WS_URL`: WebSocket server URL (default: http://localhost:3001)
- `VITE_REFRESH_INTERVAL`: Auto-refresh interval in ms (default: 30000)
- `PORT`: Server port (default: 3000)

## API Integration

The dashboard connects to the behavioral analytics backend via:

1. **REST API** (`/api/v1/*`):
   - Session data
   - User analytics
   - Intervention history
   - Aggregate statistics

2. **WebSocket** (Socket.IO):
   - Real-time behavioral state updates
   - Live intervention notifications
   - Session status changes

## Usage

### Viewing a Session

```typescript
// Navigate to session view
/session/:sessionId

// Example
http://localhost:5173/session/abc123
```

### Viewing User Analytics

```typescript
// Navigate to user view
/user/:userId

// Example
http://localhost:5173/user/user456
```

### WebSocket Events

The dashboard listens for:

- `behavioral_state`: New behavioral state prediction
- `intervention`: AI-recommended intervention
- `session_update`: Session status change
- `metrics_update`: Keystroke metrics update

## Components

### StateDisplay

Visualizes the current behavioral state with confidence metrics.

```tsx
<StateDisplay currentState={state} isLive={true} />
```

### MetricsCard

Displays session keystroke metrics.

```tsx
<MetricsCard metrics={sessionMetrics} title="Session Metrics" />
```

### InterventionLog

Shows intervention history with filtering.

```tsx
<InterventionLog sessionId={sessionId} showFilters={true} />
```

### ChartComponents

Reusable chart components:

- `BehavioralTimeline`: Timeline of behavioral states
- `StateDistribution`: Pie chart of state distribution
- `TypingSpeedChart`: Line chart of typing speed
- `StruggleHotspots`: Bar chart of struggle areas

## Docker Deployment

### Build Docker Image

```bash
docker build -t behavioral-analytics-dashboard .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e API_BACKEND_URL=http://backend:3001 \
  behavioral-analytics-dashboard
```

### Docker Compose

```yaml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_BACKEND_URL=http://backend:3001
      - NODE_ENV=production
    depends_on:
      - backend
```

## Development

### Project Structure

- **Components**: Reusable UI components
- **Pages**: Full-page views with routing
- **Services**: API and WebSocket clients
- **Hooks**: Custom React hooks for data fetching
- **Styles**: CSS modules and global styles

### Adding a New Component

1. Create component file in `src/components/`
2. Add TypeScript interface for props
3. Implement component with proper types
4. Export from component file
5. Import and use in pages

### Adding a New API Endpoint

1. Add method to appropriate API service (`src/services/api.ts`)
2. Define TypeScript types for request/response
3. Use in components via custom hooks

## Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## Troubleshooting

### WebSocket Connection Issues

- Verify backend is running on correct port
- Check CORS configuration
- Ensure `VITE_WS_URL` is set correctly

### API Request Failures

- Verify backend API is accessible
- Check `VITE_API_BASE_URL` configuration
- Inspect network tab in browser DevTools

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Verify TypeScript version compatibility

## Performance

- **Code Splitting**: Automatic via Vite
- **Lazy Loading**: Chart components loaded on demand
- **Memoization**: React.memo for expensive components
- **WebSocket Throttling**: Limits update frequency

## Security

- **CORS**: Configured for specific origins
- **Input Validation**: All user inputs validated
- **XSS Protection**: React automatic escaping
- **Environment Variables**: Sensitive data in .env

## License

Copyright (c) 2024. All rights reserved.

## Support

For issues and questions, please contact the development team.
