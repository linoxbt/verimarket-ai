import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Copy, ExternalLink, Github, LogOut, MessageCircleQuestion, Moon, Sun, Wallet } from "lucide-react";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { useBalance } from "@/hooks/useBalance";
import { useTheme } from "@/components/theme-provider";
import { NETWORKS, type NetworkKey } from "@/integrations/genlayer/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGen, truncateAddress } from "@/lib/format";
import { explorerAddressUrl } from "@/lib/explorer";

const GITHUB_URL = "https://github.com/linoxbt/verimarket-ai";

export default function Profile() {
  const { address, network, setNetwork, disconnect, connect, connecting } = useWallet();
  const { data: balance } = useBalance();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Wallet size={32} className="mx-auto mb-4 text-muted" />
        <h1 className="font-display text-xl font-bold text-ink">Connect your wallet</h1>
        <p className="mt-2 text-sm text-muted">Connect a wallet to view your profile.</p>
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="mt-6 rounded-sm bg-accent px-5 py-2.5 font-mono text-sm text-bg hover:opacity-90"
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">profile</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Account</h1>

      <Card className="mt-6">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Wallet address</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-sm text-ink">{truncateAddress(address)}</span>
          <button
            type="button"
            onClick={copyAddress}
            aria-label="Copy address"
            className="text-muted hover:text-accent"
          >
            {copied ? <Check size={14} className="text-pass" /> : <Copy size={14} />}
          </button>
          <a
            href={explorerAddressUrl(network, address)}
            target="_blank"
            rel="noreferrer"
            aria-label="View on explorer"
            className="text-muted hover:text-accent"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Balance</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {balance !== undefined ? formatGen(balance) : "—"}
          </p>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Network</p>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as NetworkKey)}
            className="mt-2 w-full rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink hover:border-accent focus:border-accent focus:outline-none"
          >
            {(Object.keys(NETWORKS) as NetworkKey[]).map((key) => (
              <option key={key} value={key}>
                {NETWORKS[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Appearance</p>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-2 flex w-full items-center justify-between rounded-sm border border-line px-3 py-2 font-mono text-sm text-ink hover:border-accent"
          >
            <span>{theme === "dark" ? "Dark" : "Light"} mode</span>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <Button variant="ghost" className="mt-4 w-full justify-center" onClick={disconnect}>
          <LogOut size={14} /> Disconnect
        </Button>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link to="/portfolio">
          <Card className="transition-colors hover:border-accent">
            <p className="font-mono text-sm text-ink">My trades &amp; markets</p>
            <p className="mt-1 font-mono text-xs text-muted">View your positions and created markets</p>
          </Card>
        </Link>
        <Link to="/create">
          <Card className="transition-colors hover:border-accent">
            <p className="font-mono text-sm text-ink">Create a market</p>
            <p className="mt-1 font-mono text-xs text-muted">Start a new AI-resolved market</p>
          </Card>
        </Link>
      </div>

      <Card className="mt-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Help &amp; support</p>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-sm text-ink hover:text-accent"
          >
            <Github size={15} /> Source on GitHub
          </a>
          <Link to="/docs" className="flex items-center gap-2 font-mono text-sm text-ink hover:text-accent">
            <BookOpen size={15} /> Documentation
          </Link>
          <a
            href={`${GITHUB_URL}/issues/new`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-sm text-ink hover:text-accent"
          >
            <MessageCircleQuestion size={15} /> Report an issue / give feedback
          </a>
        </div>
      </Card>
    </div>
  );
}
