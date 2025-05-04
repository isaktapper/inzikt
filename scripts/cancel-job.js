// No need to import fetch in Node.js 18+

async function cancelJob() {
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797';
  
  try {
    console.log(`Attempting to cancel job: ${jobId}`);
    
    // Call the API to cancel the job
    const response = await fetch('http://localhost:3000/api/analyze-tickets/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel job');
    }
    
    console.log('✅ Job canceled successfully:', data.message);
  } catch (error) {
    console.error('❌ Error canceling job:', error.message);
  }
}

// Run the function
cancelJob(); 