import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastAction {
  label: string;
  href: string;
}

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number;
}

interface Toast extends Required<Pick<ToastInput, "title" | "tone">> {
  id: string;
  description?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "text-pass",
  error: "text-fail",
  info: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tone = input.tone ?? "info";
      setToasts((prev) => [...prev, { id, title: input.title, description: input.description, tone, action: input.action }]);
      window.setTimeout(() => dismiss(id), input.durationMs ?? 7000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = TONE_ICON[t.tone];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-sm border border-line bg-surface p-3.5 shadow-none"
              >
                <Icon size={16} className={cn("mt-0.5 shrink-0", TONE_CLASSES[t.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-ink">{t.title}</p>
                  {t.description && <p className="mt-1 text-xs leading-relaxed text-muted">{t.description}</p>}
                  {t.action &&
                    (t.action.href.startsWith("/") ? (
                      <a
                        href={t.action.href}
                        className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:opacity-80"
                      >
                        {t.action.label}
                      </a>
                    ) : (
                      <a
                        href={t.action.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:opacity-80"
                      >
                        {t.action.label} <ExternalLink size={11} />
                      </a>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.toast;
}
