
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocuments, type Document } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface DocumentFormValues {
  title: string;
  description: string;
  unitId: string;
  documentDate: Date;
  deadline?: Date;
  file?: File;
}

export function useDocumentForm(initialData?: Partial<Document>) {
  const { userProfile } = useAuth();
  const { addDocument, updateDocument } = useDocuments();
  const { getUnits } = useUsers();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  
  const defaultValues: Partial<DocumentFormValues> = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    unitId: initialData?.unitId || (userProfile?.perfil === 'admin' ? (userProfile?.unidade_id || "") : "cpa-admin"),
    documentDate: initialData?.documentDate ? new Date(initialData.documentDate) : undefined,
    deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
  };
  
  const form = useForm<DocumentFormValues>({
    defaultValues,
  });
  
  const { control, formState, setValue, reset, watch } = form;
  
  const onSubmit = async (data: DocumentFormValues) => {
    if (!data.file && !initialData) {
      setFileError("Selecione um arquivo para enviar.");
      return;
    }
    
    if (!data.title || !data.unitId || !data.documentDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Define o tipo explicitamente para evitar erro de "any" implícito
      let unitData: { id: string; name: string; };
      
      // Verificar se é uma submissão para o 5º CPA (Admin)
      if (data.unitId === "cpa-admin") {
        unitData = {
          id: "cpa-admin",
          name: "5º CPA (Admin)"
        };
      } else {
        const units = getUnits();
        const foundUnit = units.find((u) => u.id === data.unitId);
        
        if (!foundUnit) {
          toast({
            title: "Erro",
            description: "Unidade não encontrada.",
            variant: "destructive",
          });
          return;
        }
        unitData = foundUnit;
      }
      
      // Criar novo documento
      if (!initialData && data.file) {
        const success = await addDocument({
          title: data.title,
          description: data.description,
          unitId: unitData.id,
          unitName: unitData.name,
          documentDate: data.documentDate.toISOString().split('T')[0],
          deadline: data.deadline?.toISOString().split('T')[0],
          fileName: data.file.name,
          fileType: data.file.type,
          fileSize: data.file.size,
          fileUrl: URL.createObjectURL(data.file), // Em produção, seria a URL do servidor
        });
        
        if (success) {
          navigate("/documents");
        }
      }
      
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    control,
    handleSubmit: form.handleSubmit,
    reset,
    formState,
    setValue,
    watch,
    isLoading,
    fileError,
    setFileError,
    onSubmit
  };
}
