// Script to directly communicate with the server and force terminate a job
// Use native fetch in Node.js 18+

async function forceTerminateJob() {
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797';
  const userId = '2111f0cb-5f26-49af-a748-2784f39761da'; // From the logs
  
  try {
    console.log('Sending direct command to terminate in-memory job processing...');
    
    // First, update the job to canceled status
    const cancelResponse = await fetch('http://localhost:3000/api/analyze-tickets/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        jobId,
        forceTerminate: true, // Special flag to force termination
        userId 
      }),
    });
    
    console.log('Cancel API Response Status:', cancelResponse.status);
    
    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.text();
      console.error('Error response:', errorData);
    } else {
      const data = await cancelResponse.json();
      console.log('Cancel API Response:', data);
    }
    
    // Now try to directly communicate with the debugging endpoint
    const debugResponse = await fetch('http://localhost:3000/api/debug/terminate-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        jobId,
        userId,
        command: 'FORCE_TERMINATE'
      }),
    });
    
    if (debugResponse.ok) {
      console.log('Successfully sent termination command');
      const data = await debugResponse.json();
      console.log(data);
    } else {
      console.log('Debug endpoint response status:', debugResponse.status);
      try {
        const errorText = await debugResponse.text();
        console.error('Debug endpoint error:', errorText);
      } catch (e) {
        console.error('Could not parse debug response');
      }
    }
    
    console.log('\nThe job should be terminated, but you may need to restart the server to fully stop the process.');
    console.log('To restart the server, press Ctrl+C in the terminal where it\'s running, then run: npm run dev');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the function
forceTerminateJob(); 