#!/usr/bin/env node
/**
 * testnet-score — Check your airdrop farming readiness across popular testnets
 *
 * Usage:
 *   npx testnet-score 0xYourAddress
 *   npx testnet-score 0xYourAddress --json
 *   npx testnet-score 0xYourAddress --verbose
 */

const CHAINS = [
  // L1
  { name: 'Ethereum Sepolia', rpc: 'https://ethereum-sepolia-rpc.publicnode.com', explorer: 'https://sepolia.etherscan.io', token: 'ETH', weight: 1.0 },
  // L2s — high airdrop potential
  { name: 'Base Sepolia', rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org', token: 'ETH', weight: 1.5 },
  { name: 'Optimism Sepolia', rpc: 'https://sepolia.optimism.io', explorer: 'https://sepolia-optimism.etherscan.io', token: 'ETH', weight: 1.3 },
  { name: 'Arbitrum Sepolia', rpc: 'https://sepolia-rollup.arbitrum.io/rpc', explorer: 'https://sepolia.arbiscan.io', token: 'ETH', weight: 1.3 },
  { name: 'Scroll Sepolia', rpc: 'https://sepolia-rpc.scroll.io', explorer: 'https://sepolia.scrollscan.com', token: 'ETH', weight: 1.8 },
  { name: 'Linea Sepolia', rpc: 'https://rpc.sepolia.linea.build', explorer: 'https://sepolia.lineascan.build', token: 'ETH', weight: 1.5 },
  { name: 'ZKsync Sepolia', rpc: 'https://sepolia.era.zksync.dev', explorer: 'https://sepolia.explorer.zksync.io', token: 'ETH', weight: 1.5 },
  { name: 'Polygon Amoy', rpc: 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com', token: 'POL', weight: 1.0 },
  // New/hot chains
  { name: 'Monad Testnet', rpc: 'https://testnet-rpc.monad.xyz', explorer: 'https://testnet.monadexplorer.com', token: 'MON', weight: 2.0 },
  { name: 'MegaETH Testnet', rpc: 'https://carrot.megaeth.com/rpc', explorer: 'https://megaeth-testnet-v2.blockscout.com', token: 'ETH', weight: 2.0 },
  { name: 'Berachain Bepolia', rpc: 'https://bepolia.rpc.berachain.com', explorer: 'https://bepolia.beratrail.io', token: 'BERA', weight: 1.8 },
  { name: 'Robinhood Chain', rpc: 'https://rpc.testnet.chain.robinhood.com', explorer: 'https://explorer.testnet.chain.robinhood.com', token: 'ETH', weight: 1.8 },
  { name: 'Tempo Testnet', rpc: 'https://rpc.moderato.tempo.xyz', explorer: 'https://explore.tempo.xyz', token: 'USD', weight: 1.8 },
  { name: 'Unichain Sepolia', rpc: 'https://sepolia.unichain.org', explorer: 'https://sepolia.uniscan.xyz', token: 'ETH', weight: 2.0 },
  { name: 'Soneium Minato', rpc: 'https://rpc.minato.soneium.org', explorer: 'https://soneium-minato.blockscout.com', token: 'ETH', weight: 1.8 },
  { name: 'Ink Sepolia', rpc: 'https://rpc-gel-sepolia.inkonchain.com', explorer: 'https://explorer-sepolia.inkonchain.com', token: 'ETH', weight: 1.8 },
  { name: 'ZetaChain Athens', rpc: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public', explorer: 'https://athens.explorer.zetachain.com', token: 'ZETA', weight: 1.5 },
  { name: 'XRPL EVM', rpc: 'https://rpc.xrplevm.org', explorer: 'https://evm-sidechain.xrpl.org', token: 'XRP', weight: 1.5 },
];

async function rpcCall(url, method, params = [], timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function getCode(rpc, address) {
  try {
    const code = await rpcCall(rpc, 'eth_getCode', [address, 'latest']);
    return code && code !== '0x' && code !== '0x0';
  } catch {
    return false;
  }
}

async function checkChain(chain, address) {
  const result = {
    name: chain.name,
    token: chain.token,
    explorer: chain.explorer,
    weight: chain.weight,
    status: 'error',
    balance: 0,
    txCount: 0,
    hasCode: false,
    score: 0,
  };

  try {
    // Get balance
    const balHex = await rpcCall(chain.rpc, 'eth_getBalance', [address, 'latest']);
    result.balance = parseInt(balHex, 16) / 1e18;

    // Get tx count (nonce)
    const nonceHex = await rpcCall(chain.rpc, 'eth_getTransactionCount', [address, 'latest']);
    result.txCount = parseInt(nonceHex, 16);

    // Check if address has deployed code (is a contract deployer indicator via nonce)
    result.status = 'ok';

    // Score calculation
    let score = 0;

    // Transaction count scoring (most important)
    if (result.txCount >= 100) score += 40;
    else if (result.txCount >= 50) score += 30;
    else if (result.txCount >= 20) score += 20;
    else if (result.txCount >= 5) score += 10;
    else if (result.txCount >= 1) score += 3;

    // Balance scoring (having funds shows commitment)
    if (result.balance > 0.1) score += 15;
    else if (result.balance > 0.01) score += 10;
    else if (result.balance > 0.001) score += 5;
    else if (result.balance > 0) score += 2;

    // Active wallet bonus
    if (result.txCount > 0 && result.balance > 0) score += 5;

    // Apply chain weight (newer/hotter chains worth more)
    result.score = Math.round(score * chain.weight);

  } catch (err) {
    result.error = err.name === 'AbortError' ? 'timeout' : err.message?.slice(0, 40);
  }

  return result;
}

function getGrade(totalScore) {
  if (totalScore >= 500) return { grade: 'S', label: 'LEGENDARY FARMER', color: '\x1b[35m' };
  if (totalScore >= 350) return { grade: 'A+', label: 'ELITE FARMER', color: '\x1b[33m' };
  if (totalScore >= 250) return { grade: 'A', label: 'SERIOUS FARMER', color: '\x1b[32m' };
  if (totalScore >= 150) return { grade: 'B', label: 'ACTIVE FARMER', color: '\x1b[36m' };
  if (totalScore >= 80) return { grade: 'C', label: 'GETTING STARTED', color: '\x1b[34m' };
  if (totalScore >= 30) return { grade: 'D', label: 'TOURIST', color: '\x1b[37m' };
  return { grade: 'F', label: 'NO ACTIVITY', color: '\x1b[90m' };
}

function scoreBar(score, max = 60) {
  const filled = Math.min(Math.round((score / max) * 20), 20);
  return '\x1b[32m' + '█'.repeat(filled) + '\x1b[90m' + '░'.repeat(20 - filled) + '\x1b[0m';
}

function printResults(results, address, verbose) {
  const pad = (s, n) => String(s).padEnd(n);
  const rpad = (s, n) => String(s).padStart(n);

  console.log(`\n\x1b[1mtestnet-score\x1b[0m — Airdrop Farming Readiness\n`);
  console.log(`Wallet: \x1b[36m${address}\x1b[0m\n`);

  // Header
  console.log(`${pad('Chain', 22)} ${rpad('Txs', 6)} ${rpad('Balance', 14)} ${rpad('Score', 6)}  ${'Activity'}`);
  console.log('-'.repeat(78));

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  let totalScore = 0;
  let activeChainsCount = 0;
  let totalTxs = 0;

  for (const r of results) {
    if (r.status === 'error') {
      console.log(`${pad(r.name, 22)} ${pad('\x1b[90m-- unreachable --\x1b[0m', 50)}`);
      continue;
    }

    const txs = r.txCount;
    const bal = r.balance === 0 ? '0' : r.balance < 0.0001 ? '<0.0001' : r.balance.toFixed(4);
    const balStr = bal + (r.balance > 0 ? ' ' + r.token : '');
    const bar = scoreBar(r.score);

    console.log(`${pad(r.name, 22)} ${rpad(txs, 6)} ${rpad(balStr, 14)} ${rpad(r.score, 6)}  ${bar}`);

    totalScore += r.score;
    if (r.txCount > 0) activeChainsCount++;
    totalTxs += r.txCount;
  }

  // Summary
  const { grade, label, color } = getGrade(totalScore);
  console.log('\n' + '='.repeat(78));
  console.log(`\n  Total Score: \x1b[1m${totalScore}\x1b[0m / ${results.length * 60}    Grade: ${color}\x1b[1m${grade}\x1b[0m — ${color}${label}\x1b[0m`);
  console.log(`  Active Chains: ${activeChainsCount}/${results.length}    Total Txs: ${totalTxs}`);

  // Tips
  console.log('\n\x1b[1mTips to improve:\x1b[0m');
  const inactive = results.filter(r => r.txCount === 0 && r.status === 'ok');
  if (inactive.length > 0) {
    const top = inactive.filter(r => r.weight >= 1.5).map(r => r.name).slice(0, 3);
    if (top.length > 0) console.log(`  → Get active on \x1b[33m${top.join(', ')}\x1b[0m (high airdrop potential)`);
  }
  const lowTx = results.filter(r => r.txCount > 0 && r.txCount < 20 && r.status === 'ok');
  if (lowTx.length > 0) {
    console.log(`  → Increase tx count on ${lowTx.map(r => r.name).slice(0, 3).join(', ')} (aim for 20+)`);
  }
  const noBalance = results.filter(r => r.txCount > 0 && r.balance === 0);
  if (noBalance.length > 0) {
    console.log(`  → Refill balance on ${noBalance.map(r => r.name).join(', ')}`);
  }
  if (activeChainsCount < 5) {
    console.log(`  → Diversify: active on ${activeChainsCount} chains, aim for 5+`);
  }
  if (totalTxs < 100) {
    console.log(`  → More transactions: ${totalTxs} total, aim for 100+`);
  }

  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const verbose = args.includes('--verbose');
  const filtered = args.filter(a => !a.startsWith('--'));
  const address = filtered.find(a => /^0x[a-fA-F0-9]{40}$/.test(a));

  if (!address) {
    console.log('\nUsage: testnet-score <wallet-address> [--json] [--verbose]\n');
    console.log('Example: testnet-score 0x410a41682158DF340AF54cB3F706D144ee3a7CA8');
    console.log('\nChecks your farming activity across 11 popular testnets');
    console.log('and gives you an airdrop readiness score.\n');
    process.exit(0);
  }

  if (!jsonMode) {
    process.stdout.write('\x1b[90mChecking ' + CHAINS.length + ' chains...\x1b[0m\r');
  }

  const results = await Promise.all(CHAINS.map(c => checkChain(c, address)));

  if (jsonMode) {
    const totalScore = results.reduce((a, r) => a + r.score, 0);
    const { grade, label } = getGrade(totalScore);
    console.log(JSON.stringify({
      address,
      totalScore,
      maxScore: results.length * 60,
      grade,
      label,
      activeChainsCount: results.filter(r => r.txCount > 0).length,
      totalChains: results.length,
      totalTxs: results.reduce((a, r) => a + r.txCount, 0),
      chains: results,
    }, null, 2));
  } else {
    printResults(results, address, verbose);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
