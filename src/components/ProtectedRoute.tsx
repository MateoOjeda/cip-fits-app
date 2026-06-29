import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "trainer" | "student";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Si está cargando auth, o si ya tenemos usuario pero todavía no sabemos su rol
  // y la ruta actual requiere un rol para decidir el acceso, esperamos en estado de carga.
  if (loading || (user && !role && requiredRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Sin usuario autenticado, lo enviamos al login.
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si la ruta pide un rol explícito y el rol del usuario no coincide
  if (requiredRole && role !== requiredRole) {
    // Verificamos explícitamente el rol resuelto y lo mandamos a su ruta base.
    // Si role es null/desconocido (improbable aquí por el chequeo superior), va al index.
    if (role === "trainer") {
      return <Navigate to="/trainer/students" replace />;
    }
    if (role === "student") {
      return <Navigate to="/student/home" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
