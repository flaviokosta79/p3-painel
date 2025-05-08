
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers, UserData } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface UserFormProps {
  user?: UserData;
  isEditing?: boolean;
}

export function UserForm({ user, isEditing = false }: UserFormProps) {
  const { addUser, updateUser, getUnits } = useUsers();
  const navigate = useNavigate();
  const units = getUnits();
  
  // Estados do formulário
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<UserRole>(user?.role || "user");
  const [unitId, setUnitId] = useState(user?.unit.id || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Gerar senha temporária para novos usuários
  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-8);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !role || !unitId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Validação simples de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, forneça um endereço de e-mail válido.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const selectedUnit = units.find((u) => u.id === unitId);
      
      if (!selectedUnit) {
        toast({
          title: "Erro",
          description: "Unidade não encontrada.",
          variant: "destructive",
        });
        return;
      }
      
      let success = false;
      
      if (isEditing && user) {
        // Atualizar usuário existente
        success = await updateUser(user.id, {
          name,
          email,
          role,
          unit: selectedUnit,
        });
      } else {
        // Criar novo usuário
        success = await addUser({
          name,
          email,
          role,
          unit: selectedUnit,
          active: true,
        });
        
        // Em um sistema real, enviaríamos uma senha temporária ao usuário por email
        if (success) {
          const tempPassword = generateTemporaryPassword();
          console.log(`Senha temporária gerada para ${email}: ${tempPassword}`);
          toast({
            title: "Senha temporária gerada",
            description: `Uma senha temporária foi gerada e seria enviada para o e-mail do usuário em um sistema real.`,
          });
        }
      }
      
      if (success) {
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Erro ao processar usuário:", error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar os dados do usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Atualize as informações do usuário abaixo."
            : "Preencha o formulário abaixo para adicionar um novo usuário."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome completo do usuário"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail Institucional *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@pmerj.gov.br"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <CardFooter className="flex justify-between px-0 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-pmerj-blue text-white hover:bg-pmerj-blue/90"
              disabled={isLoading}
            >
              {isLoading 
                ? (isEditing ? "Atualizando..." : "Criando...") 
                : (isEditing ? "Atualizar Usuário" : "Criar Usuário")
              }
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
