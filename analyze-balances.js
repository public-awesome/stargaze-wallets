const fs = require('fs');

// Read and parse the CSV file
const csvData = fs.readFileSync('hub.csv', 'utf8');
const lines = csvData.trim().split('\n');
const header = lines[0];
const dataLines = lines.slice(1);

let totalAccounts = 0;
let accountsWithBalance = 0;
let accountsWithZeroBalance = 0;
let accountsStaking = 0;
let accountsWithBalanceOrStaking = 0;
let stargazeAccountsWithBalance = new Set();
let cosmosAccountsWithBalance = new Set();
let stargazeAccountsStaking = new Set();
let stargazeAccountsWithBalanceOrStaking = new Set();

// Process each line
dataLines.forEach(line => {
    const [stargazeAddress, cosmosAddress, balance, isStaking] = line.split(',');
    const balanceNum = parseFloat(balance);
    
    totalAccounts++;
    
    if (balanceNum > 0) {
        accountsWithBalance++;
        stargazeAccountsWithBalance.add(stargazeAddress);
        cosmosAccountsWithBalance.add(cosmosAddress);
        stargazeAccountsWithBalanceOrStaking.add(stargazeAddress);
    } else {
        accountsWithZeroBalance++;
    }
    
    if (isStaking === 'Yes') {
        accountsStaking++;
        stargazeAccountsStaking.add(stargazeAddress);
        stargazeAccountsWithBalanceOrStaking.add(stargazeAddress);
    }
});

// Count accounts with either balance OR staking (or both)
accountsWithBalanceOrStaking = stargazeAccountsWithBalanceOrStaking.size;

// Calculate percentages
const percentWithBalance = ((accountsWithBalance / totalAccounts) * 100).toFixed(2);
const percentWithZero = ((accountsWithZeroBalance / totalAccounts) * 100).toFixed(2);
const percentStaking = ((accountsStaking / totalAccounts) * 100).toFixed(2);
const percentWithBalanceOrStaking = ((accountsWithBalanceOrStaking / totalAccounts) * 100).toFixed(2);

// Calculate accounts with NO Hub activity (no balance AND no staking)
const accountsWithNoHubActivity = totalAccounts - accountsWithBalanceOrStaking;
const percentWithNoHubActivity = ((accountsWithNoHubActivity / totalAccounts) * 100).toFixed(2);

// Calculate overlap (accounts that have balance in both ecosystems)
const overlapCount = stargazeAccountsWithBalance.size;
const overlapPercent = ((overlapCount / totalAccounts) * 100).toFixed(2);

// Calculate staking percentage among accounts with balance
const stakingAmongHubAccounts = accountsWithBalance > 0 ? ((accountsStaking / accountsWithBalance) * 100).toFixed(2) : '0.00';

// Output results with emphasis on Stargaze accounts not on Hub
console.log('=== STARGAZE ACCOUNTS NOT REPRESENTED ON COSMOS HUB ===');
console.log(`🚨 SIGNIFICANT FINDING: ${accountsWithNoHubActivity} Stargaze accounts (${percentWithNoHubActivity}%) have NO Cosmos Hub activity`);
console.log(`   - These accounts have neither balance nor staking on Cosmos Hub`);
console.log(`   - This represents a considerable portion of the Stargaze ecosystem`);
console.log('');

console.log('=== Balance Analysis ===');
console.log(`Total Stargaze accounts analyzed: ${totalAccounts.toLocaleString()}`);
console.log(`Accounts with Hub balance > 0: ${accountsWithBalance.toLocaleString()} (${percentWithBalance}%)`);
console.log(`Accounts with Hub balance = 0: ${accountsWithZeroBalance.toLocaleString()} (${percentWithZero}%)`);
console.log(`Accounts staking ATOM: ${accountsStaking.toLocaleString()} (${percentStaking}%)`);
console.log(`Accounts with balance OR staking: ${accountsWithBalanceOrStaking.toLocaleString()} (${percentWithBalanceOrStaking}%)`);
console.log('');

console.log('=== Hub Activity Breakdown ===');
console.log(`✅ Stargaze accounts WITH Hub activity: ${accountsWithBalanceOrStaking.toLocaleString()} (${percentWithBalanceOrStaking}%)`);
console.log(`❌ Stargaze accounts WITHOUT Hub activity: ${accountsWithNoHubActivity.toLocaleString()} (${percentWithNoHubActivity}%)`);
console.log('');

console.log('=== Detailed Hub Engagement ===');
console.log(`Stargaze accounts with Cosmos Hub balance: ${overlapCount.toLocaleString()} (${overlapPercent}%)`);
console.log(`Stargaze accounts staking ATOM: ${stargazeAccountsStaking.size.toLocaleString()} (${((stargazeAccountsStaking.size / totalAccounts) * 100).toFixed(2)}%)`);
console.log(`Of Stargaze accounts with Hub balance, ${stakingAmongHubAccounts}% are also staking ATOM`);
console.log('');

console.log('=== KEY INSIGHTS ===');
console.log(`📊 Stargaze has a considerable user base (${accountsWithNoHubActivity.toLocaleString()} accounts, ${percentWithNoHubActivity}%) that exists independently of Cosmos Hub`);
console.log(`🌟 This demonstrates Stargaze's strong standalone ecosystem and user adoption`);
if (parseFloat(percentWithNoHubActivity) > 50) {
    console.log(`🎯 MAJORITY of Stargaze accounts are NOT represented on Cosmos Hub`);
}