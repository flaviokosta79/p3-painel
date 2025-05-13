
/**
 * Módulo para gerenciar o armazenamento de documentos como arquivos JSON
 * em uma estrutura de diretório virtual
 */

import { Document } from "@/hooks/useDocuments";

// Interface para gerenciar os metadados dos arquivos salvos
interface StoredDocument {
  id: string;
  content: Document;
  lastModified: string;
}

// Namespace simulando um sistema de arquivos virtual
const DocumentStorage = {
  /**
   * Salva um documento como arquivo JSON
   * @param document Documento a ser salvo
   * @returns Promise com o resultado da operação
   */
  saveDocument: async (document: Document): Promise<boolean> => {
    try {
      const storedDocs = DocumentStorage.getAllDocuments();
      
      const existingDocIndex = storedDocs.findIndex(doc => doc.id === document.id);
      
      if (existingDocIndex !== -1) {
        // Atualiza documento existente
        storedDocs[existingDocIndex] = {
          id: document.id,
          content: document,
          lastModified: new Date().toISOString()
        };
      } else {
        // Adiciona novo documento
        storedDocs.push({
          id: document.id,
          content: document,
          lastModified: new Date().toISOString()
        });
      }
      
      localStorage.setItem('db_documents', JSON.stringify(storedDocs));
      console.log(`Documento ${document.id} salvo como JSON`);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar documento como arquivo JSON:', error);
      return false;
    }
  },
  
  /**
   * Recupera um documento pelo ID
   * @param id ID do documento
   * @returns O documento encontrado ou null
   */
  getDocumentById: (id: string): Document | null => {
    try {
      const storedDocs = DocumentStorage.getAllDocuments();
      const foundDoc = storedDocs.find(doc => doc.id === id);
      
      return foundDoc ? foundDoc.content : null;
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      return null;
    }
  },
  
  /**
   * Recupera todos os documentos armazenados
   * @returns Array de documentos armazenados
   */
  getAllDocuments: (): StoredDocument[] => {
    try {
      const storedDocs = localStorage.getItem('db_documents');
      return storedDocs ? JSON.parse(storedDocs) : [];
    } catch (error) {
      console.error('Erro ao buscar documentos armazenados:', error);
      return [];
    }
  },
  
  /**
   * Exclui um documento pelo ID
   * @param id ID do documento a ser excluído
   * @returns True se o documento foi excluído com sucesso
   */
  deleteDocument: async (id: string): Promise<boolean> => {
    try {
      const storedDocs = DocumentStorage.getAllDocuments();
      const updatedDocs = storedDocs.filter(doc => doc.id !== id);
      
      localStorage.setItem('db_documents', JSON.stringify(updatedDocs));
      console.log(`Documento ${id} excluído`);
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      return false;
    }
  },
  
  /**
   * Exporta um documento como string JSON
   * @param id ID do documento a ser exportado
   * @returns String JSON do documento ou null em caso de erro
   */
  exportDocumentAsJSON: (id: string): string | null => {
    try {
      const doc = DocumentStorage.getDocumentById(id);
      
      if (!doc) {
        return null;
      }
      
      return JSON.stringify(doc, null, 2);
    } catch (error) {
      console.error('Erro ao exportar documento como JSON:', error);
      return null;
    }
  }
};

export default DocumentStorage;
