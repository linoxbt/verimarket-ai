import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { defineChain, type AppKitNetwork } from "@reown/appkit/networks";
import { createConfig, http, type Config } from "wagmi";
import { studionet as glStudionet, testnetAsimov as glTestnetAsimov } from "genlayer-js/chains";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;

if (!projectId) {
  console.warn(
    "VITE_REOWN_PROJECT_ID is not set — wallet connect will not work. Get a project id at https://cloud.reown.com",
  );
}

const studionet = defineChain({
  id: glStudionet.id,
  caipNetworkId: `eip155:${glStudionet.id}`,
  chainNamespace: "eip155",
  name: glStudionet.name,
  nativeCurrency: glStudionet.nativeCurrency,
  rpcUrls: glStudionet.rpcUrls,
  blockExplorers: glStudionet.blockExplorers,
});

const testnetAsimov = defineChain({
  id: glTestnetAsimov.id,
  caipNetworkId: `eip155:${glTestnetAsimov.id}`,
  chainNamespace: "eip155",
  name: glTestnetAsimov.name,
  nativeCurrency: glTestnetAsimov.nativeCurrency,
  rpcUrls: glTestnetAsimov.rpcUrls,
  blockExplorers: glTestnetAsimov.blockExplorers,
});

export const networks = [studionet, testnetAsimov] as [AppKitNetwork, ...AppKitNetwork[]];

// Wallet connect (Reown AppKit) is not load-bearing for the rest of the app — every page still
// works off plain genlayer-js reads/writes. If AppKit or its wagmi adapter fails to initialize for
// any environment-specific reason (bad/missing project id, a WalletConnect Cloud check, etc.), fall
// back to a bare wagmi config instead of letting that throw take down the whole module graph before
// React ever mounts (which is exactly what turns into a blank page with no error on screen).
let wagmiConfig: Config;
try {
  const wagmiAdapter = new WagmiAdapter({ networks, projectId: projectId ?? "" });

  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: projectId ?? "",
    metadata: {
      name: "VeriMarket",
      description: "AI-resolved prediction markets on GenLayer",
      url: typeof window !== "undefined" ? window.location.origin : "https://verimarket.app",
      icons: ["/icon.svg"],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
      swaps: false,
      onramp: false,
      send: false,
      receive: false,
      history: false,
    },
    themeMode: "dark",
  });

  wagmiConfig = wagmiAdapter.wagmiConfig;
} catch (err) {
  console.error("Reown AppKit failed to initialize — wallet connect will be unavailable:", err);
  wagmiConfig = createConfig({
    chains: networks as [typeof studionet, typeof testnetAsimov],
    transports: {
      [studionet.id]: http(),
      [testnetAsimov.id]: http(),
    },
  });
}

export { wagmiConfig };
