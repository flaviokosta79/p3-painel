import { useState, type FormEvent, useEffect } from "react";
import { useDocuments, type DocumentStatus } from "@/hooks/useDocuments";
import { useUsers, type Unit } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth"; 
import { useDocumentRequirementsContext } from "@/hooks/DocumentRequirementsProvider";
import type { NewDocumentRequirement, DocumentRequirement } from "@/hooks/useDocumentRequirements";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentCard } from "@/components/documents/DocumentCard"; 
import { DocumentActionsRow } from "@/components/documents/DocumentActionsRow"; 
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Plus, Trash2, CalendarIcon, FilePlus2 } from "lucide-react"; 
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { Calendar } from "@/components/ui/calendar"; 
import { format } from "date-fns"; 
import { ptBR } from "date-fns/locale"; 
import { cn } from "@/lib/utils"; 
import { Badge } from "@/components/ui/badge";

const AdminDocumentsList = () => {
  const { documents, loading: loadingDocuments, addDocument } = useDocuments(); 
  const { getUnits, users } = useUsers(); 
  
  // Garantir que estamos usando as unidades corretas
  useEffect(() => {
    // Atualizar o localStorage com as unidades corretas ao carregar a página
    const correctUnits = [
      { id: '1', name: '10º BPM' },
      { id: '2', name: '28º BPM' },
      { id: '3', name: '33º BPM' },
      { id: '4', name: '37º BPM' },
      { id: '5', name: '2ª CIPM' },
    ];
    localStorage.setItem('pmerj_units', JSON.stringify(correctUnits));
  }, []);
  
  const units = getUnits();
  const { toast } = useToast();
  const { user: adminUser } = useAuth(); 

  // Correção das unidades no localStorage
  useEffect(() => {
    // Configurar as unidades corretas
    const correctUnits = [
      { id: '1', name: '10º BPM' },
      { id: '2', name: '28º BPM' },
      { id: '3', name: '33º BPM' },
      { id: '4', name: '37º BPM' },
      { id: '5', name: '2ª CIPM' },
    ];
    // Atualiza o localStorage com as unidades corretas
    localStorage.setItem('pmerj_units', JSON.stringify(correctUnits));
  }, []);

  const {
    documentRequirements,
    loading: loadingRequirements,
    addDocumentRequirement,
    deleteDocumentRequirement,
  } = useDocumentRequirementsContext();
  
  const [isSubmitDocumentDialogOpen, setIsSubmitDocumentDialogOpen] = useState(false);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<string>("");
  const [docDate, setDocDate] = useState<Date | undefined>();
  const [targetUnitId, setTargetUnitId] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Estados para criar novo tipo de documento
  const [isCreatingNewType, setIsCreatingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  
  // Estado para controlar se o documento será enviado para todas as unidades
  const [sendToAllUnits, setSendToAllUnits] = useState(false); 

  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
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
  
  const filteredDocuments = documents.filter((doc) => {
    if (unitFilter !== "all" && doc.unitId !== unitFilter) {
      return false;
    }
    
    if (statusFilter !== "all" && doc.status !== statusFilter) {
      return false;
    }
    
    if (dateFilter !== "all") {
      const today = new Date();
      const docDate = new Date(doc.submissionDate);
      
      switch (dateFilter) {
        case "today":
          return (
            docDate.getDate() === today.getDate() &&
            docDate.getMonth() === today.getMonth() &&
            docDate.getFullYear() === today.getFullYear()
          );
        case "thisWeek": {
          const firstDay = new Date(today);
          firstDay.setDate(today.getDate() - today.getDay()); 
          return docDate >= firstDay;
        }
        case "thisMonth": {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          return docDate >= firstDay;
        }
        default:
          return true;
      }
    }
    
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
  
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
  
  const exportToCSV = () => {
    const filename = `documentos-${new Date().toISOString().split('T')[0]}.csv`;
    
    const csvData = [
      ["ID", "Título", "Unidade", "Status", "Data de Submissão", "Enviado por"],
      ...sortedDocuments.map((doc) => [
        doc.id,
        doc.title,
        doc.unitName,
        doc.status,
        new Date(doc.submissionDate).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }),
        doc.submittedBy.name,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    
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

  // Função para criar novo tipo de documento
  const handleCreateNewDocumentType = async () => {
    if (!newTypeName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do tipo de documento é obrigatório.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const newType = await addDocumentRequirement({
        name: newTypeName.trim(),
        description: newTypeDescription.trim() || "Sem descrição"
      });
      
      toast({
        title: "Sucesso",
        description: `Tipo de documento "${newTypeName}" criado com sucesso.`
      });
      
      // Selecionar o novo tipo criado
      setSelectedDocumentTypeId(newType.id);
      
      // Limpar campos e voltar para o modo de seleção
      setNewTypeName("");
      setNewTypeDescription("");
      setIsCreatingNewType(false);
      
      return true;
    } catch (error) {
      console.error("Erro ao criar tipo de documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o tipo de documento.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSubmitDocumentAdmin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!adminUser) {
      toast({ title: "Erro", description: "Usuário administrador não encontrado.", variant: "destructive" });
      return;
    }
    
    // Se estiver criando um novo tipo, criar primeiro
    if (isCreatingNewType) {
      const success = await handleCreateNewDocumentType();
      if (!success) return;
    }

    if (!selectedDocumentTypeId || (!targetUnitId && !sendToAllUnits)) {
      setSubmitError("Todos os campos marcados com * são obrigatórios.");
      toast({ title: "Erro de Validação", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const requirement = documentRequirements.find(r => r.id === selectedDocumentTypeId);
    if (!requirement) {
      toast({ title: "Erro", description: "Tipo de documento inválido.", variant: "destructive" });
      return;
    }
    
    // Se for para todas as unidades, criar um documento para cada unidade
    if (sendToAllUnits) {
      let allSuccess = true;
      
      for (const unit of units) {
        const success = await createDocumentForUnit(unit, requirement);
        if (!success) allSuccess = false;
      }
      
      if (allSuccess) {
        toast({
          title: "Documentos criados",
          description: "Documentos criados com sucesso para todas as unidades."
        });
        resetForm();
        setIsSubmitDocumentDialogOpen(false);
      } else {
        toast({
          title: "Atenção",
          description: "Alguns documentos podem não ter sido criados corretamente.",
          variant: "destructive"
        });
      }
      
      return;
    }

    const targetUnit = units.find(u => u.id === targetUnitId);
    if (!targetUnit) {
      toast({ title: "Erro", description: "Unidade de destino inválida.", variant: "destructive" });
      return;
    }
    
    const success = await createDocumentForUnit(targetUnit, requirement);
    
    if (success) {
      resetForm();
      setIsSubmitDocumentDialogOpen(false);
    }
  };
  
  // Função auxiliar para criar um documento para uma unidade específica
  // Definindo um tipo para os dados do novo documento
  interface NewDocumentData {
    title: string;
    unitId: string;
    unitName: string;
    documentDate: string;
    deadline?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }

  const createDocumentForUnit = async (unit: Unit, requirement: DocumentRequirement) => {
    try {
      // Dados básicos do documento
      const newDocData: NewDocumentData = {
        title: requirement.name, 
        unitId: unit.id,
        unitName: unit.name,
        documentDate: new Date().toISOString().split('T')[0],
        deadline: deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : undefined,
        fileName: selectedFile ? selectedFile.name : "", 
        fileType: selectedFile ? selectedFile.type : "", 
        fileSize: selectedFile ? selectedFile.size : 0,   
        fileUrl: selectedFile ? `/documents/admin_uploads/${selectedFile.name}` : "", 
      };
      
      const success = await addDocument(newDocData);
      
      if (success) {
        toast({ 
          title: "Sucesso!", 
          description: `Documento "${newDocData.title}" criado para ${unit.name}.` 
        });
        return true;
      }
      toast({ 
        title: "Erro", 
        description: `Não foi possível criar o documento para ${unit.name}.`, 
        variant: "destructive" 
      });
      return false;
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      toast({ 
        title: "Erro Inesperado", 
        description: `Erro ao criar documento para ${unit.name}.`, 
        variant: "destructive" 
      });
      return false;
    }
  };
  
  // Função para resetar o formulário
  const resetForm = () => {
    setSelectedDocumentTypeId("");
    setDocDate(undefined);
    setTargetUnitId("");
    setDeadlineDate(undefined);
    setSelectedFile(null);
    setSendToAllUnits(false);
    setIsCreatingNewType(false);
    setNewTypeName("");
    setNewTypeDescription("");
    const fileInput = document.getElementById('admin-doc-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = ""; 
  };
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie documentos no sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={isSubmitDocumentDialogOpen} onOpenChange={setIsSubmitDocumentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-pmerj-blue hover:bg-pmerj-blue/90">
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Criar novo documento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Criar novo documento</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes abaixo e selecione o arquivo para submissão.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitDocumentAdmin} className="grid gap-4 py-4">
                  {/* Tipo de Documento */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="documentTypeId">Tipo de Documento*</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsCreatingNewType(!isCreatingNewType)}
                        className="text-xs h-7"
                      >
                        {isCreatingNewType ? "Selecionar existente" : "Criar novo tipo"}
                      </Button>
                    </div>
                    
                    {isCreatingNewType ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Nome do novo tipo de documento"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          required
                        />
                        <Textarea
                          placeholder="Descrição do tipo de documento (opcional)"
                          value={newTypeDescription}
                          onChange={(e) => setNewTypeDescription(e.target.value)}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <Select onValueChange={setSelectedDocumentTypeId} value={selectedDocumentTypeId}>
                        <SelectTrigger id="documentTypeId">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentRequirements.map((req) => (
                            <SelectItem key={req.id} value={req.id}>{req.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="docDate">Data do Documento*</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="docDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !docDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {docDate ? format(docDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={docDate}
                          onSelect={setDocDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="targetUnitId">Unidade de Destino*</Label>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="sendToAllUnits"
                        checked={sendToAllUnits}
                        onChange={(e) => {
                          setSendToAllUnits(e.target.checked);
                          if (e.target.checked) {
                            setTargetUnitId("");
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-pmerj-blue focus:ring-pmerj-blue"
                      />
                      <Label htmlFor="sendToAllUnits" className="text-sm font-normal cursor-pointer">
                        Enviar para todas as unidades
                      </Label>
                    </div>
                    
                    {!sendToAllUnits && (
                      <Select onValueChange={setTargetUnitId} value={targetUnitId} disabled={sendToAllUnits}>
                        <SelectTrigger id="targetUnitId">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {units
                            .filter(unit => unit.name !== "5º CPA")
                            .map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="deadlineDate">Data Limite para Envio (Opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="deadlineDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !deadlineDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadlineDate ? format(deadlineDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deadlineDate}
                          onSelect={setDeadlineDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="admin-doc-file-input">Arquivo (Opcional)</Label>
                    <Input 
                      id="admin-doc-file-input" 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    />
                    {selectedFile && <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>}
                  </div>

                  {submitError && <p className="text-sm font-medium text-destructive">{submitError}</p>}

                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={loadingDocuments}>Criar novo documento</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs 
            defaultValue="all" 
            className="w-full" 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
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

        {loadingDocuments ? (
          <div className="py-8 text-center">Carregando documentos...</div>
        ) : sortedDocuments.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Enviado por</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
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
                        <TableCell>{doc.submittedBy.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status).replace('bg-', 'bg-opacity-80 text-white bg-')}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.submissionDate)}</TableCell>
                        <TableCell className="text-right">
                          <DocumentActionsRow document={doc} isAdmin={true} />
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
