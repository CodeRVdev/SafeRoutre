import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

const isProd = import.meta.env.PROD;
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;

const defaultSocketOrigin =
  typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : 'http://localhost:5002';

const SOCKET_URLS: string[] = configuredSocketUrl
  ? [configuredSocketUrl]
  : isProd
  ? [defaultSocketOrigin]
  : ['http://localhost:5002', 'http://localhost:5001', 'http://localhost:5000'];

let currentUrlIndex = 0;

export function connectSocket(token: string): Socket {
  currentToken = token;

  if (socket && socket.connected) {
    return socket;
  }

  const currentUrl = SOCKET_URLS[currentUrlIndex] || SOCKET_URLS[0];

  socket = io(currentUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('⚡ Web Admin Socket Connected on:', currentUrl, socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ Web Admin Socket Connect Error on', currentUrl, err.message);
    if (socket && !socket.connected && currentUrlIndex < SOCKET_URLS.length - 1) {
      socket.disconnect();
      currentUrlIndex++;
      const nextUrl = SOCKET_URLS[currentUrlIndex];
      socket = io(nextUrl, {
        auth: { token: currentToken },
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
    }
  });

  socket.on('token_expired', (data) => {
    console.warn('⚠️ Web Admin Socket Received token_expired:', data);
    disconnectSocket();
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Web Admin Socket Disconnected:', reason);
  });

  return socket;
}

export function reconnectWithToken(newToken: string): Socket {
  disconnectSocket();
  return connectSocket(newToken);
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
