import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'p3_document_requirements';

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface NewDocumentRequirement {
  name: string;
  description: string;
}

export const useDocumentRequirements = () => {
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRequirements = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRequirements) {
        setDocumentRequirements(JSON.parse(storedRequirements));
      }
    } catch (error) {
      console.error("Error loading document requirements from localStorage:", error);
      // Em caso de erro, garante que a lista não fique indefinida
      setDocumentRequirements([]); 
    }
    setLoading(false);
  }, []);

  const saveRequirements = useCallback((requirements: DocumentRequirement[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requirements));
      setDocumentRequirements(requirements);
    } catch (error) {
      console.error("Error saving document requirements to localStorage:", error);
    }
  }, []);

  const addDocumentRequirement = useCallback(
    async (requirementData: NewDocumentRequirement): Promise<DocumentRequirement> => {
      return new Promise((resolve, reject) => {
        try {
          setLoading(true);
          const newRequirement: DocumentRequirement = {
            id: uuidv4(),
            ...requirementData,
            createdAt: new Date().toISOString(),
          };
          const updatedRequirements = [...documentRequirements, newRequirement];
          saveRequirements(updatedRequirements);
          setLoading(false);
          resolve(newRequirement);
        } catch (error) {
          console.error("Error adding document requirement:", error);
          setLoading(false);
          reject(error);
        }
      });
    },
    [documentRequirements, saveRequirements]
  );

  const deleteDocumentRequirement = useCallback(
    async (requirementId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          setLoading(true);
          const updatedRequirements = documentRequirements.filter(req => req.id !== requirementId);
          saveRequirements(updatedRequirements);
          setLoading(false);
          resolve();
        } catch (error) {
          console.error("Error deleting document requirement:", error);
          setLoading(false);
          reject(error);
        }
      });
    },
    [documentRequirements, saveRequirements]
  );
  
  // Placeholder for future update function
  const updateDocumentRequirement = useCallback(
    async (requirementId: string, updates: Partial<Omit<DocumentRequirement, 'id' | 'createdAt'>>): Promise<DocumentRequirement | null> => {
      return new Promise((resolve, reject) => {
        setLoading(true);
        const updatedReqs = documentRequirements.map(req => 
          req.id === requirementId ? { ...req, ...updates, id: req.id, createdAt: req.createdAt } : req
        );
        const updatedRequirement = updatedReqs.find(req => req.id === requirementId) || null;
        saveRequirements(updatedReqs);
        setLoading(false);
        if (updatedRequirement) {
          resolve(updatedRequirement);
        } else {
          reject(new Error('Requirement not found after update attempt'));
        }
      });
    },
    [documentRequirements, saveRequirements]
  );

  return {
    documentRequirements,
    loading,
    addDocumentRequirement,
    deleteDocumentRequirement,
    updateDocumentRequirement,
  };
};
