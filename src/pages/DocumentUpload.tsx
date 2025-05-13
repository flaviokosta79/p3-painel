
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FilePlus2 } from "lucide-react";

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
  
  // Documentos pendentes ou em revisão
  const pendingDocuments = userDocuments.filter((doc) => 
    doc.status === 'pending' || doc.status === 'revision'
  );
  
  // Documentos concluídos
  const completedDocuments = userDocuments.filter((doc) => doc.status === 'completed' || doc.status === 'approved');
  
  // Mostrar até 6 documentos pendentes/revisão mais recentes
  const sortedPendingDocuments = [...pendingDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  ).slice(0, 6);
  
  // Mostrar até 3 documentos concluídos mais recentes
  const sortedCompletedDocuments = [...completedDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  ).slice(0, 3);

  // Contar documentos por status
  const totalDocuments = userDocuments.length;
  const totalPending = pendingDocuments.length;
  const totalCompleted = completedDocuments.length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="pb-2 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {user?.name || 'Usuário'}
            </h1>
            <p className="text-muted-foreground text-sm">
              Utilize esta página para acompanhar suas pendências.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/documents/new')} 
            className="bg-pmerj-blue hover:bg-pmerj-blue/90"
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Enviar Novo Documento
          </Button>
        </div>
        
        {/* Cards com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border rounded-md">
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                  <p className="text-3xl font-bold">{totalDocuments}</p>
                  <p className="text-xs text-muted-foreground">Documentos registrados no sistema</p>
                </div>                
                <div className="text-gray-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
                    <title>Documentos</title>
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
                  <p className="text-xs text-muted-foreground">Aguardando análise ou revisão</p>
                </div>                
                <div className="text-yellow-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
                    <title>Pendentes</title>
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
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-3xl font-bold">{totalCompleted}</p>
                  <p className="text-xs text-muted-foreground">Aprovados ou concluídos</p>
                </div>                
                <div className="text-green-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
                    <title>Concluídos</title>
                    <path d="M5 13L9 17L19 7M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna dos documentos pendentes e em revisão (1/2) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-tight">Documentos Pendentes e em Revisão</h2>
              {sortedPendingDocuments.length > 0 && (
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
            ) : sortedPendingDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedPendingDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum documento pendente ou em revisão.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Coluna dos documentos concluídos (1/2) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-tight">Documentos Concluídos</h2>
              {sortedCompletedDocuments.length > 0 && (
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
            ) : sortedCompletedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedCompletedDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Você ainda não possui documentos concluídos.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentUpload;
