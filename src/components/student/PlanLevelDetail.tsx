import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Copy, MessageCircle, Check, ArrowLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LEVELS, LEVEL_LABELS, PLAN_TYPES, formatPrice } from "@/lib/planConstants";
import { cn } from "@/lib/utils";

interface PlanLevel {
  id: string;
  plan_type: string;
  level: string;
  content: string;
  unlocked: boolean;
}

interface TrainerInfo {
  mercadopago_alias: string;
  whatsapp_number: string;
  display_name: string;
}

interface Props {
  planType: typeof PLAN_TYPES[number];
  planLevels: PlanLevel[];
  trainerInfo: TrainerInfo | null;
  trainerPrices?: Record<string, number>;
  onBack: () => void;
}

export default function PlanLevelDetail({ planType, planLevels, trainerInfo, trainerPrices, onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const Icon = planType.icon;

  const getPrice = (level: string): number => {
    const key = `${planType.key}-${level}`;
    return trainerPrices?.[key] ?? 0;
  };

  const copyAlias = async () => {
    if (!trainerInfo?.mercadopago_alias) return;
    try {
      await navigator.clipboard.writeText(trainerInfo.mercadopago_alias);
      setCopiedAlias(true);
      toast.success("¡Alias copiado al portapapeles!");
      setTimeout(() => setCopiedAlias(false), 2000);
    } catch { toast.error("No se pudo copiar"); }
  };

  const openWhatsApp = (levelLabel: string) => {
    const phone = trainerInfo?.whatsapp_number || "";
    const message = encodeURIComponent(`Hola, acabo de realizar el pago del ${planType.label} - Nivel ${levelLabel}. Adjunto el comprobante.`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const levelDesc = planType.levelDescriptions as Record<string, string>;

  if (selectedLevel) {
    const pl = planLevels.find((p) => p.plan_type === planType.key && p.level === selectedLevel);
    const price = getPrice(selectedLevel);

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedLevel(null); setShowPayment(false); }} className="gap-1.5 text-muted-foreground hover:bg-muted/80">
          <ArrowLeft className="h-4 w-4" /> Volver a niveles
        </Button>
        <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{planType.label}</h2>
            <p className="text-xs text-muted-foreground">{LEVEL_LABELS[selectedLevel]}</p>
          </div>
        </div>
        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardHeader className="pb-2 p-5">
            <div className="flex items-center gap-2">
              {pl?.unlocked ? <Unlock className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pl?.unlocked ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>{pl?.unlocked ? "Desbloqueado" : "Bloqueado"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed">{levelDesc[selectedLevel]}</p>
            {pl?.unlocked ? (
              pl.content ? (
                <div className="text-xs whitespace-pre-wrap leading-relaxed bg-muted/50 border border-border/40 rounded-xl p-4 text-foreground">{pl.content}</div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Tu entrenador aún no ha agregado contenido para este nivel.</p>
              )
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/40 border border-border/40 rounded-xl p-5 text-center space-y-4">
                  <Lock className="h-7 w-7 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs text-muted-foreground">Este nivel está bloqueado. Realiza el pago para desbloquear su contenido.</p>
                  {!showPayment ? (
                    <Button className="gap-2 w-full h-10 rounded-xl font-semibold" onClick={() => setShowPayment(true)}>
                      <CreditCard className="h-4 w-4" /> Pagar Plan
                    </Button>
                  ) : (
                    <div className="space-y-3 pt-2 text-left">
                      {price > 0 && (
                        <div className="bg-card border border-border/50 rounded-xl p-4">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Valor del plan</p>
                          <p className="text-xl font-bold text-primary mt-0.5">{formatPrice(price)}</p>
                        </div>
                      )}
                      {trainerInfo?.mercadopago_alias && (
                        <div className="bg-card border border-border/50 rounded-xl p-4">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">CVU / Alias de Pago</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs font-semibold select-all text-foreground">{trainerInfo.mercadopago_alias}</span>
                            <Button variant="outline" size="sm" className="gap-1 h-7 px-2.5 rounded-lg text-xs" onClick={copyAlias}>
                              {copiedAlias ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              {copiedAlias ? "Copiado" : "Copiar"}
                            </Button>
                          </div>
                        </div>
                      )}
                      {trainerInfo?.whatsapp_number && (
                        <Button variant="outline" className="gap-2 w-full h-10 rounded-xl text-xs font-semibold" onClick={() => openWhatsApp(LEVEL_LABELS[selectedLevel])}>
                          <MessageCircle className="h-4 w-4 text-emerald-500" /> Enviar Comprobante por WhatsApp
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:bg-muted/80">
        <ArrowLeft className="h-4 w-4" /> Volver a planes
      </Button>
      <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{planType.label}</h2>
          <p className="text-xs text-muted-foreground">{planType.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {LEVELS.map((level) => {
          const pl = planLevels.find((p) => p.plan_type === planType.key && p.level === level);
          return (
            <Card 
              key={level} 
              className={cn(
                "border cursor-pointer group hover:bg-muted/10 transition-all rounded-xl shadow-sm",
                pl?.unlocked ? "border-border/50 bg-card" : "border-border/40 bg-card/60 opacity-80"
              )} 
              onClick={() => { setSelectedLevel(level); setShowPayment(false); }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  pl?.unlocked ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
                )}>
                  {pl?.unlocked ? <Unlock className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{LEVEL_LABELS[level]}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{levelDesc[level]}</p>
                  <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5 ${pl?.unlocked ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>{pl?.unlocked ? "Desbloqueado" : "Bloqueado"}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
