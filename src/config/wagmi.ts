import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const genlayerAsimov = defineChain({
  id: 4221,
  name: 'GenLayer Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GenLayer Token',
    symbol: 'GEN',
  },
  rpcUrls: {
    default: {
      http: ['https://genlayer-testnet.rpc.caldera.xyz/http'],
      webSocket: ['wss://genlayer-testnet.rpc.caldera.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Explorer',
      url: 'https://genlayer-testnet.explorer.caldera.xyz',
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'VeriMarket',
  projectId: 'verimarket-demo', // WalletConnect project ID placeholder
  chains: [genlayerAsimov],
  ssr: false,
});
