import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarUrl?: string;
  avatarInitials?: string;
  size?: "sm" | "md" | "lg";
  statusColor?: string;
}

const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  className,
  name,
  avatarUrl,
  avatarInitials,
  size = "md",
  statusColor,
  ...props
}) => {
  const initials = React.useMemo(() => {
    if (avatarInitials) return avatarInitials.substring(0, 2).toUpperCase();
    const safeName = name || "Alumno";
    const parts = safeName.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return safeName.substring(0, 2).toUpperCase();
  }, [name, avatarInitials]);

  const sizeClasses = React.useMemo(() => {
    switch (size) {
      case "sm":
        return "h-8 w-8 text-[9px]";
      case "lg":
        return "h-14 w-14 text-sm";
      case "md":
      default:
        return "h-10 w-10 text-xs";
    }
  }, [size]);

  return (
    <div className={cn("relative shrink-0 select-none", className)} {...props}>
      <Avatar className={cn(sizeClasses, "border border-border/30 shadow-sm")}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {statusColor && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
            statusColor
          )}
        />
      )}
    </div>
  );
};

export { AvatarBadge };
