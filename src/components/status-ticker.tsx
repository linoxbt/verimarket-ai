import { motion } from "framer-motion";
import { useMarkets } from "@/hooks/useMarkets";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { NETWORKS } from "@/integrations/genlayer/client";

function Pill({ label, tone }: { label: string; tone: "pass" | "neutral" }) {
  return (
    <span className="mx-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "pass" ? "bg-pass" : "bg-accent"}`} />
      {label}
    </span>
  );
}

export function StatusTicker() {
  const { network } = useWallet();
  const { data: markets } = useMarkets();
  const openCount = markets?.filter((m) => m.status === "open").length ?? 0;

  const pills = [
    <Pill key="net" label={`GenLayer ${NETWORKS[network].label}`} tone="pass" />,
    <Pill key="markets" label={`${markets?.length ?? 0} markets tracked`} tone="neutral" />,
    <Pill key="open" label={`${openCount} open for trading`} tone="neutral" />,
    <Pill key="ai" label="AI resolution: live" tone="pass" />,
  ];

  return (
    <div className="overflow-hidden border-b border-line bg-surface2 py-2">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      >
        {pills}
        {pills}
      </motion.div>
    </div>
  );
}
