import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useAuth, type User } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Tipos
export type DocumentStatus = 'pending' | 'approved' | 'revision' | 'completed';

export interface Document {
  id: string;
  title: string;
  description?: string;
  unitId: string;
  unitName: string;
  documentDate: string;
  submissionDate: string;
  deadline?: string;
  status: DocumentStatus;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  submittedBy: {
    id: string;
    name: string;
  };
  comments?: {
    id: string;
    text: string;
    date: string;
    author: {
      id: string;
      name: string;
    };
  }[];
}

interface DocumentsContextType {
  documents: Document[];
  loading: boolean;
  addDocument: (document: Omit<Document, 'id' | 'submissionDate' | 'status' | 'submittedBy'>) => Promise<boolean>;
  updateDocumentStatus: (id: string, status: DocumentStatus, comment?: string) => Promise<boolean>;
  addComment: (documentId: string, text: string) => Promise<boolean>;
  getUserDocuments: (userId: string) => Document[];
  getUnitDocuments: (unitId: string) => Document[];
  getAllDocuments: () => Document[];
}

// Lista vazia para armazenar documentos
// Não usamos mais dados mockados

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Carrega os documentos do localStorage
    const loadDocuments = () => {
      setTimeout(() => {
        // Obter dados do localStorage
        const storedDocuments = localStorage.getItem('pmerj_documents');
        if (storedDocuments) {
          setDocuments(JSON.parse(storedDocuments));
        } else {
          // Inicializa com array vazio se não houver documentos
          setDocuments([]);
          localStorage.setItem('pmerj_documents', JSON.stringify([]));
        }
        setLoading(false);
      }, 500);
    };
    
    loadDocuments();
  }, []);
  
  const addDocument = async (newDoc: Omit<Document, 'id' | 'submissionDate' | 'status' | 'submittedBy'>) => {
    if (!user) return false;
    
    try {
      const document: Document = {
        ...newDoc,
        id: Date.now().toString(),
        submissionDate: new Date().toISOString(),
        status: 'pending',
        submittedBy: {
          id: user.id,
          name: user.name,
        },
      };
      
      const updatedDocuments = [...documents, document];
      setDocuments(updatedDocuments);
      localStorage.setItem('pmerj_documents', JSON.stringify(updatedDocuments));
      
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso e está aguardando análise.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      
      toast({
        title: "Erro ao enviar documento",
        description: "Ocorreu um erro ao enviar seu documento. Tente novamente.",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const updateDocumentStatus = async (id: string, status: DocumentStatus, comment?: string) => {
    if (!user) return false;
    
    try {
      const updatedDocuments = documents.map((doc) => {
        if (doc.id === id) {
          // Se houver um comentário, adicione-o
          const updatedComments = [...(doc.comments || [])];
          
          if (comment) {
            updatedComments.push({
              id: Date.now().toString(),
              text: comment,
              date: new Date().toISOString(),
              author: {
                id: user.id,
                name: user.name,
              },
            });
          }
          
          return {
            ...doc,
            status,
            comments: updatedComments,
          };
        }
        return doc;
      });
      
      setDocuments(updatedDocuments);
      localStorage.setItem('pmerj_documents', JSON.stringify(updatedDocuments));
      
      const statusMessages = {
        pending: "Documento marcado como pendente",
        approved: "Documento aprovado com sucesso",
        revision: "Documento enviado para revisão",
        completed: "Documento marcado como concluído",
      };
      
      toast({
        title: statusMessages[status],
        description: comment ? "Um comentário foi adicionado." : "Status atualizado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do documento:', error);
      
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do documento.",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const addComment = async (documentId: string, text: string) => {
    if (!user || !text.trim()) return false;
    
    try {
      const updatedDocuments = documents.map((doc) => {
        if (doc.id === documentId) {
          const updatedComments = [
            ...(doc.comments || []),
            {
              id: Date.now().toString(),
              text,
              date: new Date().toISOString(),
              author: {
                id: user.id,
                name: user.name,
              },
            },
          ];
          
          return {
            ...doc,
            comments: updatedComments,
          };
        }
        return doc;
      });
      
      setDocuments(updatedDocuments);
      localStorage.setItem('pmerj_documents', JSON.stringify(updatedDocuments));
      
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      
      toast({
        title: "Erro ao adicionar comentário",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const getUserDocuments = (userId: string) => {
    return documents.filter((doc) => doc.submittedBy.id === userId);
  };
  
  const getUnitDocuments = (unitId: string) => {
    return documents.filter((doc) => doc.unitId === unitId);
  };
  
  const getAllDocuments = () => {
    return documents;
  };
  
  const value = {
    documents,
    loading,
    addDocument,
    updateDocumentStatus,
    addComment,
    getUserDocuments,
    getUnitDocuments,
    getAllDocuments,
  };
  
  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocuments deve ser usado dentro de um DocumentsProvider');
  }
  return context;
};
