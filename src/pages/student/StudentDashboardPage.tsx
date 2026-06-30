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
  Flame,
  Apple,
  Dumbbell
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
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* PROFILE HEADER SECTION */}
      <div className="relative pt-6 pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative">
            <ProfilePhotoUpload 
              avatarUrl={profile?.avatar_url} 
              initials={displayName?.slice(0, 2).toUpperCase() || "??"} 
              onUploaded={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
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
                {pendingSurveys.length > 0 && (
                  <Badge 
                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-bold px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/15 transition-all transition-ds"
                    onClick={() => document.getElementById('encuestas-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <ClipboardList className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                    {pendingSurveys.length} {pendingSurveys.length === 1 ? "Encuesta pendiente" : "Encuestas pendientes"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Accesos Rápidos</span>
          <div className="h-[1px] w-full bg-border/50" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ver Rutinas", path: "/student/routines", icon: Dumbbell, color: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/15" },
            { label: "Ver Planes", path: "/student/plans", icon: FileText, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15" },
            { label: "Mi Progreso", path: "/student/progress", icon: ArrowUpCircle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15" },
            { label: "Mis Comidas", path: "/student/meals", icon: Apple, color: "text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15" }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-ds shadow-sm",
                  action.color
                )}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="text-xs font-bold">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* PLAN & PAYMENT SECTION */}
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
              onClick={() => navigate("/student/plans")}
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

      {/* PLAN DETAILS LIST */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Planes Activados</span>
          <div className="h-[1px] w-full bg-border/50" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studentData?.plan_entrenamiento && (
            <Card className="bg-card/50 border border-border/40 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all transition-ds">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <Dumbbell className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Entrenamiento</p>
                <p className="font-semibold text-xs truncate text-foreground">{studentData.plan_entrenamiento}</p>
              </div>
            </Card>
          )}
          {studentData?.plan_alimentacion && (
            <Card className="bg-card/50 border border-border/40 rounded-xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all transition-ds">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Nutrición</p>
                <p className="font-semibold text-xs truncate text-foreground">{studentData.plan_alimentacion}</p>
              </div>
            </Card>
          )}
          {!studentData?.plan_entrenamiento && !studentData?.plan_alimentacion && (
            <Card className="bg-card/30 border border-dashed border-border/80 rounded-xl p-6 text-center col-span-full">
              <p className="text-xs text-muted-foreground font-medium">No tienes planes asignados actualmente</p>
            </Card>
          )}
        </div>
      </div>

      {/* ENCUESTAS SECTION */}
      <div id="encuestas-section" className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-foreground">Encuestas Pendientes</h2>
        </div>

        {pendingSurveys.length === 0 ? (
          <Card className="border border-border/40 bg-card/40 py-5 text-center shadow-sm rounded-xl">
            <CardContent className="p-0 flex flex-col items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500/70 mb-1.5" />
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
                className="border border-border/40 bg-card/60 hover:border-primary/30 transition-all duration-200 rounded-xl p-4 cursor-pointer shadow-sm group"
                onClick={() => setActiveSurvey(asst)}
              >
                <CardContent className="p-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0 shadow-sm transition-colors group-hover:bg-primary/20">
                      <ClipboardList className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-foreground truncate leading-tight mb-1">{asst.survey?.title}</h3>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-500 px-1.5 py-0.5 rounded-md">
                        Pendiente
                      </Badge>
                    </div>
                  </div>
                  <Button className="h-7 px-3 rounded-lg text-xs font-semibold shrink-0">
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS SECTION */}
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
            <Badge variant="outline" className="rounded-md text-[8px] font-bold uppercase text-muted-foreground border-border px-2 py-0.5">
              Recientes
            </Badge>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-xl bg-card/30">
            <Bell className="h-6 w-6 mx-auto text-muted-foreground/45 mb-1.5" />
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
                        onClick={handleNavigate}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={handleDelete}
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
