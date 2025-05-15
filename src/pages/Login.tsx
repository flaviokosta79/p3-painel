
import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import newLogo from "@/assets/5cpa.png"; // Novo logo
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { login, checkConnection, connectionStatus } = useAuth();
  const navigate = useNavigate();

  // Check connection on component mount
  useEffect(() => {
    const verifyConnection = async () => {
      await checkConnection();
      if (!connectionStatus.connected && connectionStatus.error) {
        setConnectionError(connectionStatus.error);
      } else {
        setConnectionError(null);
      }
    };
    
    verifyConnection();
  }, [checkConnection, connectionStatus.connected, connectionStatus.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    // Check connection before trying to login
    await checkConnection();
    if (!connectionStatus.connected) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      setConnectionError(connectionStatus.error || "Erro de conexão desconhecido.");
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await login({ email, password });
      
      if (!result.error && result.user) {
        navigate("/");
      } else {
        const errorMessage = result.error?.message || "E-mail ou senha incorretos.";
        toast({
          title: "Erro de autenticação",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = async () => {
    setConnectionError(null);
    await checkConnection();
    if (!connectionStatus.connected && connectionStatus.error) {
      setConnectionError(connectionStatus.error);
      toast({
        title: "Problema persistente",
        description: "Ainda não foi possível conectar ao servidor. Verifique suas variáveis de ambiente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conexão restabelecida",
        description: "A conexão com o servidor foi restabelecida com sucesso.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pmerj-blue to-pmerj-blue/90 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">          
          <img
            src={newLogo}
            alt="Logo 5º CPA"
            className="h-24 w-auto"
          />
          <h1 className="mt-4 text-2xl font-bold text-white font-heading">
            Sistema de Gestão Documental
          </h1>
          <p className="text-white/80">5º Comando de Policiamento de Área</p>
        </div>
        
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de conexão com Supabase</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{connectionError}</p>
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
                onClick={retryConnection}
              >
                <Wifi className="mr-2 h-4 w-4" /> Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Acesse o sistema com suas credenciais
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@pmerj.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={!!connectionError}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    className="text-sm text-pmerj-blue hover:underline focus:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Recuperação de senha",
                        description: "Entre em contato com o administrador do sistema.",
                      });
                    }}
                    disabled={!!connectionError}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={!!connectionError}
                />
              </div>
              
              <CardFooter className="flex justify-center px-0 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-pmerj-blue hover:bg-pmerj-blue/90"
                  disabled={isLoading || !!connectionError}
                >
                  {isLoading ? "Autenticando..." : "Entrar"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-white/80">
          <p>Dificuldades para acessar? Entre em contato com o suporte técnico.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
