
import { Document, DocumentStatus } from "@/hooks/useDocuments";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, User } from "lucide-react";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const navigate = useNavigate();
  
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
    return date.toLocaleDateString("pt-BR");
  };
  
  // Obter a primeira letra de cada palavra do título para o ícone do documento
  const titleInitials = document.title
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
  
  return (
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
          <Badge className={getStatusColor(document.status)}>
            {getStatusText(document.status)}
          </Badge>
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
      
      <CardFooter>
        <Button 
          onClick={() => navigate(`/documents/${document.id}`)}
          variant="outline" 
          className="w-full"
        >
          Visualizar Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
