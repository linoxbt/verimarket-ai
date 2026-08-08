import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "pass" | "partial" | "fail" | "sev-high" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  pass: "text-pass bg-pass/10 border-pass/40",
  partial: "text-partial bg-partial/10 border-partial/40",
  fail: "text-fail bg-fail/10 border-fail/40",
  "sev-high": "text-sev-high bg-sev-high/10 border-sev-high/40",
  neutral: "text-muted bg-surface2 border-line",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
