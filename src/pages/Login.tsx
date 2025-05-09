import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import newLogo from "@/assets/5cpa.png"; // Novo logo
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    
    try {
      setIsLoading(true);
      const success = await login(email, password);
      
      if (success) {
        navigate("/");
      } else {
        toast({
          title: "Erro de autenticação",
          description: "E-mail ou senha incorretos.",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pmerj-blue to-pmerj-blue/90 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">          <img
            src={newLogo}
            alt="Logo 5º CPA"
            className="h-24 w-auto"
          />
          <h1 className="mt-4 text-2xl font-bold text-white font-heading">
            Sistema de Gestão Documental
          </h1>
          <p className="text-white/80">5º Comando de Policiamento de Área</p>
        </div>
        
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
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="text-sm text-pmerj-blue hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Recuperação de senha",
                        description: "Entre em contato com o administrador do sistema.",
                      });
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              
              <CardFooter className="flex justify-center px-0 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-pmerj-blue hover:bg-pmerj-blue/90"
                  disabled={isLoading}
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
