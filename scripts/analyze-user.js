#!/usr/bin/env node

// Script to trigger ticket analysis for a specific user
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

// User ID to analyze (default to the ID provided in the request)
const userId = process.argv[2] || '384c468b-7ddd-4e25-8899-772397b2e8a7';

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('Invalid user ID format. Please provide a valid UUID.');
  process.exit(1);
}

async function startAnalysis() {
  try {
    console.log(`Starting ticket analysis for user: ${userId}`);
    
    // Get the service key from environment or .env.local file
    const serviceKeyFile = path.resolve(process.cwd(), '.env.local');
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey && fs.existsSync(serviceKeyFile)) {
      try {
        const envLocalContent = fs.readFileSync(serviceKeyFile, 'utf8');
        const match = envLocalContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
        if (match && match[1]) {
          serviceKey = match[1].trim().replace(/^['"]|['"]$/g, '');
        }
      } catch (err) {
        console.warn('Failed to read .env.local file:', err.message);
      }
    }
    
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    }
    
    // Use the last 8 characters as the service key for verification
    const serviceKeyShort = serviceKey.slice(-8);
    
    // API URL (assuming we're running this on the same server or localhost)
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/analyze-user` 
      : 'http://localhost:3000/api/analyze-user';
    
    console.log(`Making API request to: ${apiUrl}`);
    
    // Make the API request with the service key and user ID
    const response = await axios.post(apiUrl, {
      userId: userId,
      serviceKey: serviceKeyShort
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = response.data;
    
    if (data.count === 0) {
      console.log('No tickets found that need analysis for this user.');
    } else {
      console.log(`Analysis started for ${data.count} tickets!`);
      console.log(`Job ID: ${data.jobId}`);
    }
    
    // Log full response for debugging
    console.log('Full API response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error starting analysis:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

startAnalysis(); 