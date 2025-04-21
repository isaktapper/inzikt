const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Keep track of active connections
const activeConnections = new Map();

// Prepare the app
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Special case for WebSocket upgrade
      if (pathname === '/api/ws/import-progress') {
        // WebSockets will be handled by Socket.IO
        res.statusCode = 426;
        res.end('Upgrade Required');
        return;
      }

      // Let Next.js handle the rest
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/ws',
    serveClient: false,
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    cors: {
      origin: dev ? ['http://localhost:3000'] : [process.env.NEXT_PUBLIC_APP_URL],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Create a namespace for import progress
  const importNamespace = io.of('/import-progress');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Handle WebSocket connections to import progress
  importNamespace.on('connection', async (socket) => {
    const { jobId } = socket.handshake.query;
    console.log(`New WebSocket connection for import job: ${jobId}`);

    if (!jobId) {
      socket.disconnect(true);
      return;
    }

    // Setup Supabase realtime subscription
    try {
      // Store connection in the map
      activeConnections.set(socket.id, { socket, jobId });

      // Fetch the initial job state
      const { data: job, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        console.error('Failed to fetch job data:', error);
        socket.emit('error', { message: 'Job not found or error fetching job data' });
      } else {
        // Send initial data
        socket.emit('progress', job);

        // Set up Supabase realtime subscription for job updates
        const subscription = supabase
          .channel(`import_job:${jobId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'import_jobs', 
            filter: `id=eq.${jobId}` 
          }, (payload) => {
            // Forward the update to the connected client
            socket.emit('progress', payload.new);
            
            // If job is completed, send one more message and close subscription
            if (payload.new.stage === 'completed' || payload.new.isCompleted) {
              console.log(`Import job ${jobId} completed, closing subscription`);
              subscription.unsubscribe();
            }
          })
          .subscribe();

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log(`WebSocket disconnected for import job: ${jobId}`);
          activeConnections.delete(socket.id);
          subscription.unsubscribe();
        });
      }
    } catch (error) {
      console.error('Error setting up Supabase subscription:', error);
      socket.emit('error', { message: 'Failed to setup realtime updates' });
    }
  });

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 