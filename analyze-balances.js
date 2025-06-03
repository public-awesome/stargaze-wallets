const fs = require('fs');

// Read and parse the CSV file
const csvData = fs.readFileSync('hub.csv', 'utf8');
const lines = csvData.trim().split('\n');
const header = lines[0];
const dataLines = lines.slice(1);

let totalAccounts = 0;
let accountsWithBalance = 0;
let accountsWithZeroBalance = 0;
let stargazeAccountsWithBalance = new Set();
let cosmosAccountsWithBalance = new Set();

// Process each line
dataLines.forEach(line => {
    const [stargazeAddress, cosmosAddress, balance] = line.split(',');
    const balanceNum = parseFloat(balance);
    
    totalAccounts++;
    
    if (balanceNum > 0) {
        accountsWithBalance++;
        stargazeAccountsWithBalance.add(stargazeAddress);
        cosmosAccountsWithBalance.add(cosmosAddress);
    } else {
        accountsWithZeroBalance++;
    }
});

// Calculate percentages
const percentWithBalance = ((accountsWithBalance / totalAccounts) * 100).toFixed(2);
const percentWithZero = ((accountsWithZeroBalance / totalAccounts) * 100).toFixed(2);

// Calculate overlap (accounts that have balance in both ecosystems)
const overlapCount = stargazeAccountsWithBalance.size; // Since each row represents a Stargaze account that also has a Cosmos account
const overlapPercent = ((overlapCount / totalAccounts) * 100).toFixed(2);

// Output results
console.log('=== Balance Analysis ===');
console.log(`Total accounts: ${totalAccounts}`);
console.log(`Accounts with balance > 0: ${accountsWithBalance} (${percentWithBalance}%)`);
console.log(`Accounts with balance = 0: ${accountsWithZeroBalance} (${percentWithZero}%)`);
console.log('');
console.log('=== Stargaze-Cosmos Hub Overlap ===');
console.log(`Stargaze accounts with Cosmos Hub balance: ${overlapCount} (${overlapPercent}% of all Stargaze accounts)`);