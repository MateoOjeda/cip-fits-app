import React, { useState, useEffect, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Loader2, Palette, CreditCard, User, LogOut, MessageSquare, DollarSign, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAppTheme } from "@/hooks/useAppTheme";
import ProfilePhotoUpload from "./ProfilePhotoUpload";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function UserSettingsDialog() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mercadopagoAlias, setMercadopagoAlias] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { currentTheme, setTheme, themes } = useAppTheme();
  
  const isTrainer = role === "trainer";

  useEffect(() => {
    if (!user || !open) return;

    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const docRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setMercadopagoAlias(data.mercadopago_alias || "");
          setWhatsappNumber(data.whatsapp_number || "");
          setAvatarUrl(data.avatar_url || null);
          setDisplayName(data.display_name || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user, open]);

  const handleSaveBilling = async (alias: string, whatsapp: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), { 
        mercadopago_alias: alias.trim(), 
        whatsapp_number: whatsapp.trim() 
      });
      setMercadopagoAlias(alias);
      setWhatsappNumber(whatsapp);
      toast.success("Configuración guardada");
    } catch (err) {
      console.error("Error saving billing:", err);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      toast.success("Sesión cerrada correctamente");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Configuración">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-border/40 bg-card/95 shadow-xl rounded-2xl">
        <DialogHeader className="flex-shrink-0 pb-3 border-b border-border/40">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-primary" />
            Configuración del Sistema
          </DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="py-6 px-1 flex-1 overflow-y-auto"><LoadingSkeleton type="list" count={3} /></div>
        ) : isTrainer ? (
          <Tabs defaultValue="appearance" className="flex flex-col h-full overflow-hidden mt-2">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0 bg-muted/40 p-1 rounded-xl border border-border/50">
              <TabsTrigger value="appearance" className="gap-1.5 text-[10px] font-semibold"><Palette className="w-3.5 h-3.5" /> Apariencia</TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-[10px] font-semibold"><User className="w-3.5 h-3.5" /> Perfil</TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5 text-[10px] font-semibold"><CreditCard className="w-3.5 h-3.5" /> Cobros</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="flex-1 overflow-y-auto pt-3 space-y-4 outline-none">
              <AppearanceSettings currentTheme={currentTheme} setTheme={setTheme} themes={themes} />
            </TabsContent>

            <TabsContent value="profile" className="flex-1 overflow-y-auto pt-4 flex flex-col items-center text-center space-y-5 outline-none">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Foto de Perfil</Label>
                <p className="text-[10px] text-muted-foreground px-4">Esta foto será visible para tus alumnos vinculados.</p>
              </div>
              <ProfilePhotoUpload 
                avatarUrl={avatarUrl} 
                initials={displayName.slice(0, 2).toUpperCase() || "??"} 
                onUploaded={(url) => setAvatarUrl(url)}
              />
              <div className="w-full mt-auto pt-6">
                <Button variant="destructive" className="w-full gap-2 h-10 rounded-xl font-bold shadow-sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="billing" className="pt-3 space-y-4 outline-none">
              <BillingSettingsForm 
                initialAlias={mercadopagoAlias}
                initialWhatsapp={whatsappNumber}
                onSave={handleSaveBilling}
                saving={saving}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="appearance" className="flex flex-col h-full overflow-hidden mt-2">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-muted/40 p-1 rounded-xl border border-border/50">
              <TabsTrigger value="appearance" className="gap-1.5 text-xs font-semibold"><Palette className="w-3.5 h-3.5" /> Apariencia</TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs font-semibold"><User className="w-3.5 h-3.5" /> Perfil</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="flex-1 overflow-y-auto pt-3 space-y-4 outline-none">
              <AppearanceSettings currentTheme={currentTheme} setTheme={setTheme} themes={themes} />
            </TabsContent>

            <TabsContent value="profile" className="flex-1 overflow-y-auto pt-4 flex flex-col items-center text-center space-y-5 outline-none">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Foto de Perfil</Label>
                <p className="text-[10px] text-muted-foreground px-4">Esta foto será visible para tu entrenador y en tus avances.</p>
              </div>
              <ProfilePhotoUpload 
                avatarUrl={avatarUrl} 
                initials={displayName.slice(0, 2).toUpperCase() || "??"} 
                onUploaded={(url) => setAvatarUrl(url)}
              />
              <div className="w-full mt-auto pt-6">
                <Button variant="destructive" className="w-full gap-2 h-10 rounded-xl font-bold shadow-sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface BillingSettingsFormProps {
  initialAlias: string;
  initialWhatsapp: string;
  onSave: (alias: string, whatsapp: string) => Promise<void>;
  saving: boolean;
}

const BillingSettingsForm = memo(function BillingSettingsForm({
  initialAlias,
  initialWhatsapp,
  onSave,
  saving
}: BillingSettingsFormProps) {
  const [alias, setAlias] = useState(initialAlias);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);

  useEffect(() => {
    setAlias(initialAlias);
  }, [initialAlias]);

  useEffect(() => {
    setWhatsapp(initialWhatsapp);
  }, [initialWhatsapp]);

  const handleSubmit = () => {
    onSave(alias, whatsapp);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Alias de Mercado Pago</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
          <Input 
            placeholder="ej: mi.alias.mp" 
            value={alias} 
            onChange={(e) => setAlias(e.target.value)} 
            maxLength={100} 
            className="pl-10 h-11 text-xs border-border/50 bg-secondary/25 hover:bg-secondary/30 focus-visible:ring-primary/20"
          />
        </div>
        <p className="text-[10px] text-muted-foreground ml-0.5">Tus alumnos podrán copiar este alias para realizarte pagos.</p>
      </div>
      
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Número de WhatsApp</Label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
          <Input 
            placeholder="ej: 5491112345678" 
            value={whatsapp} 
            onChange={(e) => setWhatsapp(e.target.value)} 
            maxLength={20} 
            className="pl-10 h-11 text-xs border-border/50 bg-secondary/25 hover:bg-secondary/30 focus-visible:ring-primary/20"
          />
        </div>
        <p className="text-[10px] text-muted-foreground ml-0.5">Con código de país, sin + ni espacios. Se usará para el botón de comprobante.</p>
      </div>
      
      <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 h-11 rounded-xl font-bold shadow-sm mt-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar Configuración
      </Button>
    </div>
  );
});

const AppearanceSettings = memo(function AppearanceSettings({ currentTheme, setTheme, themes }: any) {
  const generalThemes = themes.filter((t: any) => t.category === 'general' || !t.category);
  const tematicThemes = themes.filter((t: any) => t.category === 'tematica');

  return (
    <div className="space-y-4 pb-2">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          Preferencias Visuales
        </Label>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Elige entre distintas paletas para sobrescribir los colores en toda la app. 
          El tema seleccionado se guardará en tu perfil localmente.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">General</Label>
        <div className="grid grid-cols-2 gap-2 pb-1">
          {generalThemes.map((t: any) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01]",
                currentTheme === t.id 
                  ? "border-primary bg-primary/5 shadow-sm font-bold text-primary" 
                  : "border-border/50 bg-card/60 hover:bg-muted/10 hover:border-border text-foreground"
              )}
            >
              <div 
                className="w-4.5 h-4.5 rounded-full shadow-sm flex-shrink-0 border border-black/10" 
                style={{ backgroundColor: t.isDefault ? '#4f4f4f' : t.color }}
              />
              <span className="text-xs font-semibold truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/40">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Paletas Temáticas</Label>
        <div className="grid grid-cols-2 gap-2 pb-1">
          {tematicThemes.map((t: any) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01]",
                currentTheme === t.id 
                  ? "border-primary bg-primary/5 shadow-sm font-bold text-primary" 
                  : "border-border/50 bg-card/60 hover:bg-muted/10 hover:border-border text-foreground"
              )}
            >
              <div 
                className="w-4.5 h-4.5 rounded-full shadow-sm flex-shrink-0 border border-black/10" 
                style={{ backgroundColor: t.color }}
              />
              <span className="text-xs font-semibold truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
