
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentFormFields } from "@/components/documents/upload/DocumentFormFields";
import { FormActions } from "@/components/documents/upload/FormActions";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

const DocumentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, updateDocument, loading } = useDocuments();
  const [document, setDocument] = useState(null);
  
  // Use directly useForm instead of custom hook for edit page
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      unitId: "",
      documentDate: undefined,
      deadline: undefined,
    }
  });
  
  const { control, handleSubmit, formState, setValue, watch } = form;
  const { errors, isSubmitting } = formState;
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!loading && id) {
      const foundDoc = documents.find(doc => doc.id === id);
      if (foundDoc) {
        setDocument(foundDoc);
        
        // Pre-populate form fields
        setValue("title", foundDoc.title);
        if (foundDoc.description) setValue("description", foundDoc.description);
        setValue("unitId", foundDoc.unitId);
        if (foundDoc.documentDate) setValue("documentDate", new Date(foundDoc.documentDate));
        if (foundDoc.deadline) setValue("deadline", new Date(foundDoc.deadline));
      } else {
        toast({
          title: "Documento não encontrado",
          description: "O documento que você está tentando editar não existe.",
          variant: "destructive",
        });
        navigate("/documents");
      }
    }
  }, [id, documents, loading, navigate, setValue]);
  
  // Handle cancel button click
  const handleCancel = () => {
    navigate(-1);
  };
  
  // Existing file information for display
  const existingFile = document ? {
    name: document.fileName,
    type: document.fileType,
    size: document.fileSize,
    url: document.fileUrl,
  } : null;

  // Handle form submission
  const onSubmit = async (data) => {
    if (!id || !document) return;
    
    try {
      setIsLoading(true);
      const updatedDoc = {
        title: data.title,
        description: data.description,
        unitId: data.unitId,
        documentDate: data.documentDate.toISOString().split('T')[0],
        deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : undefined,
      };
      
      const success = await updateDocument(id, updatedDoc);
      
      if (success) {
        toast({
          title: "Documento atualizado",
          description: "O documento foi atualizado com sucesso.",
        });
        navigate("/documents");
      }
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !document) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <p>Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Editar Documento</h1>
        
        <Card className="border rounded-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <DocumentFormFields
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  isEditMode={true}
                  existingFile={existingFile}
                />
                
                <div className="pt-4">
                  <FormActions
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                    submitText="Atualizar"
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DocumentEdit;
