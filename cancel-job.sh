#!/bin/bash

echo "Canceling job d2102f06-1439-4c11-a847-b593b35d8797..."
echo "Sending request to API..."

response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jobId": "d2102f06-1439-4c11-a847-b593b35d8797"}' http://localhost:3000/api/analyze-tickets/cancel)

echo "Response: $response"

if [[ $response == *"success"* ]]; then
  echo "✅ Job canceled successfully!"
else
  echo "❌ Failed to cancel job. See response for details."
fi

echo "You can check the job status at http://localhost:3000/jobs"
