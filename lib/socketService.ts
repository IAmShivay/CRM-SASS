import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let isInitializing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const initializeSocket = async (): Promise<Socket> => {
  if (socket) return socket;
  
  if (isInitializing) {
    // Wait for initialization to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (socket && !isInitializing) {
          clearInterval(checkInterval);
          resolve(socket);
        }
      }, 100);
    });
  }
  
  isInitializing = true;
  
  try {
    console.log('Initializing socket connection...');
    
    // First, set up the socket connection by hitting the API endpoint
    const response = await fetch('/api/listen');
    if (!response.ok) {
      throw new Error(`Failed to initialize socket server: ${response.status}`);
    }
    
    // Then create the socket with explicit configuration
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket?.id);
      reconnectAttempts = 0;
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
    });
    
    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached, giving up');
      }
    });
    
    // Listen for the test event from server
    socket.on('connection-established', (data) => {
      console.log('Server connection confirmed:', data);
    });
    
    // Add specific handler for new lead events
    socket.on('new-lead', (data) => {
      console.log('New lead event received on client:', data);
    });
    
    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    console.log('Manually disconnecting socket');
    socket.disconnect();
    socket = null;
  }
};
