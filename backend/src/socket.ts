import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from './services/auth.service';

let io: SocketIOServer | null = null;

export interface SocketUserPayload {
  user_id: number;
  role: string;
  exp?: number;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT Middleware for Socket.IO connection authentication
  io.use((socket: Socket, next) => {
    const authHeader =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    if (!token) {
      return next(new Error('Authentication error: JWT token required.'));
    }

    try {
      const decoded = AuthService.verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid or expired token.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUserPayload;
    const role = (user?.role || '').toLowerCase();
    const isCoordinatorOrAdmin = role === 'admin' || role === 'coordinator';

    // Auto-join role-based event rooms
    socket.join('campus');
    if (user?.user_id) {
      socket.join(`user_${user.user_id}`);
    }
    if (isCoordinatorOrAdmin) {
      socket.join('coordinators');
    }

    console.log(
      `🔌 Socket Connected: socket_id=${socket.id}, user_id=${user?.user_id}, role=${user?.role}, rooms=campus,user_${user?.user_id}${
        isCoordinatorOrAdmin ? ',coordinators' : ''
      }`
    );

    // Incoming Event Rate-Limiter (max 10 events per second per client)
    let eventCount = 0;
    let resetTime = Date.now() + 1000;

    socket.use((packet, next) => {
      const now = Date.now();
      if (now > resetTime) {
        eventCount = 0;
        resetTime = now + 1000;
      }
      eventCount++;

      if (eventCount > 10) {
        socket.emit('error', {
          message: 'Rate limit exceeded. Maximum 10 events per second allowed.',
        });
        return next(new Error('Rate limit exceeded. Maximum 10 events per second allowed.'));
      }
      next();
    });

    // Active JWT Token Expiry Disconnect Timer
    let expiryTimer: NodeJS.Timeout | null = null;
    if (user?.exp) {
      const msUntilExpiry = user.exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        console.warn(`⚠️ Socket disconnected immediately: Token already expired for user_id=${user.user_id}`);
        socket.emit('token_expired', { message: 'JWT token has expired. Please re-authenticate.' });
        socket.disconnect(true);
      } else {
        expiryTimer = setTimeout(() => {
          console.warn(`⚠️ Active JWT Token Expired: Disconnecting socket_id=${socket.id}, user_id=${user.user_id}`);
          socket.emit('token_expired', { message: 'JWT token has expired. Please re-authenticate.' });
          socket.disconnect(true);
        }, msUntilExpiry);
      }
    }

    socket.on('disconnect', (reason) => {
      if (expiryTimer) {
        clearTimeout(expiryTimer);
      }
      console.log(`🔌 Socket Disconnected: socket_id=${socket.id}, user_id=${user?.user_id}, reason=${reason}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
}

/**
 * Emits new hazard event to all connected users in "campus" room.
 */
export function emitHazardNew(hazardData: any): void {
  if (io) {
    io.to('campus').emit('hazard:new', hazardData);
  }
}

/**
 * Emits hazard resolved event to all connected users in "campus" room.
 */
export function emitHazardResolved(hazardData: any): void {
  if (io) {
    io.to('campus').emit('hazard:resolved', hazardData);
  }
}

/**
 * Emits hazard updated event to all connected users in "campus" room.
 */
export function emitHazardUpdated(hazardData: any): void {
  if (io) {
    io.to('campus').emit('hazard:updated', hazardData);
  }
}

/**
 * Emits emergency alert broadcast to all connected users in "campus" room.
 */
export function emitAlertBroadcast(alertData: any): void {
  if (io) {
    io.to('campus').emit('alert:broadcast', alertData);
  }
}

/**
 * Emits alert resolved/deactivated event to all connected users in "campus" room.
 */
export function emitAlertResolved(alertData: any): void {
  if (io) {
    io.to('campus').emit('alert:resolved', alertData);
  }
}

/**
 * Emits check-in event exclusively to safety coordinators & admins in "coordinators" room.
 */
export function emitCheckinNew(checkinData: any): void {
  if (io) {
    io.to('coordinators').emit('checkin:new', checkinData);
  }
}

/**
 * Emits new distress SOS message exclusively to safety coordinators & admins in "coordinators" room.
 */
export function emitSosNew(sosData: any): void {
  if (io) {
    io.to('coordinators').emit('sos:new', sosData);
  }
}

/**
 * Emits coordinator SOS response directly to specific recipient user's socket room and to "coordinators" room.
 */
export function emitSosReply(replyData: any): void {
  if (io) {
    if (replyData && replyData.receiver_id) {
      io.to(`user_${replyData.receiver_id}`).to('coordinators').emit('sos:reply', replyData);
    } else {
      io.to('coordinators').emit('sos:reply', replyData);
    }
  }
}
