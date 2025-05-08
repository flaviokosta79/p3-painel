
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments, DocumentStatus } from "@/hooks/useDocuments";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DocumentsList = () => {
  const { user } = useAuth();
  const { documents, loading } = useDocuments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Filtrar documentos por usuário atual
  const userDocuments = documents.filter(
    (doc) => doc.submittedBy.id === user?.id
  );
  
  // Aplicar filtros
  const filteredDocuments = userDocuments.filter((doc) => {
    // Filtro de status
    if (statusFilter !== "all" && doc.status !== statusFilter) {
      return false;
    }
    
    // Filtro de pesquisa
    if (
      searchTerm &&
      !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar por data de submissão (mais recente primeiro)
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os documentos que você enviou
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/documents/upload")} 
            className="bg-pmerj-blue hover:bg-pmerj-blue/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Documento
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar documentos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="revision">Em Revisão</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">Carregando documentos...</div>
        ) : sortedDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum documento encontrado com os filtros atuais."
                  : "Você ainda não enviou nenhum documento."}
              </p>
              <Button 
                onClick={() => navigate("/documents/upload")} 
                className="bg-pmerj-blue hover:bg-pmerj-blue/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Enviar um documento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default DocumentsList;
