import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Crown,
  ClipboardList,
} from "lucide-react";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";

interface DashboardProfileHeaderProps {
  displayName: string;
  avatarUrl?: string;
  isPaid: boolean;
  hasPlan: boolean;
  pendingSurveysCount: number;
  onAvatarUploaded: () => void;
  onScrollToSurveys: () => void;
}

export const DashboardProfileHeader: React.FC<DashboardProfileHeaderProps> = ({
  displayName,
  avatarUrl,
  isPaid,
  hasPlan,
  pendingSurveysCount,
  onAvatarUploaded,
  onScrollToSurveys,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const formattedDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="relative pt-6 pb-4 border-b border-border/40">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative">
          <ProfilePhotoUpload
            avatarUrl={avatarUrl}
            initials={displayName?.slice(0, 2).toUpperCase() || "??"}
            onUploaded={onAvatarUploaded}
          />
          {isPaid && (
            <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-md">
              <Crown className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-1.5 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{getGreeting()}</p>
              <h1 className="text-xl font-bold tracking-tight text-foreground mt-0.5">{displayName}</h1>
              <p className="text-xs text-muted-foreground font-medium capitalize mt-1">{formattedDate}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              <Badge variant="outline" className={cn(
                "border-none shadow-none text-[9px] font-bold px-2.5 py-1 rounded-md",
                hasPlan ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {hasPlan ? "Alumno Activo" : "Sin Plan Asignado"}
              </Badge>
              {pendingSurveysCount > 0 && (
                <Badge
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-bold px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/15 transition-all transition-ds"
                  onClick={onScrollToSurveys}
                >
                  <ClipboardList className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                  {pendingSurveysCount} {pendingSurveysCount === 1 ? "Encuesta pendiente" : "Encuestas pendientes"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
