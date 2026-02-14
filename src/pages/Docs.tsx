import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookOpen, Code, Rocket, Shield, Zap, Globe } from 'lucide-react';

const predictionMarketContract = `# PredictionMarketContract (GenLayer Intelligent Contract)

from genlayer.py.calldata import *
from genlayer.py.types import *

class PredictionMarketContract:
    """
    Manages prediction market lifecycle:
    - Market creation with resolution criteria
    - Evidence storage with SHA-256 hashing
    - AI-powered resolution using bounded datasets
    """

    def __init__(self):
        self.markets = {}
        self.resolutions = {}
        self.evidence_store = {}

    def create_market(
        self,
        market_id: str,
        question: str,
        resolution_criteria: str,
        category: str,
        api_source: str,
        expiry_timestamp: int,
    ):
        """Deploy a new prediction market."""
        self.markets[market_id] = {
            "question": question,
            "resolution_criteria": resolution_criteria,
            "category": category,
            "api_source": api_source,
            "expiry": expiry_timestamp,
            "status": "open",
            "yes_probability": 0.5,
        }

    def submit_evidence(self, market_id: str, evidence_json: str, evidence_hash: str):
        """Store normalized evidence package."""
        self.evidence_store[market_id] = {
            "data": evidence_json,
            "hash": evidence_hash,
        }

    def resolve_market(self, market_id: str, ai_output: dict):
        """
        AI execution function.
        Receives structured evidence + prompt.
        Returns deterministic JSON resolution.
        """
        self.resolutions[market_id] = {
            "outcome": ai_output["outcome"],
            "confidence": ai_output["confidence"],
            "reasoning_steps": ai_output["reasoning_steps"],
            "data_hash": ai_output["evaluated_data_hash"],
        }
        self.markets[market_id]["status"] = "resolved"`;

const arbitrationContract = `# ArbitrationContract (GenLayer Intelligent Contract)

from genlayer.py.calldata import *
from genlayer.py.types import *

class ArbitrationContract:
    """
    Handles dispute resolution and final arbitration.
    - Accepts original reasoning + new evidence
    - Re-evaluates using bounded AI execution
    - Produces final binding outcome
    """

    def __init__(self):
        self.disputes = {}
        self.arbitrations = {}

    def file_dispute(
        self,
        dispute_id: str,
        market_id: str,
        disputer_address: str,
        additional_evidence: str,
        evidence_hash: str,
        bond_amount: int,
    ):
        """File a dispute with bond requirement."""
        self.disputes[dispute_id] = {
            "market_id": market_id,
            "disputer": disputer_address,
            "evidence": additional_evidence,
            "evidence_hash": evidence_hash,
            "bond": bond_amount,
            "status": "pending",
        }

    def arbitrate(self, dispute_id: str, ai_output: dict):
        """
        Re-evaluate using:
        - Original dataset
        - Original reasoning
        - New evidence
        Produce final binding outcome.
        """
        self.arbitrations[dispute_id] = {
            "outcome": ai_output["outcome"],
            "confidence": ai_output["confidence"],
            "reasoning_steps": ai_output["reasoning_steps"],
            "data_hash": ai_output["evaluated_data_hash"],
            "status": "finalized",
        }`;

const marketFactoryContract = `# MarketFactory (GenLayer Intelligent Contract)

from genlayer.py.calldata import *

class MarketFactory:
    """
    Factory contract for deploying prediction markets.
    Manages contract registry and deployment.
    """

    def __init__(self):
        self.deployed_markets = {}
        self.market_count = 0

    def deploy_market(self, creator: str, question: str, category: str):
        """Deploy a new PredictionMarketContract instance."""
        self.market_count += 1
        market_id = f"market_{self.market_count}"
        self.deployed_markets[market_id] = {
            "creator": creator,
            "question": question,
            "category": category,
            "contract_address": f"0x{market_id}",
        }
        return market_id

    def get_market(self, market_id: str):
        return self.deployed_markets.get(market_id)

    def list_markets(self):
        return list(self.deployed_markets.keys())`;

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <Collapsible>
    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-secondary px-4 py-3 text-left hover:bg-secondary/80 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 pt-4 pb-2">
      {children}
    </CollapsibleContent>
  </Collapsible>
);

const Docs = () => {
  return (
    <main className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-2">Documentation</h1>
      <p className="text-muted-foreground mb-8">
        Complete guide to VeriMarket's architecture, smart contracts, and deployment.
      </p>

      <div className="space-y-4">
        <Section icon={<BookOpen className="h-5 w-5 text-primary" />} title="App Overview">
          <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-3">
            <p>
              VeriMarket is a decentralized prediction market platform where markets are resolved by AI using structured,
              bounded data from predefined public APIs. Built for GenLayer Asimov testnet.
            </p>
            <h4 className="text-foreground font-semibold">Architecture</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Frontend:</strong> React + Vite + TypeScript + TailwindCSS</li>
              <li><strong>Wallet:</strong> RainbowKit + wagmi (GenLayer Asimov custom chain)</li>
              <li><strong>Backend:</strong> Lovable Cloud Edge Functions (Deno)</li>
              <li><strong>Database:</strong> PostgreSQL via Lovable Cloud</li>
              <li><strong>APIs:</strong> NewsAPI, TheSportsDB, CoinGecko, OpenWeather</li>
              <li><strong>Contracts:</strong> GenLayer Intelligent Contracts</li>
            </ul>
            <h4 className="text-foreground font-semibold">Data Flow</h4>
            <p>Frontend → Edge Function → External API → Normalize → Hash → AI Contract → Resolution</p>
          </div>
        </Section>

        <Section icon={<Zap className="h-5 w-5 text-primary" />} title="How It Works — Market Lifecycle">
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
            <li>User creates a market with a question, resolution criteria, category, API source, and expiry date.</li>
            <li>Market is deployed and listed on the dashboard with "Open" status.</li>
            <li>At expiry, an edge function fetches data from the selected API.</li>
            <li>Data is normalized into a deterministic JSON evidence package and hashed (SHA-256).</li>
            <li>The evidence + prompt are passed to the GenLayer intelligent contract.</li>
            <li>AI execution resolves the market, producing outcome, confidence, and reasoning.</li>
            <li>A 24-hour dispute window opens. Users can file disputes with bonded stakes.</li>
            <li>If disputed, an arbitration contract re-evaluates with original + new evidence.</li>
            <li>Arbitration produces a final binding outcome. Market is marked "Finalized".</li>
          </ol>
        </Section>

        <Section icon={<Code className="h-5 w-5 text-primary" />} title="Smart Contracts">
          <Tabs defaultValue="prediction" className="w-full">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="prediction" className="text-xs">PredictionMarket</TabsTrigger>
              <TabsTrigger value="arbitration" className="text-xs">Arbitration</TabsTrigger>
              <TabsTrigger value="factory" className="text-xs">MarketFactory</TabsTrigger>
            </TabsList>
            <TabsContent value="prediction">
              <Card className="border-border bg-background">
                <CardHeader><CardTitle className="text-sm">PredictionMarketContract</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-x-auto p-4 bg-secondary rounded-md"><code>{predictionMarketContract}</code></pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="arbitration">
              <Card className="border-border bg-background">
                <CardHeader><CardTitle className="text-sm">ArbitrationContract</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-x-auto p-4 bg-secondary rounded-md"><code>{arbitrationContract}</code></pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="factory">
              <Card className="border-border bg-background">
                <CardHeader><CardTitle className="text-sm">MarketFactory</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-x-auto p-4 bg-secondary rounded-md"><code>{marketFactoryContract}</code></pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        <Section icon={<Rocket className="h-5 w-5 text-primary" />} title="Deployment Guide">
          <div className="text-sm text-muted-foreground space-y-3">
            <h4 className="text-foreground font-semibold">Step 1: Set Up GenLayer CLI</h4>
            <pre className="text-xs p-3 bg-secondary rounded-md overflow-x-auto"><code>{`pip install genlayer
genlayer init
genlayer up`}</code></pre>

            <h4 className="text-foreground font-semibold">Step 2: Configure Testnet Asimov</h4>
            <pre className="text-xs p-3 bg-secondary rounded-md overflow-x-auto"><code>{`genlayer config set network testnet_asimov
# Get testnet tokens from faucet:
curl -X POST https://genlayer-faucet.vercel.app/api/faucet \\
  -H 'Content-Type: application/json' \\
  -d '{"address": "0xYourAddress", "network": "Genlayer Testnet", "token": "GEN", "turnstileToken": ""}'`}</code></pre>

            <h4 className="text-foreground font-semibold">Step 3: Deploy Contracts</h4>
            <pre className="text-xs p-3 bg-secondary rounded-md overflow-x-auto"><code>{`# Deploy MarketFactory first
genlayer deploy MarketFactory.py --network testnet_asimov

# Deploy PredictionMarketContract
genlayer deploy PredictionMarketContract.py --network testnet_asimov

# Deploy ArbitrationContract
genlayer deploy ArbitrationContract.py --network testnet_asimov`}</code></pre>

            <h4 className="text-foreground font-semibold">Step 4: Verify Deployment</h4>
            <p>Check the GenLayer Explorer at <code className="text-primary">https://genlayer-testnet.explorer.caldera.xyz</code></p>
          </div>
        </Section>

        <Section icon={<Globe className="h-5 w-5 text-primary" />} title="API Integration Guide">
          <div className="text-sm text-muted-foreground space-y-4">
            {[
              { name: 'NewsAPI', url: 'https://newsapi.org', key: 'NEWS_API_KEY', desc: 'Sign up → Get API Key → Store in Cloud Secrets' },
              { name: 'TheSportsDB', url: 'https://www.thesportsdb.com', key: 'SPORTS_API_KEY', desc: 'Sign up → Request free key → Store in Cloud Secrets' },
              { name: 'CoinGecko', url: 'https://www.coingecko.com', key: 'COINGECKO_API_KEY', desc: 'Free tier (no key needed for basic endpoints). Optional key for higher rate limits.' },
              { name: 'OpenWeather', url: 'https://openweathermap.org', key: 'OPENWEATHER_API_KEY', desc: 'Sign up → Generate key (10-30 min activation) → Store in Cloud Secrets' },
            ].map((api) => (
              <div key={api.name}>
                <h4 className="text-foreground font-semibold">{api.name}</h4>
                <p>URL: <a href={api.url} className="text-primary underline" target="_blank" rel="noopener">{api.url}</a></p>
                <p>Secret name: <code className="text-primary">{api.key}</code></p>
                <p>{api.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<Shield className="h-5 w-5 text-primary" />} title="Security & Consensus Rules">
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Prevent double resolution</li>
            <li>Lock evidence after expiry</li>
            <li>Require dispute bond</li>
            <li>Log model identifier, dataset hash, and prompt version</li>
            <li>Ensure deterministic dataset ordering</li>
            <li>Ensure JSON-only AI outputs</li>
            <li>Validators must converge on: same prompt, same dataset, same model configuration</li>
            <li>All API responses are normalized, sorted, trimmed, and hashed before AI execution</li>
          </ul>
        </Section>
      </div>
    </main>
  );
};

export default Docs;
