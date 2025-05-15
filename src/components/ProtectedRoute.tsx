
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2, WifiOff } from "lucide-react"; // Importamos o ícone de carregamento
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole.ADMIN | UserRole.USUARIO;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { userProfile, isAuthenticated, isLoading, connectionStatus, checkConnection } = useAuth();
  
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

  // Mostrar tela de erro se não houver conexão com o Supabase
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
          >
            Tentar novamente
          </Button>
          <div className="mt-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "/login"}
            >
              Voltar para o login
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
