import http from 'http';
import app from './app';
import { initSocket } from './socket';
import dotenv from 'dotenv';

dotenv.config();

const INITIAL_PORT = parseInt(process.env.PORT || '5000', 10);

function createAndStartServer(port: number) {
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err: any) => {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is reserved/in-use by Windows System. Retrying on port ${port + 1}...`);
      server.close(() => {
        createAndStartServer(port + 1);
      });
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    console.log(`===================================================`);
    console.log(`🚨 SafeRoute Backend API Server Running on Port ${port}`);
    console.log(`🌐 Base URL: http://localhost:${port}`);
    console.log(`⚡ Socket.IO Server Ready: ws://localhost:${port}`);
    console.log(`🔐 Auth Endpoints: http://localhost:${port}/api/auth`);
    console.log(`===================================================`);
  });
}

createAndStartServer(INITIAL_PORT);
