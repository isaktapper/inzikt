#!/bin/bash

# Find the Node.js process running on port 3000
PID=$(lsof -ti:3000)

if [ -z "$PID" ]; then
  echo "No process found running on port 3000"
else
  echo "Killing Node.js process with PID: $PID"
  kill -9 $PID
  echo "Process terminated"
fi

# Wait a moment to ensure the port is freed up
sleep 2

# Check if still running
if lsof -ti:3000 > /dev/null; then
  echo "Warning: Process is still running on port 3000"
  echo "You may need to manually kill it with: kill -9 $(lsof -ti:3000)"
else
  echo "Port 3000 is now available"
  
  # Restart the application
  echo "Restarting the application..."
  npm run dev
fi 