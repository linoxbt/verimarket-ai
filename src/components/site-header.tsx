import { Link } from "react-router-dom";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { NetworkSwitcher } from "@/components/network-switcher";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/markets" className="hidden font-mono text-sm text-muted hover:text-ink sm:inline">
            Markets
          </Link>
          <Link to="/docs" className="hidden font-mono text-sm text-muted hover:text-ink sm:inline">
            Docs
          </Link>
          <div className="hidden sm:block">
            <NetworkSwitcher />
          </div>
          <ThemeToggle />
          <WalletConnectButton />
          <Link
            to="/markets"
            className="hidden rounded-sm border border-accent px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent hover:text-bg sm:inline-flex"
          >
            Open App
          </Link>
        </nav>
      </div>
    </header>
  );
}
