
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { File, FileCheck, FilePenLine, FileClock, Upload, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const { documents, loading } = useDocuments();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === "admin";
  
  // Estatísticas para o dashboard
  const getStats = () => {
    // Para administradores, mostra estatísticas de todos os documentos
    // Para usuários comuns, mostra apenas os seus documentos
    const filteredDocs = isAdmin
      ? documents
      : documents.filter((doc) => doc.submittedBy.id === user?.id);
    
    return {
      total: filteredDocs.length,
      pending: filteredDocs.filter((doc) => doc.status === "pending").length,
      approved: filteredDocs.filter((doc) => doc.status === "approved").length,
      revision: filteredDocs.filter((doc) => doc.status === "revision").length,
      completed: filteredDocs.filter((doc) => doc.status === "completed").length,
    };
  };
  
  const stats = getStats();
  
  // Documentos recentes (últimos 3)
  const getRecentDocuments = () => {
    const filteredDocs = isAdmin
      ? documents
      : documents.filter((doc) => doc.submittedBy.id === user?.id);
    
    return filteredDocs
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 3);
  };
  
  const recentDocuments = getRecentDocuments();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Sistema de Gestão Documental do 5º CPA
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Documentos
              </CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Documentos registrados no sistema
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <FileClock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando análise
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
              <FilePenLine className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revision}</div>
              <p className="text-xs text-muted-foreground">
                Precisam de ajustes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.approved + stats.completed}
              </div>
              <p className="text-xs text-muted-foreground">
                Aprovados ou concluídos
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Documentos Recentes</h2>
              <Button 
                variant="outline" 
                onClick={() => isAdmin ? navigate("/admin/documents") : navigate("/documents")}
              >
                Ver todos
              </Button>
            </div>
            
            {loading ? (
              <div className="py-8 text-center">Carregando documentos...</div>
            ) : recentDocuments.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recentDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Nenhum documento encontrado
                </p>
                <Button 
                  onClick={() => navigate("/documents/upload")} 
                  className="bg-pmerj-blue hover:bg-pmerj-blue/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar um documento
                </Button>
              </Card>
            )}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-4">
              <Card className="transition-colors hover:bg-muted/50">
                <Link to="/documents/upload" className="block p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Enviar Documento</CardTitle>
                      <CardDescription>
                        Faça upload de novos documentos
                      </CardDescription>
                    </div>
                  </div>
                </Link>
              </Card>
              
              <Card className="transition-colors hover:bg-muted/50">
                <Link to="/documents" className="block p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Meus Documentos</CardTitle>
                      <CardDescription>
                        Visualize seus documentos enviados
                      </CardDescription>
                    </div>
                  </div>
                </Link>
              </Card>
              
              {isAdmin && (
                <Card className="transition-colors hover:bg-muted/50">
                  <Link to="/admin/users" className="block p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
                        <CardDescription>
                          Adicione e edite usuários do sistema
                        </CardDescription>
                      </div>
                    </div>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
