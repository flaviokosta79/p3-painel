import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useDocumentRequirements } from './useDocumentRequirements';

interface DocumentRequirementsContextType {
  documentRequirements: ReturnType<typeof useDocumentRequirements>['documentRequirements'];
  loading: ReturnType<typeof useDocumentRequirements>['loading'];
  addDocumentRequirement: ReturnType<typeof useDocumentRequirements>['addDocumentRequirement'];
  deleteDocumentRequirement: ReturnType<typeof useDocumentRequirements>['deleteDocumentRequirement'];
  updateDocumentRequirement: ReturnType<typeof useDocumentRequirements>['updateDocumentRequirement'];
}

const DocumentRequirementsContext = createContext<DocumentRequirementsContextType | undefined>(undefined);

export const DocumentRequirementsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const documentRequirementsData = useDocumentRequirements();

  return (
    <DocumentRequirementsContext.Provider value={documentRequirementsData}>
      {children}
    </DocumentRequirementsContext.Provider>
  );
};

export const useDocumentRequirementsContext = () => {
  const context = useContext(DocumentRequirementsContext);
  if (context === undefined) {
    throw new Error('useDocumentRequirementsContext must be used within a DocumentRequirementsProvider');
  }
  return context;
};
