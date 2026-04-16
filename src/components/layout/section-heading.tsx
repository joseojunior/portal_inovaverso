import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions}
    </div>
  );
}
