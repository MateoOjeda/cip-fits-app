import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Unlock,
  Lock,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TrainerChange {
  id: string;
  change_type: string;
  description: string;
  created_at: string;
  entity_id?: string;
}

const CHANGE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  exercise_added: { icon: Plus, label: "Nuevo ejercicio" },
  exercise_updated: { icon: Edit, label: "Ejercicio actualizado" },
  exercise_removed: { icon: Trash2, label: "Ejercicio eliminado" },
  level_unlocked: { icon: Unlock, label: "Nivel desbloqueado" },
  level_locked: { icon: Lock, label: "Nivel bloqueado" },
  content_updated: { icon: FileText, label: "Contenido actualizado" },
};

interface DashboardNotificationsSectionProps {
  notifications: TrainerChange[];
  onClearAll: () => void;
  onDelete: (change: TrainerChange) => void;
  onNavigate: (change: TrainerChange) => void;
}

export const DashboardNotificationsSection: React.FC<DashboardNotificationsSectionProps> = ({
  notifications,
  onClearAll,
  onDelete,
  onNavigate,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-foreground">Novedades</h2>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[9px] font-bold uppercase text-muted-foreground hover:text-primary h-6 px-2 hover:bg-muted/50 rounded-lg"
              onClick={onClearAll}
            >
              Limpiar todo
            </Button>
          )}
          <Badge variant="outline" className="rounded-md text-[8px] font-bold uppercase text-muted-foreground border-border px-2 py-0.5">
            Recientes
          </Badge>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          type="empty"
          title="Sin novedades por ahora"
          description="No se han registrado modificaciones o actualizaciones recientes de tu entrenador."
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((change) => {
            const config = CHANGE_CONFIG[change.change_type] || { icon: Bell, label: "Aviso" };
            const Icon = config.icon;

            return (
              <Card
                key={change.id}
                className="border border-border/40 bg-card/50 hover:border-primary/20 transition-all rounded-xl p-4 group relative"
              >
                <CardContent className="p-0 flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/40">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-bold text-primary uppercase tracking-wider">{config.label}</span>
                      <span className="text-[8px] font-medium text-muted-foreground/75">
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {change.description}
                    </p>
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      onClick={(e) => { e.stopPropagation(); onNavigate(change); }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                      onClick={(e) => { e.stopPropagation(); onDelete(change); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
