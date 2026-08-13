import { useEffect, useRef } from "react";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { useMarkets } from "@/hooks/useMarkets";
import { useUserTrades } from "@/hooks/useTrades";
import { useToast } from "@/components/toast";
import type { Market, MarketStatus } from "@/integrations/genlayer/types";

const STATUS_MESSAGE: Partial<Record<MarketStatus, { title: string; description: string }>> = {
  resolving: { title: "Market resolved", description: "The AI leader/validator consensus reached an outcome." },
  disputed: { title: "Market disputed", description: "A dispute was filed — arbitration is pending." },
  finalized: { title: "Market finalized", description: "The outcome is final — you can claim your payout if you won." },
};

function seenKey(network: string) {
  return `verimarket:seenStatus:${network}`;
}

function loadSeen(network: string): Record<number, MarketStatus> {
  try {
    return JSON.parse(localStorage.getItem(seenKey(network)) ?? "{}");
  } catch {
    return {};
  }
}

function saveSeen(network: string, seen: Record<number, MarketStatus>) {
  localStorage.setItem(seenKey(network), JSON.stringify(seen));
}

// Polls already-fetched market/trade data (no extra contract calls) and toasts once when a
// market the connected wallet created or traded in changes status — the closest thing to a
// "your market resolved" notification this on-chain-only app can offer without a push backend.
export function MarketWatcher() {
  const { address, network } = useWallet();
  const toast = useToast();
  const { data: markets = [] } = useMarkets();
  const { data: trades = [] } = useUserTrades(address ?? undefined);
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = false;
  }, [network, address]);

  useEffect(() => {
    if (!address || markets.length === 0) return;

    const tradedIds = new Set(trades.map((t) => t.market_id));
    const relevant = markets.filter((m) => m.creator.toLowerCase() === address.toLowerCase() || tradedIds.has(m.id));
    if (relevant.length === 0) return;

    const seen = loadSeen(network);

    if (!initialized.current) {
      // First load after connecting/switching network: snapshot silently, don't toast history.
      relevant.forEach((m) => {
        seen[m.id] = m.status;
      });
      saveSeen(network, seen);
      initialized.current = true;
      return;
    }

    let changed = false;
    relevant.forEach((m: Market) => {
      const previous = seen[m.id];
      if (previous && previous !== m.status) {
        const message = STATUS_MESSAGE[m.status];
        if (message) {
          toast({
            title: message.title,
            description: `${m.question.slice(0, 60)}${m.question.length > 60 ? "…" : ""} — ${message.description}`,
            tone: "info",
            action: { label: "View market", href: `/market/${m.id}` },
          });
        }
      }
      if (previous !== m.status) {
        seen[m.id] = m.status;
        changed = true;
      }
    });
    if (changed) saveSeen(network, seen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, trades, address, network]);

  return null;
}
