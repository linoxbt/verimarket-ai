

# VeriMarket – AI-Resolved Prediction Market + AI Arbitration Court

## Overview
A decentralized prediction market platform where markets are resolved by AI using structured, bounded data from approved APIs. Built for GenLayer Asimov testnet with RainbowKit wallet integration, featuring an AI arbitration dispute system.

---

## Phase 1: Foundation & Branding

### App Shell & Theme
- GenLayer-inspired color scheme (dark UI with blue/purple accent tones)
- Custom SVG logo used as favicon and social preview image
- Responsive layout with top navigation bar
- Wallet connection button (RainbowKit) in header
- Dark mode by default

### Navigation Structure
- **Home** (Dashboard) — market listings
- **Create Market** — new prediction market form
- **Docs** — full documentation & contract guides
- Wallet status indicator in header

---

## Phase 2: Wallet & Blockchain Integration

### RainbowKit + GenLayer Asimov Testnet
- Configure RainbowKit with custom GenLayer Asimov chain (chain ID, RPC URL, block explorer)
- Connect/disconnect wallet flow
- Display connected address and balance
- Network switching prompt if on wrong network

---

## Phase 3: Backend API Layer (Supabase Edge Functions)

### API Aggregation Edge Functions
Four edge functions, one per data source:
- **fetch-news** — NewsAPI integration (top 5 results, normalized)
- **fetch-sports** — TheSportsDB integration (scores, match status)
- **fetch-crypto** — CoinGecko integration (price, volume, market cap)
- **fetch-weather** — OpenWeather integration (temperature, rainfall, wind)

Each function will:
- Validate input parameters
- Fetch from the external API using stored secrets
- Normalize response into deterministic JSON format
- Sort data deterministically
- Trim to fixed entry count
- Return structured evidence package with SHA-256 hash

### Data Storage
- Supabase database tables for: markets, resolutions, disputes, arbitrations
- Store evidence hashes, AI outputs, timestamps, and prompt versions

---

## Phase 4: Homepage Dashboard

### Market Listings
- Card grid of all prediction markets
- Each card shows: question, category, status badge, expiry countdown, probability bar
- Status types: Open, Resolving, Disputed, Finalized
- Category filter tabs (All, News, Sports, Crypto, Weather)
- Search functionality
- "Create Market" CTA button

---

## Phase 5: Create Market Page

### Market Creation Form
- Market question (text input with validation)
- Resolution criteria (detailed measurable rules)
- Expiration date picker
- Category selector (News, Sports, Crypto, Weather)
- API source dropdown (contextual based on category)
- Preview of resolution template
- Submit deploys market record to database with chosen parameters

---

## Phase 6: Market Detail Page

### Market View
- Full market question display
- Live expiry countdown timer
- Resolution criteria panel
- Current YES/NO probability display
- Trading interface placeholder (YES/NO position buttons)

### Post-Resolution Display
- Structured evidence viewer (collapsible JSON)
- AI reasoning trace (expandable step-by-step panel)
- Confidence score visualization
- Dataset hash verification display
- Dispute button (enabled during 24-hour dispute window)

---

## Phase 7: AI Resolution Engine

### Resolution Flow (triggered at expiry)
1. Edge function fetches relevant API data based on market category
2. Data normalized into structured JSON evidence package
3. Evidence hash computed and stored
4. AI prompt constructed from template with market criteria + evidence
5. Resolution result stored: outcome (YES/NO), confidence score, reasoning steps, data hash
6. Market status updated to "Resolved"
7. 24-hour dispute window opens

### AI Prompt System
- Structured prompt template enforcing JSON-only output
- Bounded to provided dataset only
- Logged with model identifier, prompt version, timestamp

---

## Phase 8: Dispute & Arbitration Module

### Dispute Flow
- During 24-hour window, users can initiate dispute
- Dispute requires stake/bond (tracked on-chain)
- User submits additional structured JSON evidence
- Evidence hash stored

### Arbitration
- Arbitration re-evaluates using: original dataset, original reasoning, new evidence
- Produces final binding outcome
- Arbitration reasoning stored and displayed
- Overrides original resolution permanently
- Market marked as "Finalized"

---

## Phase 9: Demo Mode & Seeded Data

### Pre-seeded Examples
- **Crypto market**: "Will BTC exceed $100K by [date]?" — resolved with CoinGecko data
- **Sports market**: "Will Team X win the match?" — resolved with TheSportsDB data
- **Disputed case**: A market with active dispute showing the dispute flow
- **Arbitrated case**: A finalized market showing full arbitration trace

### Explanation Panel
- "Why GenLayer?" section explaining intelligent contracts, AI execution on-chain, and validator consensus

---

## Phase 10: Documentation Page

### Comprehensive Docs Page
- **App Overview**: Architecture diagram, data flow explanation
- **How It Works**: Step-by-step market lifecycle
- **Smart Contracts Section** with full source code and deployment guides for:
  - `PredictionMarketContract` — market creation, evidence storage, resolution
  - `ArbitrationContract` — dispute handling, re-evaluation, final ruling
  - `MarketFactory` — contract deployment manager
- **Deployment Guide**: Step-by-step testnet deployment instructions
- **API Integration Guide**: How each data source is used
- **Security & Consensus Rules**: Deterministic execution requirements
- **Environment Setup**: API key acquisition instructions for all four services

---

## Technical Architecture Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Wallet | RainbowKit + wagmi (GenLayer Asimov custom chain) |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL |
| APIs | NewsAPI, TheSportsDB, CoinGecko, OpenWeather |
| Secrets | Supabase Cloud Secrets |
| Contracts | GenLayer Intelligent Contracts (code provided in docs) |

