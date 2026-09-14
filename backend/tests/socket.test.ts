import http from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import app from '../src/app';
import {
  initSocket,
  emitAlertBroadcast,
  emitCheckinNew,
  emitSosNew,
  emitSosReply,
} from '../src/socket';
import { AuthService } from '../src/services/auth.service';

describe('SafeRoute Socket.IO Security & Role-Based Room Tests', () => {
  let httpServer: http.Server;
  let adminSocket: ClientSocket;
  let studentSocket: ClientSocket;
  let adminToken: string;
  let studentToken: string;
  let port: number;

  beforeAll((done) => {
    adminToken = AuthService.generateToken(1, 'admin');
    studentToken = AuthService.generateToken(10, 'student');
    httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(0, () => {
      const addr = httpServer.address();
      port = typeof addr === 'object' && addr ? addr.port : 5000;
      done();
    });
  });

  afterAll((done) => {
    if (adminSocket && adminSocket.connected) {
      adminSocket.disconnect();
    }
    if (studentSocket && studentSocket.connected) {
      studentSocket.disconnect();
    }
    httpServer.close(done);
  });

  it('1. should reject socket connection with missing token', (done) => {
    const unauthSocket = ioClient(`http://localhost:${port}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    unauthSocket.on('connect_error', (err) => {
      expect(err.message).toMatch(/JWT token required|Authentication error/i);
      unauthSocket.close();
      done();
    });
  });

  it('2. should reject socket connection with invalid token', (done) => {
    const invalidSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: 'invalid.jwt.token' },
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    invalidSocket.on('connect_error', (err) => {
      expect(err.message).toMatch(/Invalid or expired token|Authentication error/i);
      invalidSocket.close();
      done();
    });
  });

  it('3. should authenticate socket connection with valid JWT token', (done) => {
    adminSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: adminToken },
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      expect(adminSocket.connected).toBe(true);

      studentSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: studentToken },
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
      });

      studentSocket.on('connect', () => {
        expect(studentSocket.connected).toBe(true);
        done();
      });
    });
  });

  it('4. should route alert:broadcast to campus room (both admin and student receive it)', (done) => {
    let adminReceived = false;
    let studentReceived = false;

    const checkDone = () => {
      if (adminReceived && studentReceived) {
        adminSocket.off('alert:broadcast');
        studentSocket.off('alert:broadcast');
        done();
      }
    };

    adminSocket.on('alert:broadcast', (data) => {
      expect(data.title).toBe('Campus Test Alert');
      adminReceived = true;
      checkDone();
    });

    studentSocket.on('alert:broadcast', (data) => {
      expect(data.title).toBe('Campus Test Alert');
      studentReceived = true;
      checkDone();
    });

    emitAlertBroadcast({ title: 'Campus Test Alert', message: 'Test evacuation message.' });
  });

  it('5. should route checkin:new to coordinators room only (student does NOT receive it)', (done) => {
    let adminReceived = false;
    let studentReceived = false;

    adminSocket.on('checkin:new', (data) => {
      expect(data.user_id).toBe(99);
      adminReceived = true;
    });

    studentSocket.on('checkin:new', () => {
      studentReceived = true;
    });

    emitCheckinNew({ checkin_id: 1, user_id: 99, status: 'safe' });

    setTimeout(() => {
      expect(adminReceived).toBe(true);
      expect(studentReceived).toBe(false);
      adminSocket.off('checkin:new');
      studentSocket.off('checkin:new');
      done();
    }, 300);
  });

  it('6. should route sos:reply directly to user_10 socket room', (done) => {
    let studentReceived = false;

    studentSocket.on('sos:reply', (data) => {
      expect(data.receiver_id).toBe(10);
      expect(data.content).toBe('Help is on the way!');
      studentReceived = true;
      studentSocket.off('sos:reply');
      done();
    });

    emitSosReply({ message_id: 5, receiver_id: 10, content: 'Help is on the way!' });
  });

  it('7. should enforce rate limiting (max 10 events per second)', (done) => {
    let errorTriggered = false;

    adminSocket.on('error', (errData) => {
      if (typeof errData === 'object' && errData?.message?.includes('Rate limit exceeded')) {
        errorTriggered = true;
        adminSocket.off('error');
        done();
      }
    });

    // Send 12 rapid ping events to exceed rate limit of 10 events/sec
    for (let i = 0; i < 12; i++) {
      adminSocket.emit('ping_test', { count: i });
    }
  });

  it('8. should disconnect socket when JWT token expires', (done) => {
    // Generate token that expires in 1 second
    const shortLivedToken = AuthService.generateToken(88, 'student');
    // Modify exp manually for short expiry testing
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'saferoute-super-secret-key-2026';
    const expiredToken = jwt.sign({ user_id: 88, role: 'student' }, secret, { expiresIn: '1s' });

    const expiringSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: expiredToken },
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    expiringSocket.on('token_expired', (data) => {
      expect(data.message).toMatch(/expired/i);
    });

    expiringSocket.on('disconnect', (reason) => {
      expiringSocket.close();
      done();
    });
  }, 5000);
});
