import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border/70 bg-muted/30",
        compact ? "py-6 px-4" : "py-10 px-6",
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3 ring-1 ring-border/60">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground/80">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-[40ch]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
