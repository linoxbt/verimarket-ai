import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Address } from "genlayer-js/types";
import {
  connectWallet as connectWalletRequest,
  getStoredNetwork,
  setStoredNetwork,
  switchToNetwork,
  type NetworkKey,
} from "./client";

interface WalletContextValue {
  address: Address | null;
  network: NetworkKey;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: NetworkKey) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const ADDRESS_STORAGE_KEY = "verimarket:address";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [network, setNetworkState] = useState<NetworkKey>(getStoredNetwork());
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (stored) setAddress(stored as Address);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const connected = await connectWalletRequest();
      setAddress(connected);
      window.localStorage.setItem(ADDRESS_STORAGE_KEY, connected);
      await switchToNetwork(network);
    } finally {
      setConnecting(false);
    }
  }, [network]);

  const disconnect = useCallback(() => {
    setAddress(null);
    window.localStorage.removeItem(ADDRESS_STORAGE_KEY);
  }, []);

  const setNetwork = useCallback(async (next: NetworkKey) => {
    setNetworkState(next);
    setStoredNetwork(next);
    if (address) {
      await switchToNetwork(next);
    }
  }, [address]);

  const value = useMemo<WalletContextValue>(
    () => ({ address, network, connecting, connect, disconnect, setNetwork }),
    [address, network, connecting, connect, disconnect, setNetwork],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
