import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { getBalance } from "@/integrations/genlayer/contract";

const POLL_INTERVAL_MS = 15000;

export function useBalance() {
  const { network, address } = useWallet();
  return useQuery({
    queryKey: ["balance", network, address],
    queryFn: () => getBalance(network, address!),
    enabled: !!address,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
