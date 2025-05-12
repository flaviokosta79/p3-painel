
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";

export function useDocumentForm() {
  const { user } = useAuth();
  const { addDocument } = useDocuments();
  const { getUnits } = useUsers();
  const navigate = useNavigate();
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Para usuários normais, o unitId padrão será "cpa-admin"
  const [unitId, setUnitId] = useState(user?.role === 'admin' ? (user?.unit.id || "") : "cpa-admin");
  // A data usa o formato yyyy-MM-dd internamente para compatibilidade com o input type="date"
  const [documentDate, setDocumentDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setFileError("Selecione um arquivo para enviar.");
      return;
    }
    
    if (!title || !unitId || !documentDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Em um cenário real, faríamos upload do arquivo para um servidor
      // Aqui estamos simulando isso      // Dados necessários para criar o documento
      // Define o tipo explicitamente para evitar erro de "any" implícito
      let unitData: { id: string; name: string; };
      
      // Verificar se é uma submissão para o 5º CPA (Admin)
      if (unitId === "cpa-admin") {
        unitData = {
          id: "cpa-admin",
          name: "5º CPA (Admin)"
        };
      } else {
        const units = getUnits();
        const foundUnit = units.find((u) => u.id === unitId);
        
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
      const success = await addDocument({
        title,
        description,
        unitId: unitData.id,
        unitName: unitData.name,
        documentDate,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file), // Em produção, seria a URL do servidor
      });
      
      if (success) {
        navigate("/documents");
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
    title,
    setTitle,
    description,
    setDescription,
    unitId,
    setUnitId,
    documentDate,
    setDocumentDate,
    file,
    setFile,
    isLoading,
    fileError,
    setFileError,
    handleSubmit
  };
}
