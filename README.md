# testnet-score

Check your airdrop farming readiness across popular testnets. Zero dependencies. Node 18+.

## Usage

```bash
# Check your farming score
npx testnet-score 0xYourAddress

# JSON output for scripting
npx testnet-score 0xYourAddress --json
```

## Example Output

```
testnet-score — Airdrop Farming Readiness

Wallet: 0x410a...7CA8

Chain                     Txs        Balance  Score  Activity
------------------------------------------------------------------------------
Scroll Sepolia             53     0.0098 ETH     72  ████████████████████
Base Sepolia               68     0.0099 ETH     60  ████████████████████
Linea Sepolia              51     0.0097 ETH     60  ████████████████████
Optimism Sepolia           86     0.0097 ETH     52  █████████████████░░░
Arbitrum Sepolia           72     0.0097 ETH     52  █████████████████░░░
Ethereum Sepolia           96     0.9421 ETH     50  █████████████████░░░
Monad Testnet               0              0      0  ░░░░░░░░░░░░░░░░░░░░

==============================================================================

  Total Score: 346 / 660    Grade: A — SERIOUS FARMER
  Active Chains: 6/11    Total Txs: 426

Tips to improve:
  → Get active on Monad Testnet, MegaETH Testnet (high airdrop potential)
```

## Scoring

Each chain is scored on:
- **Transaction count** (0-40 pts): 1+ tx = 3, 5+ = 10, 20+ = 20, 50+ = 30, 100+ = 40
- **Balance** (0-15 pts): having funds shows commitment
- **Active wallet bonus** (5 pts): txs + balance together
- **Chain weight**: newer/hotter chains (Monad 2x, Scroll 1.8x, etc.) score higher

### Grades

| Score | Grade | Label |
|-------|-------|-------|
| 500+ | S | Legendary Farmer |
| 350+ | A+ | Elite Farmer |
| 250+ | A | Serious Farmer |
| 150+ | B | Active Farmer |
| 80+ | C | Getting Started |
| 30+ | D | Tourist |
| <30 | F | No Activity |

## Supported Chains (11)

Ethereum Sepolia, Base Sepolia, Optimism Sepolia, Arbitrum Sepolia, Scroll Sepolia, Linea Sepolia, ZKsync Sepolia, Polygon Amoy, Monad Testnet, MegaETH Testnet, Berachain Bepolia

## Features

- Zero dependencies — uses native `fetch` (Node 18+)
- All chains checked in parallel
- Weighted scoring (hot chains = more points)
- Actionable improvement tips
- JSON output for scripting/bots

## License

MIT
