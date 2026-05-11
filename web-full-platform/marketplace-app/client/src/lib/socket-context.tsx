import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useSettings } from './settings-context';

const DEVICE_UUID_KEY = 'device_uuid';

function getOrCreateDeviceUUID(): string {
  let uuid = localStorage.getItem(DEVICE_UUID_KEY);
  if (!uuid) {
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem(DEVICE_UUID_KEY, uuid);
  }
  return uuid;
}

export function getDeviceUUID(): string {
  return getOrCreateDeviceUUID();
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setLeavingRoom: (leaving: boolean) => void; // Flag to suppress auto-rejoin during leave window
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomIdRef = useRef<string | null>(null);
  const isManualConnectRef = useRef<boolean>(false);
  const isLeavingRoomRef = useRef<boolean>(false); // Flag to suppress auto-rejoin during leave window
  const socketRef = useRef<Socket | null>(null); // Ref for cleanup to access latest socket
  const { user } = useAuth();
  const userRef = useRef<any>(null);
  
  // Keep userRef fresh - updates whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // Helper function to get current user identity (always uses fresh data from ref)
  // Wrapped in useCallback for stable reference
  const getUserIdentity = useCallback((socketId: string) => {
    const currentUser = userRef.current;
    const deviceUUID = getOrCreateDeviceUUID();
    const userId = currentUser 
      ? ((currentUser as any)._id || (currentUser as any).id || currentUser.id) 
      : `guest_${deviceUUID}`;
    const userName = currentUser 
      ? ((currentUser as any).userName || currentUser.firstName || currentUser.email) 
      : `Guest_${deviceUUID.slice(0, 6)}`;
    return { userId, userName, deviceUUID };
  }, []);

  useEffect(() => {
    // Fetch external API URL from backend config, then connect to Socket.IO
    const initializeSocket = async () => {
      try {
        // Get the external API URL from backend configuration
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!config.success || !config.data?.externalApiUrl) {
          throw new Error('Failed to fetch external API URL from config');
        }
        
        const EXTERNAL_API_URL = config.data.externalApiUrl;
        console.log('🔌 Connecting to Socket.IO server at external API:', EXTERNAL_API_URL);
        
        const socketInstance = io(EXTERNAL_API_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: false, // Don't connect automatically - only connect when needed
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity  // ✅ Never give up - keep trying
        });

        // Debug: Log ALL incoming socket events to discover what the server actually emits
        socketInstance.onAny((eventName, ...args) => {
          console.log('📨 [Socket Event Received]:', eventName, args);
        });

        socketInstance.on('connect', () => {
          console.log('✅ Socket.IO connected to external API:', EXTERNAL_API_URL);
          console.log('Socket ID:', socketInstance.id);
          setIsConnected(true);
          
          // Automatically rejoin the room if we were in one before disconnect
          // BUT skip if this is a manual connection (joinRoom will handle the emit)
          // AND skip if we're in the process of leaving (to prevent ghost rejoin)
          if (currentRoomIdRef.current && !isManualConnectRef.current && !isLeavingRoomRef.current) {
            console.log('🔄 Reconnected! Auto-rejoining room:', currentRoomIdRef.current);
            const socketId = socketInstance.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
            const { userId, userName, deviceUUID } = getUserIdentity(socketId);
            
            console.log('🔑 Auto-rejoin with user:', { userId, userName, deviceUUID });
            socketInstance.emit('join-room', {
              roomId: currentRoomIdRef.current,
              userId,
              userName,
              deviceUUID
            });
          }
          
          // Reset manual connect flag after handling
          isManualConnectRef.current = false;
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected, reason:', reason);
          setIsConnected(false);
          
          // If the server disconnected us, we need to manually reconnect
          // 'io server disconnect' means the server forcefully disconnected the socket
          // 'io client disconnect' means we called socket.disconnect()
          if (reason === 'io server disconnect') {
            console.log('🔄 Server disconnected us - manually reconnecting...');
            socketInstance.connect();
          }
          // For other reasons like 'transport close', 'ping timeout', etc.,
          // Socket.IO will automatically attempt to reconnect
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
        });
        
        // Log reconnection attempts for debugging
        socketInstance.io.on('reconnect_attempt', (attempt) => {
          console.log('🔄 Socket.IO reconnection attempt:', attempt);
        });
        
        socketInstance.io.on('reconnect', (attempt) => {
          console.log('✅ Socket.IO reconnected after', attempt, 'attempts');
        });
        
        socketInstance.io.on('reconnect_error', (error) => {
          console.error('❌ Socket.IO reconnection error:', error);
        });
        
        socketInstance.io.on('reconnect_failed', () => {
          console.error('❌ Socket.IO reconnection failed - all attempts exhausted');
        });

        socketRef.current = socketInstance; // Store in ref for cleanup
        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to initialize Socket.IO:', error);
      }
    };

    initializeSocket();

    return () => {
      // Cleanup socket connection on unmount (use ref to access latest socket)
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket on provider unmount');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(() => {
    if (!socket) {
      console.warn('⚠️ Cannot connect: socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.log('🔌 Manually connecting socket...');
      socket.connect();
    } else {
      console.log('✅ Socket already connected');
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (!socket) {
      console.warn('⚠️ Cannot disconnect: socket not initialized');
      return;
    }
    
    if (socket.connected) {
      console.log('🔌 Manually disconnecting socket...');
      socket.disconnect();
    }
  }, [socket]);

  const joinRoom = useCallback((roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot join room: socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.warn('⚠️ Cannot join room: socket not connected yet');
      return;
    }
    
    // Clear leaving flag since we're joining a room
    if (isLeavingRoomRef.current) {
      console.log('🔌 Clearing isLeavingRoom flag (joining new room)');
      isLeavingRoomRef.current = false;
    }
    
    // Store the room ID for auto-rejoin on reconnect
    currentRoomIdRef.current = roomId;
    
    // Get current user identity using fresh data
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const { userId, userName, deviceUUID } = getUserIdentity(socketId);
    
    console.log('📤 Emitting join-room event:', { roomId, userId, userName, deviceUUID });
    socket.emit('join-room', {
      roomId,
      userId,
      userName,
      deviceUUID
    });
  }, [socket, getUserIdentity]);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot leave room: socket not initialized');
      return;
    }
    
    // Clear currentRoomIdRef if it matches the room being left
    // This prevents auto-rejoin on reconnect after intentionally leaving
    // During room switches, joinRoom() will immediately set the new room ID
    if (currentRoomIdRef.current === roomId) {
      console.log('🔌 Clearing current room ref (leaving room):', roomId);
      currentRoomIdRef.current = null;
    }
    
    // Get current user identity using fresh data
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const { userId, userName } = getUserIdentity(socketId);
    
    console.log('📤 Emitting leave-room event:', { roomId, userId, userName });
    socket.emit('leave-room', {
      roomId,
      userId,
      userName
    });
  }, [socket, getUserIdentity]);

  // Set the leaving flag to suppress auto-rejoin during debounce window
  const setLeavingRoom = useCallback((leaving: boolean) => {
    console.log('🔌 Setting isLeavingRoom flag:', leaving);
    isLeavingRoomRef.current = leaving;
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect, joinRoom, leaveRoom, setLeavingRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
