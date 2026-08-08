import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion-provider";
import { WalletProvider } from "@/integrations/genlayer/WalletProvider";
import { MarketingLayout } from "@/components/marketing-layout";
import { AppLayout } from "@/components/app-layout";

import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import CreateMarket from "./pages/CreateMarket";
import MarketDetail from "./pages/MarketDetail";
import Docs from "./pages/Docs";
import Portfolio from "./pages/Portfolio";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <ThemeProvider>
        <MotionProvider>
          <BrowserRouter>
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
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </MotionProvider>
      </ThemeProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
