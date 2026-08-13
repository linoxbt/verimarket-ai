import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Trade } from "@/integrations/genlayer/types";

const WIDTH = 640;
const HEIGHT = 140;
const PADDING = 8;

interface Point {
  x: number;
  y: number;
  probability: number;
  timestamp: number;
}

function buildPoints(trades: Trade[]): Point[] {
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let yesPool = 0n;
  let noPool = 0n;

  const raw = sorted.map((trade, i) => {
    if (trade.position === "yes") yesPool += trade.amount;
    else noPool += trade.amount;
    const total = yesPool + noPool;
    const probability = total === 0n ? 50 : Number((yesPool * 10000n) / total) / 100;
    return { index: i, probability, timestamp: trade.timestamp };
  });

  if (raw.length === 0) return [];

  const n = raw.length;
  return raw.map((r) => ({
    x: n === 1 ? WIDTH / 2 : PADDING + (r.index / (n - 1)) * (WIDTH - PADDING * 2),
    y: PADDING + (1 - r.probability / 100) * (HEIGHT - PADDING * 2),
    probability: r.probability,
    timestamp: r.timestamp,
  }));
}

export function OddsChart({ trades }: { trades: Trade[] }) {
  const points = useMemo(() => buildPoints(trades), [trades]);
  const [hover, setHover] = useState<Point | null>(null);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
        <TrendingUp size={14} className="text-accent" /> Odds over time
      </div>

      {points.length < 2 ? (
        <p className="font-mono text-sm text-muted">Not enough trades yet to chart odds history.</p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            preserveAspectRatio="none"
            onMouseLeave={() => setHover(null)}
          >
            <line
              x1={PADDING}
              y1={HEIGHT / 2}
              x2={WIDTH - PADDING}
              y2={HEIGHT / 2}
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <rect
                key={i}
                x={i === 0 ? p.x : (points[i - 1].x + p.x) / 2}
                y={0}
                width={
                  i === points.length - 1
                    ? WIDTH - (i === 0 ? p.x : (points[i - 1].x + p.x) / 2)
                    : (points[i + 1].x + p.x) / 2 - (i === 0 ? p.x : (points[i - 1].x + p.x) / 2)
                }
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHover(p)}
              />
            ))}
            {hover && <circle cx={hover.x} cy={hover.y} r={3.5} fill="var(--accent)" />}
          </svg>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
            <span>{new Date(points[0].timestamp * 1000).toLocaleDateString()}</span>
            <span className="text-ink">
              {hover ? `${hover.probability.toFixed(0)}% YES` : `${points[points.length - 1].probability.toFixed(0)}% YES`}
            </span>
            <span>{new Date(points[points.length - 1].timestamp * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
