// Quick test for timestamp conversion
console.log('Testing timestamp conversion:');

// Example Unix timestamp from a match (current time)
const unixTimestamp = Math.floor(Date.now() / 1000);
console.log('Original Unix timestamp:', unixTimestamp);

// Convert to PostgreSQL timestamp format
const postgresTimestamp = new Date(unixTimestamp * 1000).toISOString();
console.log('PostgreSQL timestamp:', postgresTimestamp);

// Convert back to Unix timestamp
const convertedBack = Math.floor(new Date(postgresTimestamp).getTime() / 1000);
console.log('Converted back:', convertedBack);

// Verify they match
console.log('Match:', unixTimestamp === convertedBack ? '✅' : '❌');

// Test with actual match timestamp from the error
const errorTimestamp = 1756562985;
console.log('\nTesting with error timestamp:', errorTimestamp);
console.log('Date:', new Date(errorTimestamp * 1000).toISOString());
console.log('Year:', new Date(errorTimestamp * 1000).getFullYear());
