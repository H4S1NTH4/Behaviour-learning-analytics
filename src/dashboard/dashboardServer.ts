/**
 * Dashboard Server
 *
 * Simple HTTP server to serve the React dashboard
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = parseInt(process.env.DASHBOARD_PORT || '3002');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API endpoints for dashboard data
app.get('/api/sessions/active', (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: []
    }
  });
});

app.get('/api/sessions/:sessionId/metrics', (req, res) => {
  const { sessionId } = req.params;
  res.json({
    success: true,
    data: {
      sessionId,
      totalKeystrokes: 0,
      typingSpeed: 0,
      errorRate: 0,
      pauseCount: 0,
      avgDwellTime: 0,
      duration: 0
    }
  });
});

app.get('/api/sessions/:sessionId/states', (req, res) => {
  const { sessionId } = req.params;
  res.json({
    success: true,
    data: {
      sessionId,
      states: []
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Dashboard client connected:', socket.id);

  socket.on('subscribe_session', (sessionId) => {
    console.log(`Client ${socket.id} subscribed to session ${sessionId}`);
    socket.join(`session_${sessionId}`);
  });

  socket.on('unsubscribe_session', (sessionId) => {
    console.log(`Client ${socket.id} unsubscribed from session ${sessionId}`);
    socket.leave(`session_${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Dashboard client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard server healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Behavioral Learning Analytics Dashboard</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          width: 100%;
        }
        h1 {
          color: #667eea;
          margin-bottom: 20px;
          text-align: center;
        }
        .status {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .status h2 {
          color: #1e40af;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .status p {
          color: #64748b;
          line-height: 1.6;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .card h3 {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .card p {
          font-size: 24px;
          font-weight: bold;
        }
        .info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }
        .info h3 {
          color: #334155;
          margin-bottom: 10px;
        }
        .info ul {
          list-style: none;
          padding-left: 0;
        }
        .info li {
          color: #64748b;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .info li:last-child {
          border-bottom: none;
        }
        .badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎓 Behavioral Learning Analytics</h1>

        <div class="status">
          <h2>✅ Dashboard Server Running</h2>
          <p>The Learning Analytics Dashboard server is operational and ready to display real-time student behavioral data.</p>
        </div>

        <div class="grid">
          <div class="card">
            <h3>API Server</h3>
            <p><span class="badge">Port 3000</span></p>
          </div>
          <div class="card">
            <h3>Inference Engine</h3>
            <p><span class="badge">Port 3001</span></p>
          </div>
          <div class="card">
            <h3>Dashboard</h3>
            <p><span class="badge">Port 3002</span></p>
          </div>
        </div>

        <div class="info">
          <h3>📊 Available Features</h3>
          <ul>
            <li>✨ Real-time behavioral state detection</li>
            <li>📈 Keystroke dynamics analysis</li>
            <li>🎯 Cognitive load monitoring</li>
            <li>🔐 Continuous passive authentication</li>
            <li>💡 Intelligent intervention recommendations</li>
            <li>📉 Struggle detection and alerts</li>
          </ul>
        </div>

        <div class="info">
          <h3>🚀 Next Steps</h3>
          <ul>
            <li>Set up PostgreSQL with TimescaleDB extension</li>
            <li>Run database schema migrations</li>
            <li>Train LSTM model with labeled data</li>
            <li>Integrate with Monaco Editor or coding IDE</li>
            <li>Configure environment variables</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start server
server.listen(PORT, () => {
  console.log(`📊 Dashboard server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
