
import { type ReactNode, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Use refs to track if notifications have been shown
  const authNotificationShown = useRef(false);
  const roleNotificationShown = useRef(false);
  
  useEffect(() => {
    // Only show notifications once per mount and only after auth check is complete
    if (!isLoading) {
      // Handle auth notification
      if (!isAuthenticated && !authNotificationShown.current) {
        authNotificationShown.current = true;
        
        // Show notification after a small delay to avoid React warnings
        setTimeout(() => {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
        }, 0);
      }
      
      // Handle role notification
      if (isAuthenticated && requiredRole && user?.role !== requiredRole && 
          requiredRole === "admin" && !roleNotificationShown.current) {
        roleNotificationShown.current = true;
        
        // Show notification after a small delay to avoid React warnings
        setTimeout(() => {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta página.",
            variant: "destructive",
          });
        }, 0);
      }
    }
  }, [isLoading, isAuthenticated, user?.role, requiredRole]);
  
  // Mostrar estado de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-pmerj-blue mb-4" />
        <p className="text-lg">Verificando autenticação...</p>
      </div>
    );
  }
  
  // Handle redirects based on authentication status
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Handle redirects based on required roles
  if (requiredRole && user?.role !== requiredRole && requiredRole === "admin") {
    return <Navigate to="/" replace />;
  }
  
  // All conditions passed, render children
  return <>{children}</>;
}
