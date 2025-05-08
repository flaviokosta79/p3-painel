
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    toast({
      title: "Acesso negado",
      description: "Você precisa estar logado para acessar esta página.",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  // Verificar se o usuário tem o papel necessário
  if (requiredRole && user?.role !== requiredRole && requiredRole === "admin") {
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
