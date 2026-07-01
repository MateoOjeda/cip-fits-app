import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  trainer: "Entrenador",
  students: "Alumnos",
  routines: "Rutinas",
  plans: "Planes",
  tracking: "Seguimiento",
  notifications: "Novedades",
  groups: "Grupos",
  surveys: "Encuestas",
  student: "Alumno",
  home: "Inicio",
  feed: "Feed",
  progress: "Progreso",
  "personal-change": "Cambio Personal",
  transformation: "Transformación",
  meals: "Alimentación",
};

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  
  // Split the path and filter out empty strings
  const paths = pathname.split("/").filter(Boolean);
  
  if (paths.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider", className)}>
      <Link 
        to="/" 
        className="flex items-center gap-1 hover:text-foreground transition-colors py-1"
        aria-label="Ir al inicio"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      
      {paths.map((path, idx) => {
        const routeTo = `/${paths.slice(0, idx + 1).join("/")}`;
        const isLast = idx === paths.length - 1;
        
        // Skip IDs like user_id or group_id by checking if they look like standard hashes/ids
        const isId = path.length > 15 || /\d/.test(path);
        
        let label = ROUTE_LABELS[path] || path;
        
        if (isId) {
          label = "Detalle";
        }

        return (
          <div key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            {isLast ? (
              <span className="text-foreground/90 font-black truncate max-w-[120px]">
                {label}
              </span>
            ) : (
              <Link 
                to={routeTo} 
                className="hover:text-foreground transition-colors truncate max-w-[120px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
