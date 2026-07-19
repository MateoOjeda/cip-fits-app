import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { StickyNote, Plus, Loader2, Trash2, Eye, EyeOff, Lock } from "lucide-react";
import {
  TrackingNote, NoteVisibility,
  addNote, deleteNote
} from "@/services/tracking";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const VISIBILITY_CONFIG: Record<NoteVisibility, { label: string; icon: typeof Eye; className: string }> = {
  privada: { label: "Privada", icon: Lock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  publica: { label: "Pública", icon: Eye, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
};

interface Props {
  studentId: string;
  notes: TrackingNote[];
  loading: boolean;
  onAdd: (n: TrackingNote) => void;
  onDelete: (id: string) => void;
}

export default function TrackingNotesTab({
  studentId, notes, loading, onAdd, onDelete
}: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("privada");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      const data: Omit<TrackingNote, "id"> = {
        trainer_id: user.uid,
        student_id: studentId,
        created_at: new Date().toISOString(),
        content: content.trim(),
        visibility,
      };
      const id = await addNote(data);
      onAdd({ id, ...data });
      toast.success("Nota guardada");
      setContent("");
    } catch {
      toast.error("Error al guardar la nota");
    } finally {
      setSaving(false);
    }
  }, [user, studentId, content, visibility, onAdd]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteNote(id);
      onDelete(id);
      toast.success("Nota eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nueva Nota
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Nota</Label>
            <Textarea
              placeholder="Observación del entrenador sobre este alumno..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="text-xs border-border/50 bg-secondary/15 resize-none"
            />
          </div>

          {/* Visibility toggle */}
          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Visibilidad</Label>
            <div className="flex gap-2">
              {(["privada", "publica"] as NoteVisibility[]).map((v) => {
                const cfg = VISIBILITY_CONFIG[v];
                const Icon = cfg.icon;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[10px] font-bold transition-all",
                      visibility === v
                        ? cfg.className
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground">
              {visibility === "privada"
                ? "Solo visible para el entrenador."
                : "El alumno puede ver esta nota."}
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full h-10 rounded-xl font-bold shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <StickyNote className="h-4 w-4 mr-2" />}
            {saving ? "Guardando..." : "Guardar Nota"}
          </Button>
        </CardContent>
      </Card>

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : notes.length === 0 ? (
        <EmptyState type="empty" title="Sin notas" description="Las notas del entrenador aparecerán aquí." />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const cfg = VISIBILITY_CONFIG[note.visibility];
            const Icon = cfg.icon;
            return (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-secondary/10 border border-border/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[9px] font-bold border gap-1", cfg.className)}>
                      <Icon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {format(parseISO(note.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                  >
                    {deletingId === note.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
