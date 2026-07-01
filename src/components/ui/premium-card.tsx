import * as React from "react";
import { cn } from "@/lib/utils";

export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glassmorphism?: boolean;
  glowOnHover?: boolean;
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, hoverEffect = true, glassmorphism = true, glowOnHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border/40 shadow-sm transition-all duration-200 overflow-hidden",
          glassmorphism ? "bg-card/65 backdrop-blur-md" : "bg-card",
          hoverEffect && "hover:scale-[1.008] hover:border-primary/20 hover:shadow-md",
          glowOnHover && "hover:shadow-[0_0_15px_-3px_rgba(var(--primary),0.1)]",
          className
        )}
        {...props}
      />
    );
  }
);
PremiumCard.displayName = "PremiumCard";

const PremiumCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-4 border-b border-border/40 bg-muted/15 flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);
PremiumCardHeader.displayName = "PremiumCardHeader";

const PremiumCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2", className)}
      {...props}
    />
  )
);
PremiumCardTitle.displayName = "PremiumCardTitle";

const PremiumCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
  )
);
PremiumCardContent.displayName = "PremiumCardContent";

const PremiumCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-4 pt-2 border-t border-border/40 bg-muted/10 flex items-center gap-2", className)}
      {...props}
    />
  )
);
PremiumCardFooter.displayName = "PremiumCardFooter";

export { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent, PremiumCardFooter };
