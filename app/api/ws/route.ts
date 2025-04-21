import { NextRequest } from 'next/server';
import { Server } from 'socket.io';
import { progressStore as analysisProgressStore } from '../analyze-tickets/route';

// Global variable to store Socket.io instance
let io: Server;

// Global map of active connections
const connections: Record<string, any> = {};

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

export async function GET(req: NextRequest) {
  // Get server response object from the NextRequest
  const res = await req.nextUrl;
  
  // Make sure socket server is only initialized once
  if (!io) {
    console.log('Initializing Socket.io server...');
    
    // Create Socket.io server
    // @ts-ignore - Next.js doesn't have correct types for this usage
    io = new Server({
      path: '/api/ws',
      addTrailingSlash: false,
      cors: {
        origin: isProduction ? [
          process.env.NEXT_PUBLIC_APP_URL || 'https://app.inzikt.co',
        ] : '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    // Set up namespaces for different types of real-time updates
    const importProgressNamespace = io.of('/import-progress');
    const analysisProgressNamespace = io.of('/analysis-progress');
    
    // Handle import progress connections
    importProgressNamespace.on('connection', (socket) => {
      const { jobId } = socket.handshake.query;
      
      if (!jobId || typeof jobId !== 'string') {
        console.log('Socket.io: Missing or invalid jobId, disconnecting');
        socket.disconnect();
        return;
      }
      
      console.log(`Socket.io: Client connected to import-progress namespace for job ${jobId}`);
      
      // Store the connection for broadcasting later
      if (!connections[`import:${jobId}`]) {
        connections[`import:${jobId}`] = [];
      }
      connections[`import:${jobId}`].push(socket);
      
      // Listen for disconnect
      socket.on('disconnect', () => {
        console.log(`Socket.io: Client disconnected from import-progress for job ${jobId}`);
        
        if (connections[`import:${jobId}`]) {
          const index = connections[`import:${jobId}`].indexOf(socket);
          if (index !== -1) {
            connections[`import:${jobId}`].splice(index, 1);
          }
          
          // Clean up empty arrays
          if (connections[`import:${jobId}`].length === 0) {
            delete connections[`import:${jobId}`];
          }
        }
      });
    });
    
    // Handle analysis progress connections
    analysisProgressNamespace.on('connection', (socket) => {
      const { userId } = socket.handshake.query;
      
      if (!userId || typeof userId !== 'string') {
        console.log('Socket.io: Missing or invalid userId for analysis progress, disconnecting');
        socket.disconnect();
        return;
      }
      
      console.log(`Socket.io: Client connected to analysis-progress namespace for user ${userId}`);
      
      // Store the connection for broadcasting later
      if (!connections[`analysis:${userId}`]) {
        connections[`analysis:${userId}`] = [];
      }
      connections[`analysis:${userId}`].push(socket);
      
      // Send initial progress data immediately after connection
      if (analysisProgressStore[userId]) {
        socket.emit('progress', analysisProgressStore[userId]);
      }
      
      // Listen for disconnect
      socket.on('disconnect', () => {
        console.log(`Socket.io: Client disconnected from analysis-progress for user ${userId}`);
        
        if (connections[`analysis:${userId}`]) {
          const index = connections[`analysis:${userId}`].indexOf(socket);
          if (index !== -1) {
            connections[`analysis:${userId}`].splice(index, 1);
          }
          
          // Clean up empty arrays
          if (connections[`analysis:${userId}`].length === 0) {
            delete connections[`analysis:${userId}`];
          }
        }
      });
    });
    
    console.log('Socket.io server initialized successfully');
  }
  
  // Return a simple response to acknowledge the WebSocket server is running
  return new Response('WebSocket server is running', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Function to broadcast import progress updates to connected clients
export function broadcastImportProgress(jobId: string, data: any) {
  const key = `import:${jobId}`;
  
  if (connections[key] && connections[key].length > 0) {
    console.log(`Broadcasting import progress update to ${connections[key].length} clients for job ${jobId}`);
    
    connections[key].forEach((socket: any) => {
      socket.emit('progress', data);
    });
  }
}

// Function to broadcast analysis progress updates to connected clients
export function broadcastAnalysisProgress(userId: string, data: any) {
  const key = `analysis:${userId}`;
  
  if (connections[key] && connections[key].length > 0) {
    console.log(`Broadcasting analysis progress update to ${connections[key].length} clients for user ${userId}`);
    
    connections[key].forEach((socket: any) => {
      socket.emit('progress', data);
    });
  }
} 