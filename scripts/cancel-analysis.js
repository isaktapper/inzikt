#!/usr/bin/env node

// Script to cancel an ongoing ticket analysis for a specific user
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Try to load environment variables from .env file manually
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('Failed to load .env file:', err.message);
}

// User ID to cancel analysis for (default to the ID provided in the request)
const userId = process.argv[2] || '384c468b-7ddd-4e25-8899-772397b2e8a7';

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('Invalid user ID format. Please provide a valid UUID.');
  process.exit(1);
}

async function cancelAnalysis() {
  try {
    console.log(`Canceling ticket analysis for user: ${userId}`);
    
    // API URL (assuming we're running this on the same server or localhost)
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/analyze-tickets/cancel` 
      : 'http://localhost:3000/api/analyze-tickets/cancel';
    
    console.log(`Making API request to: ${apiUrl}`);
    
    // Make the API request with the user ID
    const response = await axios.post(apiUrl, {
      userId: userId
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = response.data;
    
    console.log('Analysis job cancellation response:', data);
    
    if (data.success) {
      console.log('✅ Job canceled successfully!');
    } else {
      console.log('❌ Something went wrong with job cancellation');
    }
    
  } catch (error) {
    console.error('Error canceling analysis:', error.response?.data?.error || error.message);
    if (error.response?.status === 404) {
      console.log('No active analysis jobs found for this user.');
    }
    process.exit(1);
  }
}

cancelAnalysis(); 