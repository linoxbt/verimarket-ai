import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";

export function useIsOwner() {
  const { network, address } = useWallet();
  const ownerQuery = useQuery({
    queryKey: ["owner", network],
    queryFn: () => veriMarket.getOwner(network),
    staleTime: 5 * 60 * 1000,
  });

  const isOwner = !!address && !!ownerQuery.data && address.toLowerCase() === ownerQuery.data.toLowerCase();
  return { isOwner, owner: ownerQuery.data, isLoading: ownerQuery.isLoading };
}
