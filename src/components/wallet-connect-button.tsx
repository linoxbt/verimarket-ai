import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { Button } from "@/components/ui/button";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, connecting, connect, disconnect } = useWallet();

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
    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={connecting} onClick={connect}>
      {connecting ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
