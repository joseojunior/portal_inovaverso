import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PagePlaceholderProps = {
  title: string;
  description: string;
  bullets: string[];
  eyebrow?: string;
  icon?: ReactNode;
  className?: string;
};

export function PagePlaceholder({
  title,
  description,
  bullets,
  eyebrow = "Em estrutura",
  icon,
  className
}: PagePlaceholderProps) {
  return (
    <Card className={cn("border-border/70 bg-card/90 shadow-sm", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>
          {icon ? <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div> : null}
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 p-4">
            <ArrowUpRight className="mt-0.5 size-4 text-primary" />
            <p className="text-sm text-muted-foreground">{bullet}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
