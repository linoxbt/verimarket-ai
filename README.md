# VeriMarket

Prediction markets resolved entirely on-chain by a [GenLayer](https://genlayer.com) Intelligent
Contract — no off-chain oracle, no centralized backend, no database. Every market, trade, resolution,
dispute and arbitration lives in contract storage, and every read in the app is a live contract call.

## How it works

At expiry, the contract fetches live evidence from a public API and asks an LLM to decide the outcome —
but the leader's answer isn't trusted on its own. Every validator independently re-fetches the same
evidence and re-runs the same prompt, and the network only accepts the outcome if the leader and
validators agree on the decision fields (GenLayer's **Equivalence Principle**). Disputes and arbitration
reuse the exact same mechanism, weighing new evidence against the original for a final binding outcome.

Evidence sources are all keyless, since contract source is effectively public to leader and validators
alike:

| Category | Source |
|---|---|
| Crypto | [CoinGecko](https://www.coingecko.com) |
| Sports | [TheSportsDB](https://www.thesportsdb.com) |
| News | [GDELT DOC 2.0](https://www.gdeltproject.org) |
| Weather | [Open-Meteo](https://open-meteo.com) |

See `/docs` in the running app for the full contract interface and resolution walkthrough.

## Deployments

| Network | Contract address |
|---|---|
| Studionet | `0x284a0C90CD7A3A7586522C0eEB1B752EbD2Ee797` |
| Testnet Asimov | `0x42919CA9E6DEC6d68D41F032000A26fc598faBD2` |

## Tech stack

- **Contract**: Python (GenVM) — [`contracts/veri_market.py`](contracts/veri_market.py)
- **Frontend**: Vite, React, TypeScript, Tailwind CSS (hand-built components, no UI kit)
- **Chain access**: [`genlayer-js`](https://github.com/genlayerlabs/genlayer-js) — direct `readContract`/
  `writeContract` calls, polled via React Query (no backend in between)
- **Wallet**: [Reown AppKit](https://reown.com) + wagmi (injected and WalletConnect/mobile wallets)
- **Motion**: framer-motion

## Local development

### Frontend

```sh
npm install
cp .env.example .env   # set VITE_REOWN_PROJECT_ID — get one at https://cloud.reown.com
npm run dev
```

### Contract

Requires a Python 3.12+ virtualenv:

```sh
python3 -m venv .venv
.venv/bin/pip install genvm-linter genlayer-test genlayer-py pytest

# lint + typecheck the contract
.venv/bin/genvm-lint check contracts/veri_market.py
.venv/bin/genvm-lint typecheck contracts/veri_market.py

# fast direct-mode tests (mocked web/LLM, no network)
.venv/bin/python -m pytest tests/direct/ -v

# integration tests against a live network
.venv/bin/gltest tests/integration/ -v -s -m slow --network studionet
```

## Deploying

The app is a static SPA — `netlify.toml` includes the catch-all redirect (`/* → /index.html`, 200) needed
for client-side routes to survive a page refresh. On Netlify, set `VITE_REOWN_PROJECT_ID` as an
environment variable; the two contract addresses above are public and already baked into the build.
