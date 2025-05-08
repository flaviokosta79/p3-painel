
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";

const DocumentUpload = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enviar Documento</h1>
          <p className="text-muted-foreground">
            Preencha o formulário abaixo para enviar um novo documento ao sistema.
          </p>
        </div>
        
        <DocumentUploadForm />
      </div>
    </MainLayout>
  );
};

export default DocumentUpload;
