import type { Document, DocumentStatus } from "@/hooks/useDocuments"; // Changed to type import
import { useDocuments } from "@/hooks/useDocuments"; // Added useDocuments
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, User, MoreVertical, Edit, Trash2 } from "lucide-react"; // Added MoreVertical, Edit, Trash2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // Added AlertDialog components
import { useState } from "react"; // Added useState

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const navigate = useNavigate();
  const { deleteDocument } = useDocuments(); // Added deleteDocument from useDocuments
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Added state for delete dialog
  
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
  
  const fileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "pdf";
    if (fileType.includes("sheet")) return "xlsx";
    if (fileType.includes("word")) return "docx";
    if (fileType.includes("image")) return "img";
    return "file";
  };
    const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Obter a primeira letra de cada palavra do título para o ícone do documento
  const titleInitials = document.title
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);

  const handleDelete = async () => {
    await deleteDocument(document.id);
    setShowDeleteDialog(false);
  };
  
  return (
    <>
      <Card className="card-hover overflow-hidden">
        <div className={`h-2 ${getStatusColor(document.status)}`} />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold">
                {titleInitials}
              </div>
              <div>
                <CardTitle className="text-lg truncate">{document.title}</CardTitle>
                <CardDescription className="flex items-center space-x-1 text-sm">
                  <FileText className="h-3 w-3" />
                  <span className="capitalize">{fileIcon(document.fileType)}</span>
                  <span>•</span>
                  <span>{(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(document.status)}>
                {getStatusText(document.status)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/documents/edit/${document.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2 space-y-4">
          {document.description && (
            <p className="text-sm line-clamp-2">{document.description}</p>
          )}
          
          <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{document.submittedBy.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Enviado: {formatDate(document.submissionDate)}</span>
            </div>
            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {document.unitName}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 pb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={() => navigate(`/documents/${document.id}`)}
          >
            Ver Detalhes
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{document.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
