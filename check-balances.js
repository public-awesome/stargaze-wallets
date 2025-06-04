const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const https = require('https');

// Multiple API endpoints for load balancing
const API_ENDPOINTS = [
  'https://lcd-cosmoshub.keplr.app',
  'https://cosmos-rest.publicnode.com',
  'https://rest-cosmoshub.ecostake.com'
];

let currentEndpointIndex = 0;

// Function to get next endpoint in rotation
function getNextEndpoint() {
  const endpoint = API_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % API_ENDPOINTS.length;
  return endpoint;
}

// CSV writer setup for hub.csv - function to create writer with append option
function createCsvWriter(append = false) {
  return createObjectCsvWriter({
    path: 'hub.csv',
    header: [
      { id: 'stargazeAddress', title: 'StargazeAddress' },
      { id: 'cosmosAddress', title: 'CosmosAddress' },
      { id: 'balance', title: 'Balance' },
      { id: 'isStaking', title: 'IsStaking' }
    ],
    append: append
  });
}

// Function to check staking status of a Cosmos Hub address
async function checkStakingStatus(address) {
  return new Promise((resolve) => {
    const baseUrl = getNextEndpoint();
    const url = `${baseUrl}/cosmos/staking/v1beta1/delegations/${address}`;
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (!data || data.trim() === '') {
            return resolve('No');
          }
          
          const response = JSON.parse(data);
          const hasStaking = response.delegation_responses && response.delegation_responses.length > 0;
          
          resolve(hasStaking ? 'Yes' : 'No');
        } catch (error) {
          console.error(`Error checking staking for ${address}: ${error.message}`);
          resolve('No'); // Return No in case of errors
        }
      });
    });
    
    req.setTimeout(10000, () => {
      console.log(`Staking request timed out for ${address}`);
      req.abort();
      resolve('No');
    });
    
    req.on('error', (error) => {
      console.error(`Error fetching staking for ${address}: ${error.message}`);
      resolve('No');
    });
  });
}

// Function to check balance of a Cosmos Hub address
async function checkBalance(address) {
  return new Promise((resolve) => {
    // Use endpoint rotation for load balancing
    const baseUrl = getNextEndpoint();
    const url = `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;
    
    const req = https.get(url, (res) => {
      let data = '';
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect - but in this case, just return 0 for simplicity
        console.log(`Redirect received for ${address}, assuming zero balance`);
        return resolve('0');
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Check if data is empty or not valid JSON
          if (!data || data.trim() === '') {
            console.log(`Empty response for ${address}, assuming zero balance`);
            return resolve('0');
          }
          
          const response = JSON.parse(data);
          
          // Check if there's any ATOM balance
          let atomBalance = '0';
          if (response.balances && response.balances.length > 0) {
            const atomCoin = response.balances.find(coin => coin.denom === 'uatom');
            if (atomCoin) {
              // Convert uatom (microatom) to ATOM
              atomBalance = (parseFloat(atomCoin.amount) / 1000000).toString();
            }
          }
          
          resolve(atomBalance);
        } catch (error) {
          console.error(`Error parsing response for ${address}: ${error.message}`);
          console.error(`Raw response: ${data.substring(0, 100)}...`);
          resolve('0'); // Return 0 in case of errors
        }
      });
    });
    
    // Set a timeout to avoid hanging requests
    req.setTimeout(10000, () => {
      console.log(`Request timed out for ${address}`);
      req.abort();
      resolve('0');
    });
    
    req.on('error', (error) => {
      console.error(`Error fetching balance for ${address}: ${error.message}`);
      resolve('0'); // Return 0 in case of errors
    });
  });
}

// Utility function to delay execution
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process addresses with balances
async function processAddresses() {
  const addresses = [];
  
  // Read output.csv and collect all addresses
  await new Promise((resolve) => {
    fs.createReadStream('output.csv')
      .pipe(csv())
      .on('data', (row) => {
        addresses.push(row);
      })
      .on('end', resolve);
  });
  
  console.log(`Processing ${addresses.length} addresses...`);
  
  // Clear existing hub.csv file
  if (fs.existsSync('hub.csv')) {
    fs.unlinkSync('hub.csv');
  }
  
  let totalProcessed = 0;
  // Process addresses in larger batches since we're load balancing across multiple endpoints
  const batchSize = 9; // 3 endpoints * 3 requests per endpoint
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchResults = [];
    
    const batchPromises = batch.map(async (row) => {
      const stargazeAddress = row.StargazeAddress;
      const cosmosAddress = row.CosmosAddress;
      
      // Check balance and staking status
      const balance = await checkBalance(cosmosAddress);
      const isStaking = await checkStakingStatus(cosmosAddress);
      
      // Always include the address, whether it has a balance or not
      return {
        stargazeAddress,
        cosmosAddress,
        balance,
        isStaking
      };
    });
    
    const results = await Promise.all(batchPromises);
    batchResults.push(...results);
    
    // Write this batch to hub.csv (append mode for subsequent batches)
    const csvWriter = createCsvWriter(i > 0);
    await csvWriter.writeRecords(batchResults);
    
    totalProcessed += batchResults.length;
    console.log(`Processed ${totalProcessed} of ${addresses.length} addresses - batch written to hub.csv`);
    
    // Reduced delay since we're distributing load across multiple endpoints
    if (i + batchSize < addresses.length) {
      console.log('Waiting 1 second before processing next batch...');
      await sleep(1000);
    }
  }
  
  console.log(`Completed processing ${totalProcessed} addresses.`);
  console.log('All results written to hub.csv');
}

// Run the process
processAddresses().catch(error => {
  console.error('Error processing addresses:', error);
});