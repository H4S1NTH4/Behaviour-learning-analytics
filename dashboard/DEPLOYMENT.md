# Dashboard Deployment Guide

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Run Vite dev server (frontend)
npm run dev

# In another terminal, run Express server (backend proxy)
npm run server

# Or run both concurrently
npm run dev:full
```

The dashboard will be available at:
- Frontend (Vite): http://localhost:5173
- Backend Server: http://localhost:3000

### Production Mode

```bash
# Build the application
npm run build

# Run production server
npm run server
```

The production server serves both the built React app and API proxy at http://localhost:3000.

## Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Key environment variables:

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3001/api/v1)
- `VITE_WS_URL`: WebSocket server URL (default: http://localhost:3001)
- `PORT`: Server port (default: 3000)
- `API_BACKEND_URL`: Backend service URL for proxy (default: http://localhost:3001)

## Docker Deployment

### Build Docker Image

```bash
docker build -t behavioral-analytics-dashboard:latest .
```

### Run Container

```bash
docker run -d \
  --name dashboard \
  -p 3000:3000 \
  -e API_BACKEND_URL=http://backend:3001 \
  -e NODE_ENV=production \
  behavioral-analytics-dashboard:latest
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
    restart: unless-stopped

  backend:
    # Backend service configuration
    image: behavioral-analytics-backend:latest
    ports:
      - "3001:3001"
```

Run with:

```bash
docker-compose up -d
```

## Verification

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "behavioral-analytics-dashboard",
  "environment": "production"
}
```

### Type Check

```bash
npm run type-check
```

### Build Check

```bash
npm run build
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run server
```

### WebSocket Connection Issues

Ensure the backend service is running and accessible at the URL specified in `VITE_WS_URL`.

### Build Errors

Clear cache and reinstall:

```bash
rm -rf node_modules dist
npm install
npm run build
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] WebSocket server running
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Production build successful (`npm run build`)
- [ ] Health check endpoint responding
- [ ] Docker image built and tested
- [ ] CORS configured correctly
- [ ] Monitoring and logging configured

## Monitoring

The dashboard includes:

- Health check endpoint at `/health`
- Request logging middleware
- Error handling middleware
- Graceful shutdown handling

## Security Considerations

- CORS configured for specific origins
- Environment variables for sensitive data
- Input validation on all API requests
- XSS protection via React escaping
- No sensitive data in client-side code

## Performance

The production build includes:

- Code splitting (React, Charts, Socket.IO as separate chunks)
- Minification and compression
- Source maps for debugging
- Optimized bundle sizes

Build output:
- Main bundle: ~55 KB (gzipped: ~16 KB)
- React vendor: ~141 KB (gzipped: ~45 KB)
- Chart vendor: ~422 KB (gzipped: ~113 KB)
- Socket.IO vendor: ~41 KB (gzipped: ~13 KB)

Total: ~660 KB (gzipped: ~187 KB)
