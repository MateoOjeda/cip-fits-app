import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  orderBy, 
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, ImageIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface Transformation {
  id: string;
  before_photo_url: string | null;
  before_weight: number | null;
  before_date: string | null;
  after_photo_url: string | null;
  after_weight: number | null;
  after_date: string | null;
}

export default function TransformationPage() {
  const { user } = useAuth();
  const [transformation, setTransformation] = useState<Transformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [beforeWeight, setBeforeWeight] = useState("");
  const [afterWeight, setAfterWeight] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const q = query(
        collection(db, "body_transformations"),
        where("student_id", "==", user.uid),
        orderBy("created_at", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Transformation;
        setTransformation(data);
        if (data.before_weight) setBeforeWeight(String(data.before_weight));
        if (data.after_weight) setAfterWeight(String(data.after_weight));
      }
    } catch (err) {
      console.error("Error fetching transformation:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uploadPhoto = async (type: "before" | "after", file: File) => {
    if (!user) return;
    setUploading(type);

    try {
      const ext = file.name.split(".").pop();
      const path = `transformations/${user.uid}/${type}-${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      
      const uploadRes = await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(uploadRes.ref);
      
      const weight = type === "before" ? parseFloat(beforeWeight) || null : parseFloat(afterWeight) || null;
      const now = new Date().toISOString();

      if (transformation) {
        const updateData: any = {
          [`${type}_photo_url`]: photoUrl,
          [`${type}_weight`]: weight,
          [`${type}_date`]: now,
          updated_at: now
        };
        await updateDoc(doc(db, "body_transformations", transformation.id), updateData);
      } else {
        const insertData: any = {
          student_id: user.uid,
          [`${type}_photo_url`]: photoUrl,
          [`${type}_weight`]: weight,
          [`${type}_date`]: now,
          created_at: now,
          updated_at: now
        };
        await addDoc(collection(db, "body_transformations"), insertData);
      }

      // Notify linked trainers
      const qLinks = query(collection(db, "trainer_students"), where("student_id", "==", user.uid));
      const snapLinks = await getDocs(qLinks);

      if (!snapLinks.empty) {
        for (const linkDoc of snapLinks.docs) {
          const link = linkDoc.data();
          await addDoc(collection(db, "notifications"), {
            user_id: link.trainer_id,
            type: "transformation",
            title: "Foto de progreso actualizada",
            message: `Un alumno ha subido su foto "${type === "before" ? "Antes" : "Después"}"`,
            related_id: user.uid,
            created_at: now,
            read: false
          });
        }
      }

      toast.success("Foto guardada correctamente");
      fetchData();
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (type: "before" | "after") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar 5MB");
        return;
      }
      uploadPhoto(type, file);
    }
  };

  const saveWeight = async (type: "before" | "after") => {
    if (!transformation) return;
    try {
      const weight = type === "before" ? parseFloat(beforeWeight) : parseFloat(afterWeight);
      if (isNaN(weight)) return;
      
      await updateDoc(doc(db, "body_transformations", transformation.id), { 
        [`${type}_weight`]: weight,
        updated_at: new Date().toISOString()
      });
      toast.success("Peso actualizado");
    } catch (err) {
      console.error("Error saving weight:", err);
      toast.error("Error al guardar el peso");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-24 space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded-lg" />
        </div>
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  const formatDate = (d: string | null) => d ? format(new Date(d), "dd MMM yyyy", { locale: es }) : "—";

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi Transformación</h1>
          <p className="text-sm text-muted-foreground mt-1">Sube tus fotos de progreso para comparar tu antes y después</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full w-fit">
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Evolución</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before */}
        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 p-4 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" /> Antes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="aspect-[3/4] rounded-xl bg-muted/40 border border-border/40 overflow-hidden flex items-center justify-center relative">
              {transformation?.before_photo_url ? (
                <img src={transformation.before_photo_url} alt="Antes" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                   <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                   <p className="text-xs font-medium">Sin foto cargada</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Peso (kg)</Label>
                <div className="flex gap-1.5 mt-1">
                   <Input
                     type="number"
                     step="0.1"
                     value={beforeWeight}
                     onChange={(e) => setBeforeWeight(e.target.value)}
                     placeholder="Peso"
                     className="bg-muted/30 border-border/60 h-8 text-xs font-semibold rounded-lg focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                   />
                   {transformation && (
                     <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => saveWeight("before")}>
                       OK
                     </Button>
                   )}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground text-right pt-4">
                 {formatDate(transformation?.before_date || null)}
              </div>
            </div>
            <label className="block">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange("before")} />
              <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold" asChild disabled={uploading === "before"}>
                <span className="cursor-pointer">
                   {uploading === "before" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                   {transformation?.before_photo_url ? "Cambiar foto" : "Subir foto Antes"}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* After */}
        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 p-4 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" /> Después
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="aspect-[3/4] rounded-xl bg-muted/40 border border-border/40 overflow-hidden flex items-center justify-center relative">
              {transformation?.after_photo_url ? (
                <img src={transformation.after_photo_url} alt="Después" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                   <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                   <p className="text-xs font-medium">Sin foto cargada</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Peso (kg)</Label>
                <div className="flex gap-1.5 mt-1">
                   <Input
                     type="number"
                     step="0.1"
                     value={afterWeight}
                     onChange={(e) => setAfterWeight(e.target.value)}
                     placeholder="Peso"
                     className="bg-muted/30 border-border/60 h-8 text-xs font-semibold rounded-lg focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                   />
                   {transformation && (
                     <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => saveWeight("after")}>
                       OK
                     </Button>
                   )}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground text-right pt-4">
                 {formatDate(transformation?.after_date || null)}
              </div>
            </div>
            <label className="block">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange("after")} />
              <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold" asChild disabled={uploading === "after"}>
                <span className="cursor-pointer">
                   {uploading === "after" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                   {transformation?.after_photo_url ? "Cambiar foto" : "Subir foto Después"}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      {transformation?.before_photo_url && transformation?.after_photo_url && (
        <Card className="border border-border/50 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-6">
              <div className="text-right">
                 <p className="text-xl font-bold text-foreground">{transformation.before_weight || "—"} kg</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{formatDate(transformation.before_date)}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary animate-pulse" />
              <div className="text-left">
                 <p className="text-xl font-bold text-primary">{transformation.after_weight || "—"} kg</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{formatDate(transformation.after_date)}</p>
              </div>
            </div>
            {transformation.before_weight && transformation.after_weight && (
              <p className="text-xs text-muted-foreground mt-4 font-medium">
                 Diferencia: <span className="font-bold text-primary">
                   {(transformation.after_weight - transformation.before_weight).toFixed(1)} kg
                 </span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
