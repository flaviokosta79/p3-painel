
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserForm } from "@/components/users/UserForm";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminEditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getUserById } = useUsers();
  
  const user = getUserById(id || "");
  
  if (!user) {
    return (
      <MainLayout>
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Usuário não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O usuário que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
            <p className="text-muted-foreground">
              Atualize as informações do usuário
            </p>
          </div>
        </div>
        
        <UserForm user={user} isEditing={true} />
      </div>
    </MainLayout>
  );
};

export default AdminEditUser;
