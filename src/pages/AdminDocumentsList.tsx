
import { useState } from "react";
import { useDocuments, DocumentStatus } from "@/hooks/useDocuments";
import { useUsers } from "@/hooks/useUsers";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search } from "lucide-react";

const AdminDocumentsList = () => {
  const { documents, loading } = useDocuments();
  const { getUnits } = useUsers();
  const units = getUnits();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Aplicar filtros
  const filteredDocuments = documents.filter((doc) => {
    // Filtro de unidade
    if (unitFilter !== "all" && doc.unitId !== unitFilter) {
      return false;
    }
    
    // Filtro de status
    if (statusFilter !== "all" && doc.status !== statusFilter) {
      return false;
    }
    
    // Filtro de data
    if (dateFilter !== "all") {
      const today = new Date();
      const docDate = new Date(doc.submissionDate);
      
      switch (dateFilter) {
        case "today":
          // Apenas documentos de hoje
          return (
            docDate.getDate() === today.getDate() &&
            docDate.getMonth() === today.getMonth() &&
            docDate.getFullYear() === today.getFullYear()
          );
        case "thisWeek": {
          // Documentos desta semana
          const firstDay = new Date(today);
          firstDay.setDate(today.getDate() - today.getDay()); // Início da semana (domingo)
          return docDate >= firstDay;
        }
        case "thisMonth": {
          // Documentos deste mês
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          return docDate >= firstDay;
        }
        default:
          return true;
      }
    }
    
    // Filtro de pesquisa
    if (
      searchTerm &&
      !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !doc.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar por data de submissão (mais recente primeiro)
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
  
  // Exportar para CSV (funcionalidade simulada)
  const exportToCSV = () => {
    // Esta é uma simulação, em um sistema real exportaríamos dados para CSV
    const filename = `documentos-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Em um sistema real, construiríamos o CSV com os dados filtrados
    const csvData = [
      ["ID", "Título", "Unidade", "Status", "Data de Submissão", "Enviado por"],
      ...sortedDocuments.map((doc) => [
        doc.id,
        doc.title,
        doc.unitName,
        doc.status,
        new Date(doc.submissionDate).toLocaleDateString("pt-BR"),
        doc.submittedBy.name,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    
    // Criar um blob e fazer download
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os documentos do sistema
            </p>
          </div>
          
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
        </div>
        
        <div className="space-y-4">
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
            
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs 
              defaultValue="all" 
              className="w-full" 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="revision">Em Revisão</TabsTrigger>
                <TabsTrigger value="approved">Aprovados</TabsTrigger>
                <TabsTrigger value="completed">Concluídos</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="thisWeek">Esta Semana</SelectItem>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || unitFilter !== "all" || dateFilter !== "all"
                  ? "Nenhum documento encontrado com os filtros atuais."
                  : "Não há documentos no sistema."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDocumentsList;
