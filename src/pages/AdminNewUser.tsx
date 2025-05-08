
import { MainLayout } from "@/components/layout/MainLayout";
import { UserForm } from "@/components/users/UserForm";

const AdminNewUser = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
          <p className="text-muted-foreground">
            Adicione um novo usuário ao sistema
          </p>
        </div>
        
        <UserForm />
      </div>
    </MainLayout>
  );
};

export default AdminNewUser;
