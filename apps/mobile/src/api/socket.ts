import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../store/auth';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getAccessToken();
  socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket'],
    auth: { token },
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocketWithAuth() {
  disconnectSocket();
  return connectSocket();
}
