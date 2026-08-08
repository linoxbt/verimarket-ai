import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { NETWORKS, type NetworkKey } from "@/integrations/genlayer/client";

export function NetworkSwitcher() {
  const { network, setNetwork } = useWallet();

  return (
    <select
      value={network}
      onChange={(e) => setNetwork(e.target.value as NetworkKey)}
      className="rounded-sm border border-line bg-surface px-2 py-1.5 font-mono text-xs text-ink hover:border-accent focus:border-accent focus:outline-none"
    >
      {(Object.keys(NETWORKS) as NetworkKey[]).map((key) => (
        <option key={key} value={key}>
          {NETWORKS[key].label}
        </option>
      ))}
    </select>
  );
}
