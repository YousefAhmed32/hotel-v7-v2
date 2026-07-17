import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const useSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!token) return;
    socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket','polling'], reconnectionDelay: 1000, reconnectionAttempts: 5 });
    const socket = socketRef.current;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));
    return () => { socket.disconnect(); socketRef.current = null; setIsConnected(false); };
  }, [token]);
  return { socket: socketRef.current, isConnected };
};
