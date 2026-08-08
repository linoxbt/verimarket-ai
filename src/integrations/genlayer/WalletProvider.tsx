import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import type { Address } from "genlayer-js/types";
import "@/integrations/reown/config";
import {
  getStoredNetwork,
  setActiveProvider,
  setStoredNetwork,
  NETWORKS,
  NETWORK_BY_CHAIN_ID,
  type NetworkKey,
} from "./client";

interface WalletContextValue {
  address: Address | null;
  network: NetworkKey;
  connecting: boolean;
  connect: () => Promise<void>;
  openAccount: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: NetworkKey) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { open } = useAppKit();
  const { address, chainId, connector, isConnecting } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const [network, setNetworkState] = useState<NetworkKey>(getStoredNetwork());

  // Keep our own network selection in sync with whatever chain the wallet is actually on.
  useEffect(() => {
    if (chainId && NETWORK_BY_CHAIN_ID[chainId]) {
      setNetworkState(NETWORK_BY_CHAIN_ID[chainId]);
      setStoredNetwork(NETWORK_BY_CHAIN_ID[chainId]);
    }
  }, [chainId]);

  // Feed whatever provider the active connector (injected or WalletConnect) exposes to
  // genlayer-js, so it can sign through it regardless of connector type.
  useEffect(() => {
    let cancelled = false;
    if (connector) {
      connector.getProvider().then((provider) => {
        if (!cancelled) setActiveProvider(provider);
      });
    } else {
      setActiveProvider(null);
    }
    return () => {
      cancelled = true;
    };
  }, [connector]);

  const connect = useCallback(async () => {
    await open();
  }, [open]);

  const openAccount = useCallback(async () => {
    await open({ view: "Account" });
  }, [open]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const setNetwork = useCallback(
    async (next: NetworkKey) => {
      setNetworkState(next);
      setStoredNetwork(next);
      if (address) {
        await switchChainAsync({ chainId: NETWORKS[next].chain.id });
      }
    },
    [address, switchChainAsync],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address: (address as Address) ?? null,
      network,
      connecting: isConnecting,
      connect,
      openAccount,
      disconnect,
      setNetwork,
    }),
    [address, network, isConnecting, connect, openAccount, disconnect, setNetwork],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
