
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Document as DocumentType } from "@/hooks/useDocuments";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, FileJson } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface DocumentActionsProps {
  document: DocumentType;
  isAdmin?: boolean;
  onActionComplete?: () => void;
}

export function DocumentActionsRow({ document, isAdmin = false, onActionComplete }: DocumentActionsProps) {
  const navigate = useNavigate();
  const { deleteDocument, exportDocumentAsJSON } = useDocuments();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await deleteDocument(document.id);
    setShowDeleteDialog(false);
    if (onActionComplete) onActionComplete();
  };
  
  const handleExportJSON = () => {
    const jsonData = exportDocumentAsJSON(document.id);
    if (jsonData) {
      // Criar um blob e fazer download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `documento_${document.id}.json`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Documento exportado",
        description: `O documento "${document.title}" foi exportado como JSON.`
      });
    } else {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o documento.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex justify-end space-x-1">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/documents/${document.id}`)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver detalhes</span>
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/documents/edit/${document.id}`)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        {isAdmin && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleExportJSON}
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-100"
          >
            <FileJson className="h-4 w-4" />
            <span className="sr-only">Exportar como JSON</span>
          </Button>
        )}
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </div>

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
