
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const DocumentUpload = () => {
  const { user } = useAuth();
  const { documents, loading } = useDocuments();
  const navigate = useNavigate();

  // Filtrar documentos do usuário atual
  const userDocuments = documents.filter((doc) => doc.submittedBy.id === user?.id);
  
  // Ordenar por data de envio (mais recentes primeiro)
  const sortedDocuments = [...userDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
  
  // Pegar apenas os 3 mais recentes
  const recentDocuments = sortedDocuments.slice(0, 3);
  
  // Documentos pendentes
  const pendingDocuments = userDocuments.filter((doc) => doc.status === 'pending');

  // Contar documentos por status
  const totalDocuments = userDocuments.length;
  const totalPending = pendingDocuments.length;
  const totalRevision = userDocuments.filter((doc) => doc.status === 'revision').length;
  const totalCompleted = userDocuments.filter((doc) => doc.status === 'completed' || doc.status === 'approved').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user?.name || 'Usuário'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Utilize esta página para enviar novos documentos e acompanhar suas pendências.
          </p>
        </div>
        
        {/* Cards com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border rounded-md">
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                  <p className="text-3xl font-bold">{totalDocuments}</p>
                  <p className="text-xs text-muted-foreground">Documentos registrados no sistema</p>
                </div>
                <div className="text-gray-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path d="M9 18H15M12 6V14M7 21H17C19.2091 21 21 19.2091 21 17V7C21 4.79086 19.2091 3 17 3H7C4.79086 3 3 4.79086 3 7V17C3 19.2091 4.79086 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border rounded-md">
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold">{totalPending}</p>
                  <p className="text-xs text-muted-foreground">Aguardando análise</p>
                </div>
                <div className="text-yellow-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path d="M12 9V13M12 17H12.01M6.99997 3H16.9999L20.9999 7V17C20.9999 18.1046 20.1045 19 18.9999 19H4.99997C3.89539 19 2.99997 18.1046 2.99997 17V7C2.99997 5.89543 3.89539 5 4.99997 5H6.99997V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border rounded-md">
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Em Revisão</p>
                  <p className="text-3xl font-bold">{totalRevision}</p>
                  <p className="text-xs text-muted-foreground">Precisam de ajustes</p>
                </div>
                <div className="text-orange-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border rounded-md">
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-3xl font-bold">{totalCompleted}</p>
                  <p className="text-xs text-muted-foreground">Aprovados ou concluídos</p>
                </div>
                <div className="text-green-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path d="M5 13L9 17L19 7M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna do formulário (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="pb-2 pt-2">
              <h2 className="text-xl font-bold tracking-tight">Enviar Novo Documento</h2>
              <p className="text-muted-foreground text-sm">
                Preencha o formulário abaixo para submeter um novo documento ao sistema.
              </p>
            </div>
            
            <DocumentUploadForm />
          </div>
          
          {/* Coluna dos documentos recentes (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Documentos pendentes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold tracking-tight">Documentos Pendentes</h2>
                {pendingDocuments.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground"
                    onClick={() => navigate('/documents')}
                  >
                    Ver todos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : pendingDocuments.length > 0 ? (
                <div className="space-y-3">
                  {pendingDocuments.slice(0, 2).map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      Nenhum documento pendente.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Documentos recentes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold tracking-tight">Documentos Recentes</h2>
                {recentDocuments.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground"
                    onClick={() => navigate('/documents')}
                  >
                    Ver todos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : recentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      Você ainda não enviou nenhum documento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentUpload;
