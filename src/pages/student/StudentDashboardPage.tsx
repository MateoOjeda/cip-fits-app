import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useStudentSurveys } from "@/hooks/useStudentSurveys";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  CreditCard, 
  Clock, 
  Bell,
  CheckCircle2, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Unlock,
  Lock,
  FileText,
  Loader2,
  ArrowUpCircle,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Flame // Added since Dumbbell use it
} from "lucide-react";
import { formatDistanceToNow, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { TakeSurveyDialog } from "@/components/student/TakeSurveyDialog";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";
import { toast } from "sonner";

interface TrainerChange {
  id: string;
  change_type: string;
  description: string;
  created_at: string;
  entity_id?: string;
}

interface PendingSurvey {
  id: string;
  survey_id: string;
  survey?: {
    title: string;
  };
}

const CHANGE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  exercise_added: { icon: Plus, label: "Nuevo ejercicio" },
  exercise_updated: { icon: Edit, label: "Ejercicio actualizado" },
  exercise_removed: { icon: Trash2, label: "Ejercicio eliminado" },
  level_unlocked: { icon: Unlock, label: "Nivel desbloqueado" },
  level_locked: { icon: Lock, label: "Nivel bloqueado" },
  content_updated: { icon: FileText, label: "Contenido actualizado" },
};

export default function StudentDashboardPage() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  
  const {
    profile: queryProfile,
    studentData,
    notifications: rawNotifications,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useStudentDashboard(user?.uid);

  const {
    pendingSurveys,
    isLoadingPending,
    refetchPending,
  } = useStudentSurveys(user?.uid);

  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<TrainerChange[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<PendingSurvey | null>(null);

  useEffect(() => {
    if (queryProfile) {
      setProfile(queryProfile);
    }
  }, [queryProfile]);

  useEffect(() => {
    if (rawNotifications && user) {
      const readIdsStr = localStorage.getItem(`read_notifications_${user.uid}`);
      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      const activeNotifications = rawNotifications.filter((n: any) => !readIds.includes(n.id));
      setNotifications(activeNotifications);
    }
  }, [rawNotifications, user]);

  const refetchAll = async () => {
    await Promise.all([refetchDashboard(), refetchPending()]);
  };

  const loading = isLoadingDashboard || isLoadingPending;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasPlan = studentData?.plan_type || studentData?.plan_entrenamiento || studentData?.plan_alimentacion;
  const isPaid = studentData?.payment_status === "pagado";
  
  // Logic for next payment (mocking 30 days cycle from creation if no date exists)
  const nextPaymentDate = studentData?.routine_next_change_date 
    ? new Date(studentData.routine_next_change_date)
    : addDays(new Date(studentData?.created_at || new Date()), 30);
  
  const daysRemaining = Math.max(0, differenceInDays(nextPaymentDate, new Date()));

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      {/* PROFILE HEADER SECTION */}
      <div className="relative pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <ProfilePhotoUpload 
              avatarUrl={profile?.avatar_url} 
              initials={displayName?.slice(0, 2).toUpperCase() || "??"} 
              onUploaded={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
            />
            {isPaid && (
              <div className="absolute -bottom-0.5 -left-0.5 h-6 w-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-md">
                <Crown className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs text-muted-foreground font-medium">{hasPlan ? "Alumno Activo" : "Sin Plan Asignado"}</p>
              {pendingSurveys.length > 0 && (
                <Badge 
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-semibold px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/15 transition-colors"
                  onClick={() => document.getElementById('encuestas-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <ClipboardList className="h-3 w-3" />
                  Tienes encuestas pendientes
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* PLAN & PAYMENT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Estado de Suscripción</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {isPaid ? "Mes Abonado" : "Pago Pendiente"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {isPaid ? (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold px-2.5 py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" /> AL DÍA
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-[10px] font-bold px-2.5 py-0.5">
                        <XCircle className="h-3 w-3 mr-1 inline" /> PENDIENTE
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                isPaid ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"
              )}>
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-6 h-9 gap-2 rounded-xl border-border/60 hover:bg-muted/10 transition-all text-xs font-semibold"
              onClick={() => navigate("/student/plans")}
            >
              <ArrowUpCircle className="h-4 w-4 text-primary" />
              <span>Ver Planes</span>
            </Button>
          </CardContent>
        </Card>

        {isPaid ? (
          <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Próximo Vencimiento</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {daysRemaining} Días
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Restantes de tu ciclo de entrenamiento
                    </p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              
              <div className="mt-6 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }} 
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 shadow-sm rounded-2xl flex flex-col justify-center">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-12 w-12 bg-destructive/15 rounded-full flex items-center justify-center mx-auto text-destructive">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-destructive">Renovar suscripción</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Tu periodo de entrenamiento ha finalizado. Ponte en contacto con tu entrenador para renovar el servicio.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PLAN DETAILS LIST */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Planes Activados</span>
          <div className="h-[1px] w-full bg-border/50" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studentData?.plan_entrenamiento && (
            <Card className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Entrenamiento</p>
                <p className="font-semibold text-sm truncate text-foreground">{studentData.plan_entrenamiento}</p>
              </div>
            </Card>
          )}
          {studentData?.plan_alimentacion && (
            <Card className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Nutrición</p>
                <p className="font-semibold text-sm truncate text-foreground">{studentData.plan_alimentacion}</p>
              </div>
            </Card>
          )}
          {!studentData?.plan_entrenamiento && !studentData?.plan_alimentacion && (
            <Card className="bg-card border border-dashed border-border/80 rounded-xl p-6 text-center col-span-full">
              <p className="text-xs text-muted-foreground font-medium">No tienes planes asignados actualmente</p>
            </Card>
          )}
        </div>
      </div>

      {/* ENCUESTAS SECTION */}
      <div id="encuestas-section" className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Encuestas Pendientes</h2>
        </div>

        {pendingSurveys.length === 0 ? (
          <Card className="border border-border/40 bg-card py-6 text-center shadow-sm">
            <CardContent className="p-0 flex flex-col items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/70 mb-2" />
              <p className="text-xs text-muted-foreground font-medium">
                No tienes encuestas pendientes por el momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingSurveys.map((asst) => (
              <Card 
                key={asst.id} 
                className="border border-border/50 bg-card hover:bg-muted/10 transition-all duration-200 rounded-xl p-4 cursor-pointer shadow-sm"
                onClick={() => setActiveSurvey(asst)}
              >
                <CardContent className="p-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate leading-tight mb-1">{asst.survey?.title}</h3>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-md">
                        Pendiente
                      </Badge>
                    </div>
                  </div>
                  <Button className="h-8 px-4 rounded-lg text-xs font-semibold shrink-0">
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Novedades</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary h-7 px-2 hover:bg-muted/50"
                onClick={async () => {
                  const readIdsStr = localStorage.getItem(`read_notifications_${user?.uid}`);
                  const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
                  const newReadIds = [...new Set([...readIds, ...notifications.map(n => n.id)])];
                  localStorage.setItem(`read_notifications_${user?.uid}`, JSON.stringify(newReadIds));
                  setNotifications([]);
                  toast.success("Notificaciones marcadas como leídas");
                }}
              >
                Limpiar todo
              </Button>
            )}
            <Badge variant="outline" className="rounded-md text-[9px] font-semibold uppercase text-muted-foreground border-border px-2.5 py-0.5">
              Recientes
            </Badge>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-border rounded-xl bg-card">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Sin novedades por ahora</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((change) => {
              const config = CHANGE_CONFIG[change.change_type] || { icon: Bell, label: "Aviso" };
              const Icon = config.icon;

              const handleDelete = async (e: React.MouseEvent) => {
                e.stopPropagation();
                try {
                  await deleteDoc(doc(db, "trainer_changes", change.id));
                  const readIdsStr = localStorage.getItem(`read_notifications_${user?.uid}`);
                  const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
                  localStorage.setItem(`read_notifications_${user?.uid}`, JSON.stringify([...new Set([...readIds, change.id])]));
                  setNotifications((prev) => prev.filter((n) => n.id !== change.id));
                  toast.success("Notificación eliminada");
                } catch (err) {
                  toast.error("Error al eliminar la notificación");
                }
              };

              const handleNavigate = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (change.change_type.startsWith("exercise")) {
                  navigate("/student/routines");
                } else if (change.change_type.startsWith("level") || change.change_type === "content_updated") {
                  navigate("/student/plans");
                }
              };

              return (
                <Card 
                  key={change.id} 
                  className="border border-border/40 bg-card hover:bg-muted/10 transition-all rounded-xl p-4 group relative"
                >
                  <CardContent className="p-0 flex items-start gap-4">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/40">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{config.label}</span>
                        <span className="text-[9px] font-medium text-muted-foreground/75">
                          {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {change.description}
                      </p>
                    </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={handleNavigate}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {activeSurvey && (
        <TakeSurveyDialog
          open={!!activeSurvey}
          onOpenChange={(v) => !v && setActiveSurvey(null)}
          surveyId={activeSurvey.survey_id}
          assignmentId={activeSurvey.id}
          onCompleted={() => {
            setActiveSurvey(null);
            refetchAll();
          }}
        />
      )}
    </div>
  );
}

const Dumbbell = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="m3 21 18-18" />
    <path d="m3 3 18 18" />
  </svg>
);
