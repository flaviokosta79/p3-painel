
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole.ADMIN | UserRole.USUARIO;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { userProfile, isAuthenticated, isLoading, connectionStatus, checkConnection } = useAuth();
  
  // Effect for not authenticated toast
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated]);

  // Effect for role permission denied toast
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && userProfile?.perfil !== requiredRole) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, requiredRole, userProfile?.perfil]);

  // Show error screen if no connection to Supabase
  if (!connectionStatus.connected && connectionStatus.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <WifiOff className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro de conexão</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível conectar ao servidor Supabase. Verifique sua conexão e as variáveis de ambiente.
          </p>
          <p className="text-sm bg-destructive/10 p-3 rounded mb-4 text-destructive">
            {connectionStatus.error}
          </p>
          <Button 
            onClick={() => checkConnection()} 
            variant="outline"
            className="w-full mb-2"
          >
            Tentar novamente
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = "/login"}
            className="w-full"
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  // Show a loader while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (requiredRole && userProfile?.perfil !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
