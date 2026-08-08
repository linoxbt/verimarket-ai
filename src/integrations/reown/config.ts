import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { defineChain, type AppKitNetwork } from "@reown/appkit/networks";
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

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: projectId ?? "",
});

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

export const wagmiConfig = wagmiAdapter.wagmiConfig;
