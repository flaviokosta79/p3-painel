import { MainLayout } from "@/components/layout/MainLayout";

const AdminConfiguracoes = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Administrador</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais do sistema.
          </p>
        </div>
        {/* Conteúdo da página de configurações aqui */}
        <p>Página de configurações em construção.</p>
      </div>
    </MainLayout>
  );
};

export default AdminConfiguracoes;
