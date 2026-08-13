import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { useBalance } from "@/hooks/useBalance";
import { formatGen } from "@/lib/format";
import { Button } from "@/components/ui/button";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, connecting, connect, openAccount } = useWallet();
  const { data: balance } = useBalance();

  if (address) {
    return (
      <button
        type="button"
        onClick={openAccount}
        className="flex items-center gap-2 rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-ink hover:border-accent hover:text-accent"
        title="Account"
      >
        {balance !== undefined && <span className="text-muted">{formatGen(balance, 2)}</span>}
        <span>{truncate(address)}</span>
      </button>
    );
  }

  return (
    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={connecting} onClick={connect}>
      {connecting ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
