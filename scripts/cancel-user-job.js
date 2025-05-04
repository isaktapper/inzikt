#!/usr/bin/env node

// Script to cancel an analysis job for a specific user
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

// Also try to load from .env.local if it exists
try {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
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
  console.warn('Failed to load .env.local file:', err.message);
}

// User ID to cancel jobs for
const userId = process.argv[2] || '384c468b-7ddd-4e25-8899-772397b2e8a7';

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('Invalid user ID format. Please provide a valid UUID.');
  process.exit(1);
}

async function cancelUserJob() {
  try {
    console.log(`Canceling analysis job for user: ${userId}`);
    
    // Get the service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    }
    
    // Use the last 8 characters as the service key for verification
    const serviceKeyShort = serviceKey.slice(-8);
    
    // API URL
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/cancel-user-job/${userId}?key=${serviceKeyShort}` 
      : `http://localhost:3000/api/cancel-user-job/${userId}?key=${serviceKeyShort}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    
    // Make the API request
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    if (data.success) {
      console.log('✅ Job canceled successfully!');
      if (data.jobId) {
        console.log(`Job ID: ${data.jobId}`);
      }
    } else {
      console.log(`ℹ️ ${data.message || 'No active job found.'}`);
    }
    
  } catch (error) {
    console.error('Error canceling job:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

cancelUserJob(); 