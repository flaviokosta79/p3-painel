import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentStatus } from "@/hooks/useDocuments";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentActionsRow } from "@/components/documents/DocumentActionsRow"; // Adicionar importação
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const { mappedUser: user } = useAuth();
  const { documents, loading } = useDocuments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Funções auxiliares para formatação e visualização
  const getStatusColor = (status: DocumentStatus): string => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "revision": return "bg-orange-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };
  
  const getStatusText = (status: DocumentStatus): string => {
    switch (status) {
      case "pending": return "Pendente";
      case "approved": return "Aprovado";
      case "revision": return "Em Revisão";
      case "completed": return "Concluído";
      default: return "Desconhecido";
    }
  };
    const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Filtrar documentos por usuário atual
  const userDocuments = documents.filter(
    (doc) => doc.submittedBy && typeof doc.submittedBy.id === 'string' && user && doc.submittedBy.id === user.id
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
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">Carregando documentos...</div>
        ) : sortedDocuments.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Meus documentos</CardTitle>
              <CardDescription>Lista de todos os seus documentos submetidos ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="font-medium">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">{doc.description}</div>
                          )}
                        </TableCell>
                        <TableCell>{doc.unitName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status).replace('bg-', 'bg-opacity-80 text-white bg-')}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.submissionDate)}</TableCell>
                        <TableCell className="text-right">
                          <DocumentActionsRow document={doc} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
