
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments, DocumentStatus } from "@/hooks/useDocuments";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Check, File, FileCheck, FilePenLine, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, updateDocumentStatus, addComment } = useDocuments();
  
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = user?.role === "admin";
  
  // Encontrar o documento pelo ID
  const document = documents.find((doc) => doc.id === id);
  
  if (!document) {
    return (
      <MainLayout>
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Documento não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O documento que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const getStatusColor = (status: DocumentStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "revision":
        return "bg-orange-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const getStatusText = (status: DocumentStatus): string => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "approved":
        return "Aprovado";
      case "revision":
        return "Em Revisão";
      case "completed":
        return "Concluído";
      default:
        return "Desconhecido";
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsSubmitting(true);
      const success = await addComment(document.id, comment);
      
      if (success) {
        setComment("");
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateStatus = async (status: DocumentStatus) => {
    try {
      setIsSubmitting(true);
      await updateDocumentStatus(document.id, status);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("sheet")) return "XLSX";
    if (fileType.includes("word")) return "DOCX";
    if (fileType.includes("image")) return "Imagem";
    return "Arquivo";
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          </div>
          
          <Badge className={getStatusColor(document.status)}>
            {getStatusText(document.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="comments">
                  Comentários ({document.comments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="preview">Visualização</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Documento</CardTitle>
                    <CardDescription>
                      Detalhes completos sobre o documento enviado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {document.description && (
                      <div>
                        <h3 className="font-medium text-sm">Descrição</h3>
                        <p className="mt-1 text-gray-700">{document.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-sm">Unidade</h3>
                        <p className="mt-1 text-gray-700">{document.unitName}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm">Data do Documento</h3>
                        <p className="mt-1 text-gray-700">
                          {new Date(document.documentDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm">Enviado por</h3>
                        <p className="mt-1 text-gray-700">{document.submittedBy.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm">Data de Envio</h3>
                        <p className="mt-1 text-gray-700">
                          {new Date(document.submissionDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-sm">Arquivo</h3>
                      <div className="mt-2 border rounded-md p-4 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded">
                            <File className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{document.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {getFileIcon(document.fileType)} • {(document.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" onClick={() => window.open(document.fileUrl, "_blank")}>
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comments">
                <Card>
                  <CardHeader>
                    <CardTitle>Comentários</CardTitle>
                    <CardDescription>
                      Histórico de comunicações sobre este documento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {document.comments && document.comments.length > 0 ? (
                      <div className="space-y-4">
                        {document.comments.map((comm) => (
                          <div key={comm.id} className="border rounded-md p-4 bg-muted/20">
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{comm.author.name}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comm.date)}
                              </span>
                            </div>
                            <p className="mt-2 text-gray-700">{comm.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-500">
                        Nenhum comentário ainda.
                      </p>
                    )}
                    
                    <div className="mt-4">
                      <Textarea
                        placeholder="Adicione um comentário..."
                        className="min-h-[100px]"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button 
                          onClick={handleSubmitComment} 
                          disabled={!comment.trim() || isSubmitting}
                        >
                          Enviar Comentário
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle>Visualização do Documento</CardTitle>
                    <CardDescription>
                      Visualize o documento enviado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="min-h-[400px]">
                    <div className="rounded-md border h-[400px] flex items-center justify-center">
                      <iframe 
                        src={document.fileUrl} 
                        title={document.title}
                        className="w-full h-full rounded-md"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button variant="outline" onClick={() => window.open(document.fileUrl, "_blank")}>
                      Abrir em Nova Aba
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
                <CardDescription>
                  Gerencie o status deste documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Status atual</h3>
                  <Badge className={`${getStatusColor(document.status)} w-full justify-center`}>
                    {getStatusText(document.status)}
                  </Badge>
                </div>
                
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Criado: {formatDate(document.submissionDate)}</span>
                    </div>
                    {document.comments && document.comments.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Último comentário: {formatDate(document.comments[document.comments.length - 1].date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-medium">Alterar Status</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {document.status !== "approved" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              <Check className="mr-2 h-4 w-4" />
                              Aprovar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Aprovar Documento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja aprovar este documento?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus("approved")}
                              >
                                Aprovar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {document.status !== "revision" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full border-orange-500 text-orange-500 hover:text-orange-500"
                            >
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Solicitar Revisão
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Solicitar Revisão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja solicitar revisão deste documento?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={() => handleUpdateStatus("revision")}
                              >
                                Solicitar Revisão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {document.status !== "completed" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <FileCheck className="mr-2 h-4 w-4" />
                              Marcar como Concluído
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Marcar como Concluído</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja marcar este documento como concluído?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdateStatus("completed")}
                              >
                                Concluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentDetail;
