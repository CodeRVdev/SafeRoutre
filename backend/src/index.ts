import http from 'http';
import app from './app';
import { initSocket } from './socket';
import pool from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const INITIAL_PORT = parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || (isProduction ? '127.0.0.1' : '0.0.0.0');

function createAndStartServer(port: number) {
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err: any) => {
    if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && !isProduction) {
      console.warn(`⚠️ Port ${port} is reserved/in-use by Windows System. Retrying on port ${port + 1}...`);
      server.close(() => {
        createAndStartServer(port + 1);
      });
    } else {
      console.error(`🚨 Fatal Server Error on ${HOST}:${port}:`, err);
      process.exit(1);
    }
  });

  server.listen(port, HOST, () => {
    console.log(`===================================================`);
    console.log(`🚨 SafeRoute Backend API Server Running on ${HOST}:${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ Socket.IO Server Ready on ${HOST}:${port}`);
    console.log(`🔐 Auth Endpoints: http://${HOST}:${port}/api/auth`);
    console.log(`===================================================`);
  });

  // Graceful shutdown handlers for PM2 / process managers
  const handleShutdown = (signal: string) => {
    console.log(`\n🛑 ${signal} received: closing HTTP server and database pool...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      try {
        await pool.end();
        console.log('📦 PostgreSQL connection pool drained.');
      } catch (poolErr) {
        console.error('Error closing database pool:', poolErr);
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown exceeds timeout (10s)
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating after shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

createAndStartServer(INITIAL_PORT);
