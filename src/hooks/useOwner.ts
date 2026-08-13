import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";

export function useIsOwner() {
  const { network, address } = useWallet();
  const adminsQuery = useQuery({
    queryKey: ["admins", network],
    queryFn: () => veriMarket.getAdmins(network),
    staleTime: 5 * 60 * 1000,
  });

  const admins = adminsQuery.data ?? [];
  const isOwner = !!address && admins.some((a) => a.toLowerCase() === address.toLowerCase());
  return { isOwner, admins, isLoading: adminsQuery.isLoading };
}
