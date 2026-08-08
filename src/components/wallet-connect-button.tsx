import { useState } from "react";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { Button } from "@/components/ui/button";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, connecting, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  if (address) {
    return (
      <button
        type="button"
        onClick={disconnect}
        className="rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-ink hover:border-accent hover:text-accent"
        title="Disconnect"
      >
        {truncate(address)}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        disabled={connecting}
        onClick={async () => {
          setError(null);
          try {
            await connect();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect wallet");
          }
        }}
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
      {error && <span className="font-mono text-[10px] text-fail">{error}</span>}
    </div>
  );
}
