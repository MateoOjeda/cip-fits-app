import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2, Dumbbell, Apple, Eye, Pencil } from "lucide-react";
import { PLAN_LEVEL_OPTIONS, getLevelColor } from "@/lib/constants";
import type { LinkedStudent } from "@/services/alumnos";

interface StudentDetailPanelProps {
  student: LinkedStudent | null;
  onDeleteClick: (student: LinkedStudent) => void;
}

export function StudentDetailPanel({ student, onDeleteClick }: StudentDetailPanelProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="glass-panel overflow-hidden border-primary/10 rounded-3xl h-full flex flex-col shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!student ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center flex-1 h-full min-h-[500px] text-center p-8 z-10"
            >
              <div className="p-6 rounded-full bg-accent/5 border border-accent/10 mb-4 backdrop-blur-sm">
                <Users className="h-12 w-12 text-accent/40" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Seleccioná un alumno de la lista para ver su información</p>
            </motion.div>
          ) : (
            <motion.div 
              key={student.user_id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[75vh] flex-1 z-10 hide-scrollbar"
            >
              {/* Profile header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-border/40">
                <div 
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => navigate(`/trainer/students/${student.user_id}`)}
                >
                  <Avatar className="h-24 w-24 border-2 border-accent/40 shadow-lg shadow-accent/20">
                    <AvatarImage src={student.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent font-bold text-3xl">
                      {student.avatar_initials || (student.display_name || "??").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-2">
                  <h2 
                    className="text-3xl font-display font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity drop-shadow-md"
                    onClick={() => navigate(`/trainer/students/${student.user_id}`)}
                  >
                    {student.display_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${student.paymentStatus === "pagado" ? "border-green-400/50 text-green-600" : "border-orange-400/50 text-orange-600"}`}>
                      {student.paymentStatus === "pagado" ? "✓ Pagado" : "⏳ No pagado"}
                    </Badge>
                    {student.groupName && (
                      <Badge className="badge-info-tag px-3 py-1 text-[11px] border-none shadow-md shadow-primary/10">
                        Grupo: {student.groupName}
                      </Badge>
                    )}
                    {(student.age || student.weight) && (
                      <div className="flex items-center gap-2 ml-1">
                        {student.age && (
                          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] font-bold px-2 py-0.5">
                            {student.age} años
                          </Badge>
                        )}
                        {student.weight && (
                          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] font-bold px-2 py-0.5">
                            {student.weight}kg
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors absolute top-6 right-6"
                  onClick={() => onDeleteClick(student)}
                  title="Eliminar alumno permanentemente"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Bento Grid layout for plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Routine section */}
                <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 shadow-inner flex flex-col justify-between hover:bg-card/60 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Dumbbell className="h-5 w-5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-sm">Entrenamiento</h3>
                    </div>
                    {student.planEntrenamiento && student.planEntrenamiento !== "none" ? (
                      <Badge variant="outline" className={`text-xs ${getLevelColor(student.planEntrenamiento)}`}>
                        Nivel: {PLAN_LEVEL_OPTIONS.find(o => o.value === student.planEntrenamiento)?.label || student.planEntrenamiento}
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin rutina asignada</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-xl border-accent/20 hover:bg-accent/10" onClick={() => navigate(`/trainer/students/${student.user_id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver
                    </Button>
                    <Button size="sm" className="btn-gradient flex-1 h-9 text-xs rounded-xl" onClick={() => navigate(`/trainer/routines/${student.user_id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                </div>

                {/* Meals routine section */}
                <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 shadow-inner flex flex-col justify-between hover:bg-card/60 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Apple className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="font-semibold text-sm">Alimentación</h3>
                    </div>
                    {student.planAlimentacion && student.planAlimentacion !== "none" ? (
                      <Badge variant="outline" className={`text-xs ${getLevelColor(student.planAlimentacion)}`}>
                        Nivel: {PLAN_LEVEL_OPTIONS.find(o => o.value === student.planAlimentacion)?.label || student.planAlimentacion}
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin dieta asignada</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-xl border-green-500/20 hover:bg-green-500/10 text-green-500" onClick={() => navigate(`/trainer/students/${student.user_id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver
                    </Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-1 h-9 text-xs rounded-xl" onClick={() => navigate(`/trainer/students/${student.user_id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
