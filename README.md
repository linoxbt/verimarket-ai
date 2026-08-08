# VeriMarket

**Prediction markets resolved entirely on-chain by a GenLayer Intelligent Contract.**

No off-chain oracle. No centralized backend. No database. Every market, trade, resolution, dispute, and
arbitration lives in contract storage — every read in this app is a live contract call, and every outcome
is decided by real evidence and real multi-validator LLM consensus, not a single trusted API call.

| | |
|---|---|
| **Live networks** | [Studionet](#deployments) · [Testnet Asimov](#deployments) |
| **Contract** | [`contracts/veri_market.py`](contracts/veri_market.py) — GenVM / Python |
| **Frontend** | Vite + React + TypeScript, deployed as a static SPA |
| **Chain access** | [`genlayer-js`](https://github.com/genlayerlabs/genlayer-js), no backend in between |

---

## Table of contents

- [Overview](#overview)
- [How resolution actually works](#how-resolution-actually-works)
- [Contract reference](#contract-reference)
- [Evidence sources](#evidence-sources)
- [Deployments](#deployments)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Deploying](#deploying)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)

## Overview

VeriMarket lets anyone create a YES/NO market on a real-world question — a crypto price, a sports result,
a news event, the weather — and trade a position on the outcome. When the market expires, a
[GenLayer](https://genlayer.com) **Intelligent Contract** resolves it itself: it fetches evidence from a
public API and prompts an LLM for a decision, with every validator on the network independently
re-deriving that same decision before it's accepted. Anyone can dispute a resolution within a 24-hour
window by posting a bond and new evidence, triggering an arbitration pass that weighs both sides for a
final, binding outcome. Winners claim their share of the pool once the market is finalized.

There is nothing running behind the contract — no cron job, no oracle relay, no indexer. The frontend
talks to the deployed contract directly.

## How resolution actually works

This is the part that makes it a real Intelligent Contract rather than a chatbot wired to a smart
contract: the leader's answer is never trusted on its own.

```python
def leader_fn():
    response = gl.nondet.web.get(url)                    # fetch evidence from a public API
    data_hash = hashlib.sha256(response.body).hexdigest()

    result = gl.nondet.exec_prompt(prompt, response_format="json")
    return {"outcome": ..., "confidence": ..., "data_hash": data_hash}

def validator_fn(leaders_res):
    # every validator independently re-fetches the evidence and re-runs the prompt,
    # then compares only the decision fields — not the free-text reasoning
    validator_data = leader_fn()
    return (
        leaders_res.calldata["outcome"] == validator_data["outcome"]
        and abs(leaders_res.calldata["confidence"] - validator_data["confidence"]) <= 15
    )

return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

This is GenLayer's **Equivalence Principle**: consensus is reached on the *decision*, not on identical
free text, which would be impossible to guarantee across independent LLM calls. `arbitrate` runs the exact
same mechanism a second time, with the disputer's evidence and the original reasoning folded into the
prompt, for a final ruling that overrides the initial resolution.

## Contract reference

All state lives in a single `VeriMarket` contract.

| Method | Kind | Description |
|---|---|---|
| `create_market(question, category, source_query, resolution_criteria, expiry)` | write | Opens a new market. `category` is one of `crypto` / `sports` / `news` / `weather`; `source_query` is the evidence lookup key for that category (e.g. a CoinGecko coin id). |
| `place_trade(market_id, position)` | write · payable | Stakes GEN on `"yes"` or `"no"` while the market is open. |
| `resolve_market(market_id)` | write | Callable by anyone once expiry has passed. Runs the leader/validator resolution above and opens the 24h dispute window. |
| `file_dispute(market_id, evidence)` | write · payable | Bonds a dispute with new evidence during the dispute window. |
| `arbitrate(market_id)` | write | Re-resolves a disputed market, weighing the original evidence and reasoning against the disputer's evidence, for a final outcome. |
| `claim_payout(market_id)` | write | Pays out the caller's pro-rata share of the pool if they backed the winning side. |
| `pin_market(market_id, pinned)` / `hide_market(market_id, hidden)` | write · owner-only | Curate the market list. |
| `get_market` / `get_all_markets` / `get_market_trades` / `get_user_trades(address)` | view | Market and trade data. |
| `get_resolution` / `get_dispute` / `get_arbitration` | view | Resolution lifecycle data. |
| `owner_address()` | view | The deploying address — the frontend gates admin actions on `connected wallet == owner`, no separate auth system. |

## Evidence sources

Contract source — and anything a contract holds — is effectively public, since leader *and* validators
execute it. That rules out secret API keys, so every source below is keyless:

| Category | Source | Notes |
|---|---|---|
| Crypto | [CoinGecko](https://www.coingecko.com) | Public price API |
| Sports | [TheSportsDB](https://www.thesportsdb.com) | Public test key |
| News | [GDELT DOC 2.0](https://www.gdeltproject.org) | Free, keyless — used in place of NewsAPI |
| Weather | [Open-Meteo](https://open-meteo.com) | Free, keyless — used in place of OpenWeather |

## Deployments

| Network | Chain ID | Contract address |
|---|---|---|
| Studionet | `61999` | `0x284a0C90CD7A3A7586522C0eEB1B752EbD2Ee797` |
| Testnet Asimov | `4221` | `0x42919CA9E6DEC6d68D41F032000A26fc598faBD2` |

Both are live and reachable from the network switcher in the app. Addresses are public and hardcoded in
[`src/integrations/genlayer/client.ts`](src/integrations/genlayer/client.ts).

## Architecture

```
┌──────────────────────────┐        readContract / writeContract        ┌─────────────────────────┐
│   VeriMarket (frontend)   │ ───────────────────────────────────────▶  │   VeriMarket contract    │
│   Vite + React + wagmi    │ ◀───────────────────────────────────────  │   (GenVM, Python)        │
└──────────────────────────┘              genlayer-js                  └─────────────┬────────────┘
        ▲                                                                             │
        │ connect                                                     gl.nondet.web / gl.nondet.exec_prompt
        │                                                                             ▼
┌──────────────────────────┐                                          ┌─────────────────────────────┐
│  Reown AppKit + wagmi     │                                          │  CoinGecko / TheSportsDB /   │
│  (injected + WalletConnect)│                                         │  GDELT / Open-Meteo + LLM     │
└──────────────────────────┘                                          └─────────────────────────────┘
```

No API layer, no database, no server-rendered pages — the frontend is a static SPA that reads and writes
the contract directly, polling instead of subscribing (there's no chain-side push mechanism for storage
reads).

## Tech stack

- **Contract** — Python (GenVM), tested with `genlayer-test`/`gltest`, linted with `genvm-linter`
- **Frontend** — Vite, React 18, TypeScript, React Router
- **Styling** — Tailwind CSS, hand-built components (no shadcn/Radix/UI kit)
- **Chain access** — [`genlayer-js`](https://github.com/genlayerlabs/genlayer-js) directly; [`@tanstack/react-query`](https://tanstack.com/query) for polling/caching
- **Wallet** — [Reown AppKit](https://reown.com) + [wagmi](https://wagmi.sh) (injected wallets + WalletConnect/mobile)
- **Motion** — framer-motion (scroll reveals, the resolution pipeline diagram)
- **Icons** — lucide-react

## Project structure

```
contracts/
  veri_market.py            the entire on-chain application logic
  deployments/               deployed addresses per network (public; keys are gitignored)
tests/
  direct/                    fast tests, mocked web/LLM, no network
  integration/                real consensus tests against a live network
src/
  integrations/
    genlayer/                 client.ts (network/client setup), contract.ts (typed read/write calls),
                               WalletProvider.tsx (wagmi/AppKit → genlayer-js bridge)
    reown/config.ts            AppKit + wagmi configuration
  hooks/                      useMarkets, useTrades, useResolution, useOwner — React Query wrappers
  pages/                      Dashboard, Markets, MarketDetail, CreateMarket, Portfolio, Admin, Docs
  components/                 hand-built UI primitives + layout (site header, app sidebar, cards, badges)
```

## Getting started

**Prerequisites**: Node.js 18+, npm.

```sh
git clone https://github.com/linoxbt/verimarket-ai.git
cd verimarket-ai
npm install
cp .env.example .env
```

Set `VITE_REOWN_PROJECT_ID` in `.env` — get a free project id at
[cloud.reown.com](https://cloud.reown.com). Without it, the app still runs; the wallet-connect modal will
just show a "Project ID Missing" notice instead of a wallet list.

```sh
npm run dev
```

## Testing

Contract work needs a Python 3.12+ virtualenv:

```sh
python3 -m venv .venv
.venv/bin/pip install genvm-linter genlayer-test genlayer-py pytest

# lint + typecheck the contract
.venv/bin/genvm-lint check contracts/veri_market.py
.venv/bin/genvm-lint typecheck contracts/veri_market.py

# fast direct-mode tests — business logic + validation, mocked web/LLM, ~1s for the whole suite
.venv/bin/python -m pytest tests/direct/ -v

# integration tests — real consensus against a live network (slow; real evidence + LLM calls)
.venv/bin/gltest tests/integration/ -v -s -m slow --network studionet
```

Frontend:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

## Deploying

The app is a static SPA. `netlify.toml` sets the build command, publish directory, and the catch-all
redirect (`/* → /index.html`, 200) that client-side routes need to survive a page refresh. On Netlify, the
only environment variable to set is `VITE_REOWN_PROJECT_ID` — the two contract addresses are public and
already baked into the build, nothing else needs configuring per-deploy.

## Security notes

- **No secrets on-chain.** Evidence sources are all keyless by design (see [above](#evidence-sources)) —
  contract code is visible to every validator, so anything embedded in it is effectively public.
- **No custom auth.** Admin actions are gated purely by `connected wallet address == contract owner()`,
  checked live against the contract — there's no separate login system or session to secure.
- **Consensus, not trust.** Every resolution requires independent agreement from multiple validators
  re-deriving the same decision from the same evidence; a single compromised or hallucinating leader
  cannot unilaterally decide an outcome.

## Known limitations

- **Polling, not push.** There's no chain-side subscription mechanism for contract storage, so "live"
  data (market list, trade feed) is short-interval polling via React Query rather than a realtime feed.
- **Testnet Asimov is not gasless.** Unlike Studionet, transactions there cost real (testnet) GEN — fund
  an account via the [testnet faucet](https://testnet-faucet.genlayer.foundation) before writing to it.
- **Bundle size.** Reown AppKit pulls in a fairly large dependency tree (swap/onramp/send UI chunks are
  disabled at runtime but still bundled). Acceptable for now; a candidate for `dynamic import()`-based
  code-splitting later if load time becomes a concern.
