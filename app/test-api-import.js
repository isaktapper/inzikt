// Simple script to test the ticket import API
// Can be run with: node test-api-import.js
async function testTicketImport() {
  try {
    console.log('Testing ticket import API...');
    
    // Make a request to the ticket import API
    const response = await fetch('http://localhost:3000/api/zendesk/tickets?limit=10', {
      method: 'GET',
      credentials: 'include', // Include auth cookies if needed
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error during API call:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API response:', data);
    console.log('Number of tickets:', data.tickets ? data.tickets.length : 0);
    
    if (data.tickets && data.tickets.length > 0) {
      console.log('First ticket:', data.tickets[0]);
    }
    
    console.log('Test complete!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testTicketImport(); 