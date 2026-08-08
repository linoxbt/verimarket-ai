import { LogoMark } from "@/components/logo-mark";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className ?? "flex items-center gap-2 text-ink"}>
      <LogoMark size={20} />
      <span className="font-mono text-sm font-bold uppercase tracking-wide">
        VERI<span className="text-accent">MARKET</span>
      </span>
    </span>
  );
}
