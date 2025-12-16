/**
 * WebSocket Server Setup
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { BehavioralPrediction, InterventionRecommendation } from './models/types.js';

/**
 * WebSocket server manager
 */
export class WebSocketManager {
  private io: SocketServer;
  private activeConnections: Map<string, Socket> = new Map();

  constructor(port: number) {
    this.io = new SocketServer(port, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    console.log(`WebSocket server listening on port ${port}`);
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.activeConnections.set(socket.id, socket);

      socket.on('subscribe_session', (sessionId: string) => {
        socket.join(`session_${sessionId}`);
        console.log(`Client ${socket.id} subscribed to session ${sessionId}`);
      });

      socket.on('unsubscribe_session', (sessionId: string) => {
        socket.leave(`session_${sessionId}`);
        console.log(`Client ${socket.id} unsubscribed from session ${sessionId}`);
      });

      socket.on('subscribe_user', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`Client ${socket.id} subscribed to user ${userId}`);
      });

      socket.on('unsubscribe_user', (userId: string) => {
        socket.leave(`user_${userId}`);
        console.log(`Client ${socket.id} unsubscribed from user ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Broadcast behavioral state to session subscribers
   */
  public broadcastBehavioralState(sessionId: string, prediction: BehavioralPrediction): void {
    this.io.to(`session_${sessionId}`).emit('behavioral_state', prediction);
  }

  /**
   * Broadcast intervention to session subscribers
   */
  public broadcastIntervention(sessionId: string, intervention: InterventionRecommendation): void {
    this.io.to(`session_${sessionId}`).emit('intervention', intervention);
  }

  /**
   * Broadcast to user across all their sessions
   */
  public broadcastToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  /**
   * Send to specific client
   */
  public sendToClient(socketId: string, event: string, data: any): void {
    const socket = this.activeConnections.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): { totalConnections: number; activeRooms: string[] } {
    const rooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('session_') || room.startsWith('user_'));

    return {
      totalConnections: this.activeConnections.size,
      activeRooms: rooms
    };
  }

  /**
   * Close WebSocket server
   */
  public close(): void {
    console.log('Closing WebSocket server...');
    this.io.close();
    this.activeConnections.clear();
  }
}

/**
 * Create WebSocket manager instance
 */
export function createWebSocketManager(port: number): WebSocketManager {
  return new WebSocketManager(port);
}
