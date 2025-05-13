
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDocuments, type Document } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentFormFields } from "@/components/documents/upload/DocumentFormFields";
import { FormActions } from "@/components/documents/upload/FormActions";
import { useDocumentForm } from "@/components/documents/upload/useDocumentForm";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DocumentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, updateDocument, loading: documentsLoading } = useDocuments();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  
  const {
    control,
    handleSubmit,
    formState,
    setValue,
    watch,
    isLoading,
  } = useDocumentForm();

  useEffect(() => {
    if (id) {
      const docToEdit = documents.find(doc => doc.id === id);
      if (docToEdit) {
        setDocument(docToEdit);
        // Pre-fill form fields
        setValue("title", docToEdit.title);
        setValue("description", docToEdit.description || "");
        setValue("unitId", docToEdit.unitId);
        // Assuming unitName is derived or handled within DocumentFormFields or not directly editable here
        setValue("documentDate", new Date(docToEdit.documentDate));
        if (docToEdit.deadline) {
          setValue("deadline", new Date(docToEdit.deadline));
        }
        // File related fields (fileUrl, fileName, fileType, fileSize) are generally not directly editable in this manner.
        // If file replacement is needed, a new FileUploader instance would be required.
        // For this example, we'll focus on metadata editing.
      } else if (!documentsLoading) {
        toast({
          title: "Documento não encontrado",
          description: "O documento que você está tentando editar não foi encontrado.",
          variant: "destructive",
        });
        navigate("/documents");
      }
    }
  }, [id, documents, documentsLoading, setValue, navigate]);

  const onSubmit = async (data: any) => {
    if (!document || !user) return;

    // Exclude file-related fields that are not being updated here
    // and fields managed by the system (id, submissionDate, submittedBy, status)
    const { file, ...metadataToUpdate } = data; 

    // Convert Date objects to strings
    if (metadataToUpdate.documentDate instanceof Date) {
      metadataToUpdate.documentDate = metadataToUpdate.documentDate.toISOString().split('T')[0];
    }
    
    if (metadataToUpdate.deadline instanceof Date) {
      metadataToUpdate.deadline = metadataToUpdate.deadline.toISOString().split('T')[0];
    }

    const success = await updateDocument(document.id, metadataToUpdate);

    if (success) {
      toast({
        title: "Documento atualizado",
        description: "O documento foi atualizado com sucesso.",
      });
      navigate(`/documents/${document.id}`); // Navigate to document detail or list
    } else {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (documentsLoading) {
    return <MainLayout><p>Carregando...</p></MainLayout>;
  }

  if (!document) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback:
    return <MainLayout><p>Documento não encontrado.</p></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editar Documento</h1>
          <p className="text-muted-foreground">
            Modifique os detalhes do seu documento.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Documento</CardTitle>
              <CardDescription>
                Atualize as informações do documento abaixo. O arquivo original não será modificado aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentFormFields 
                control={control} 
                errors={formState.errors} 
                setValue={setValue} 
                watch={watch} 
                isEditMode={true}
                existingFile={{ 
                  name: document.fileName,
                  type: document.fileType,
                  size: document.fileSize,
                  url: document.fileUrl 
                }}
              />
            </CardContent>
          </Card>
          
          <FormActions 
            onCancel={() => navigate(`/documents/${document.id}`)} 
            isLoading={isLoading}
            isSubmitting={formState.isSubmitting}  
            submitText="Salvar Alterações"
          />
        </form>
      </div>
    </MainLayout>
  );
};

export default DocumentEdit;
