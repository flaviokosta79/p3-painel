import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react"; // Importamos o ícone de carregamento

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole.ADMIN | UserRole.USUARIO;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { userProfile, isAuthenticated, isLoading } = useAuth();
  
  // Efeito para o toast de não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated]);

  // Efeito para o toast de permissão negada por papel (role)
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && userProfile?.perfil !== requiredRole) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, requiredRole, userProfile?.perfil]);

  // Mostrar um loader enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }
  
  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar se o usuário tem o papel necessário
  if (requiredRole && userProfile?.perfil !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
