const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { bech32 } = require('bech32');

// Define source and target prefixes
const STARGAZE_PREFIX = 'stars';
const COSMOS_PREFIX = 'cosmos';

// CSV writer setup
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  header: [
    { id: 'stargazeAddress', title: 'StargazeAddress' },
    { id: 'cosmosAddress', title: 'CosmosAddress' },
    { id: 'txCount', title: 'TxCount' }
  ]
});

// Function to convert address prefix
function convertAddressPrefix(address, fromPrefix, toPrefix) {
  try {
    // Decode the bech32 address
    const { prefix, words } = bech32.decode(address);
    
    // Verify it has the expected prefix
    if (prefix !== fromPrefix) {
      throw new Error(`Invalid prefix: expected ${fromPrefix} but got ${prefix}`);
    }
    
    // Encode with the new prefix
    return bech32.encode(toPrefix, words);
  } catch (error) {
    console.error(`Error converting address ${address}: ${error.message}`);
    return null;
  }
}

// Process the CSV file
const results = [];
fs.createReadStream('sg-6-month-addresses-tx-count.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Extract the Stargaze address and tx count from the row
    const stargazeAddress = row.address;
    const txCount = row.tx_count;
    
    // Skip empty or invalid addresses
    if (!stargazeAddress || stargazeAddress.trim() === '') {
      console.log(`Skipping empty address with tx_count: ${txCount}`);
      return;
    }
    
    // Convert to Cosmos address
    const cosmosAddress = convertAddressPrefix(stargazeAddress, STARGAZE_PREFIX, COSMOS_PREFIX);
    
    if (cosmosAddress) {
      results.push({
        stargazeAddress,
        cosmosAddress,
        txCount
      });
    }
  })
  .on('end', () => {
    // Write results to output.csv
    csvWriter.writeRecords(results)
      .then(() => {
        console.log(`Converted ${results.length} addresses successfully.`);
        console.log('Output written to output.csv');
      });
  })
  .on('error', (error) => {
    console.error('Error processing CSV file:', error);
  });