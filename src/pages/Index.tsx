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
  
  // Filtrar documentos para usuários normais e admin
  const getUserDocuments = () => {
    if (isAdmin) {
      return documents;
    } else {
      return documents.filter((doc) => doc.submittedBy.id === user?.id);
    }
  };
  
  const userDocs = getUserDocuments();
  
  // Documentos pendentes
  const pendingDocuments = userDocs
    .filter(doc => doc.status === "pending")
    .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 3);
    
  // Documentos em revisão
  const revisionDocuments = userDocs
    .filter(doc => doc.status === "revision")
    .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">
                Total de Documentos
              </CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Pendentes</CardTitle>
              <FileClock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Concluídos</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">
                {stats.approved + stats.completed}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Documentos Pendentes</h2>
            {pendingDocuments.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {pendingDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="p-2 text-center">
                <p className="text-muted-foreground mb-2">
                  Nenhum documento pendente
                </p>
              </Card>
            )}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Documentos Pendentes</h2>
            {pendingDocuments.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {pendingDocuments.map((doc) => (
                  <DocumentCard key={`${doc.id}-clone`} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="p-2 text-center">
                <p className="text-muted-foreground mb-2">
                  Nenhum documento pendente
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-4">
              <Card className="transition-colors hover:bg-muted/50">
                <Link to="/documents/new" className="block p-3">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Enviar Documento</CardTitle>
                    </div>
                  </div>
                </Link>
              </Card>
              <Card className="transition-colors hover:bg-muted/50">
                <Link to="/documents" className="block p-3">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Meus Documentos</CardTitle>
                    </div>
                  </div>
                </Link>
              </Card>
              {isAdmin && (
                <Card className="transition-colors hover:bg-muted/50">
                  <Link to="/admin/users" className="block p-3">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Usuários</CardTitle>
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
