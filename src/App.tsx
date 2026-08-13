import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "@/integrations/reown/config";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion-provider";
import { ToastProvider } from "@/components/toast";
import { WalletProvider } from "@/integrations/genlayer/WalletProvider";
import { MarketWatcher } from "@/components/market-watcher";
import { MarketingLayout } from "@/components/marketing-layout";
import { AppLayout } from "@/components/app-layout";

import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import CreateMarket from "./pages/CreateMarket";
import MarketDetail from "./pages/MarketDetail";
import Docs from "./pages/Docs";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ToastProvider>
          <ThemeProvider>
            <MotionProvider>
              <BrowserRouter>
                <MarketWatcher />
                <Routes>
                  <Route element={<MarketingLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/docs" element={<Docs />} />
                  </Route>
                  <Route element={<AppLayout />}>
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/create" element={<CreateMarket />} />
                    <Route path="/market/:id" element={<MarketDetail />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </MotionProvider>
          </ThemeProvider>
        </ToastProvider>
      </WalletProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
