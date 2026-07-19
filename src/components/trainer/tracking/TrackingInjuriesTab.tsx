import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, Plus, Loader2, Trash2, RefreshCw } from "lucide-react";
import {
  Injury, InjuryStatus,
  addInjury, updateInjury, deleteInjury
} from "@/services/tracking";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<InjuryStatus, { label: string; className: string }> = {
  activa: { label: "Activa", className: "bg-destructive/10 text-destructive border-destructive/30" },
  recuperada: { label: "Recuperada", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
};

interface Props {
  studentId: string;
  injuries: Injury[];
  loading: boolean;
  onAdd: (i: Injury) => void;
  onUpdate: (id: string, data: Partial<Injury>) => void;
  onDelete: (id: string) => void;
}

export default function TrackingInjuriesTab({
  studentId, injuries, loading, onAdd, onUpdate, onDelete
}: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [location, setLocation] = useState("");
  const [zone, setZone] = useState("");
  const [painLevel, setPainLevel] = useState(5);
  const [intensity, setIntensity] = useState("");
  const [observations, setObservations] = useState("");

  const handleSave = useCallback(async () => {
    if (!user || !location.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data: Omit<Injury, "id"> = {
        trainer_id: user.uid,
        student_id: studentId,
        created_at: now,
        updated_at: now,
        location: location.trim(),
        zone: zone.trim() || undefined,
        pain_level: painLevel,
        intensity: intensity.trim() || undefined,
        status: "activa",
        observations: observations.trim() || undefined,
      };
      const id = await addInjury(data);
      onAdd({ id, ...data });
      toast.success("Lesión registrada");
      setLocation(""); setZone(""); setPainLevel(5); setIntensity(""); setObservations("");
    } catch {
      toast.error("Error al guardar la lesión");
    } finally {
      setSaving(false);
    }
  }, [user, studentId, location, zone, painLevel, intensity, observations, onAdd]);

  const handleToggleStatus = async (injury: Injury) => {
    setTogglingId(injury.id);
    const newStatus: InjuryStatus = injury.status === "activa" ? "recuperada" : "activa";
    try {
      const updated_at = new Date().toISOString();
      await updateInjury(injury.id, { status: newStatus, updated_at });
      onUpdate(injury.id, { status: newStatus, updated_at });
      toast.success(newStatus === "recuperada" ? "Marcada como recuperada" : "Reactivada");
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteInjury(id);
      onDelete(id);
      toast.success("Lesión eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const active = injuries.filter((i) => i.status === "activa");
  const recovered = injuries.filter((i) => i.status === "recuperada");

  const painColor = (level: number) => {
    if (level <= 3) return "text-emerald-600 dark:text-emerald-400";
    if (level <= 6) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Registrar Lesión
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Zona afectada *</Label>
              <Input
                placeholder="Ej: Rodilla derecha"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9 text-xs border-border/50 bg-secondary/15"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Zona (detalle)</Label>
              <Input
                placeholder="Ej: Ligamento lateral externo"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="h-9 text-xs border-border/50 bg-secondary/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                Nivel de dolor
              </Label>
              <span className={cn("text-sm font-bold", painColor(painLevel))}>
                {painLevel}/10
              </span>
            </div>
            <Slider
              min={1} max={10} step={1}
              value={[painLevel]}
              onValueChange={([v]) => setPainLevel(v)}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Intensidad / Tipo</Label>
            <Input
              placeholder="Ej: Aguda, crónica, muscular..."
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="h-9 text-xs border-border/50 bg-secondary/15"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Observaciones</Label>
            <Textarea
              placeholder="Contexto, circunstancias, restricciones de movimiento..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              className="text-xs border-border/50 bg-secondary/15 resize-none"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !location.trim()}
            className="w-full h-10 rounded-xl font-bold shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            {saving ? "Guardando..." : "Registrar Lesión"}
          </Button>
        </CardContent>
      </Card>

      {/* Active injuries */}
      {active.length > 0 && (
        <Card className="border border-destructive/20 bg-card/60 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Lesiones Activas ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {active.map((inj) => <InjuryCard key={inj.id} injury={inj} painColor={painColor}
              onToggle={handleToggleStatus} onDelete={handleDelete}
              togglingId={togglingId} deletingId={deletingId} />)}
          </CardContent>
        </Card>
      )}

      {/* Recovered injuries */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : injuries.length === 0 ? (
        <EmptyState type="empty" title="Sin lesiones registradas" description="Registra lesiones o incomodidades para hacer seguimiento." />
      ) : (
        recovered.length > 0 && (
          <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-500" />
                Historial ({recovered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recovered.map((inj) => <InjuryCard key={inj.id} injury={inj} painColor={painColor}
                onToggle={handleToggleStatus} onDelete={handleDelete}
                togglingId={togglingId} deletingId={deletingId} />)}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

function InjuryCard({
  injury, painColor, onToggle, onDelete, togglingId, deletingId
}: {
  injury: Injury;
  painColor: (n: number) => string;
  onToggle: (i: Injury) => void;
  onDelete: (id: string) => void;
  togglingId: string | null;
  deletingId: string | null;
}) {
  const cfg = STATUS_CONFIG[injury.status];
  return (
    <div className="p-3.5 rounded-xl bg-secondary/10 border border-border/30 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold">{injury.location}</p>
          {injury.zone && <p className="text-[10px] text-muted-foreground">{injury.zone}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={cn("text-[9px] font-bold border", cfg.className)}>
            {cfg.label}
          </Badge>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onToggle(injury)}
            disabled={togglingId === injury.id}
          >
            {togglingId === injury.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(injury.id)}
            disabled={deletingId === injury.id}
          >
            {deletingId === injury.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-xs font-bold", painColor(injury.pain_level))}>
          Dolor: {injury.pain_level}/10
        </span>
        {injury.intensity && (
          <Badge variant="outline" className="text-[9px]">{injury.intensity}</Badge>
        )}
        <span className="text-[9px] text-muted-foreground ml-auto">
          {format(parseISO(injury.created_at), "d MMM yyyy", { locale: es })}
        </span>
      </div>

      {injury.observations && (
        <p className="text-[10px] text-muted-foreground italic border-l-2 border-border/40 pl-2">
          {injury.observations}
        </p>
      )}
    </div>
  );
}
