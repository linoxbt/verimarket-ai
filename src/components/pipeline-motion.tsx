import { motion } from "framer-motion";

const NODES = ["Trade", "AI Resolves", "Settled on GenLayer"];

export function PipelineMotion() {
  return (
    <div className="flex flex-col items-stretch gap-0">
      {NODES.map((label, i) => (
        <div key={label} className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-sm border border-line bg-surface px-5 py-4 text-center font-mono text-sm text-ink"
          >
            <span className="text-accent">0{i + 1}</span> — {label}
          </motion.div>
          {i < NODES.length - 1 && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.25 + 0.2 }}
              className="h-8 w-px origin-top bg-line"
            />
          )}
        </div>
      ))}
    </div>
  );
}
