import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
} from "lucide-react";
import { addDays, differenceInDays } from "date-fns";

interface DashboardSubscriptionCardsProps {
  studentData: any;
  onNavigateToPlans: () => void;
}

export const DashboardSubscriptionCards: React.FC<DashboardSubscriptionCardsProps> = ({
  studentData,
  onNavigateToPlans,
}) => {
  const isPaid = studentData?.payment_status === "pagado";
  const nextPaymentDate = studentData?.routine_next_change_date
    ? new Date(studentData.routine_next_change_date)
    : addDays(new Date(studentData?.created_at || new Date()), 30);
  const daysRemaining = Math.max(0, differenceInDays(nextPaymentDate, new Date()));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border border-border/40 bg-card/60 shadow-sm hover:border-primary/20 transition-all duration-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Suscripción</span>
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {isPaid ? "Mes Abonado" : "Pago Pendiente"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {isPaid ? (
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-md text-[9px] font-bold px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" /> AL DÍA
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-[9px] font-bold px-2 py-0.5">
                      <XCircle className="h-3 w-3 mr-1 inline" /> PENDIENTE
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm border",
              isPaid ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400" : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-5 h-8 gap-2 rounded-lg border-border/60 hover:bg-muted/10 transition-all text-xs font-semibold"
            onClick={onNavigateToPlans}
          >
            <ArrowUpCircle className="h-3.5 w-3.5 text-primary" />
            <span>Ver Planes</span>
          </Button>
        </CardContent>
      </Card>

      {isPaid ? (
        <Card className="border border-border/40 bg-card/60 shadow-sm hover:border-primary/20 transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Próximo Vencimiento</span>
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-foreground">
                    {daysRemaining} Días restantes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    De tu ciclo de entrenamiento actual
                  </p>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 shadow-sm rounded-2xl flex flex-col justify-center">
          <CardContent className="p-6 text-center space-y-2">
            <div className="h-10 w-10 bg-destructive/15 rounded-full flex items-center justify-center mx-auto text-destructive">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-destructive">Renovar suscripción</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Tu periodo de entrenamiento ha finalizado. Ponte en contacto con tu entrenador para renovar el servicio.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
