
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploader } from "./upload/FileUploader";
import { DocumentFormFields } from "./upload/DocumentFormFields";
import { FormActions } from "./upload/FormActions";
import { useDocumentForm } from "./upload/useDocumentForm";
import { formatDate } from "@/lib/utils";

export function DocumentUploadForm() {
  const {
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
  } = useDocumentForm();
  
  return (
    <Card className="w-full border-t border-x border-b rounded-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Envio de Documento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DocumentFormFields
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            unitId={unitId}
            setUnitId={setUnitId}
            documentDate={documentDate}
            setDocumentDate={setDocumentDate}
          />
          
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <FileUploader
              file={file}
              setFile={setFile}
              fileError={fileError}
              setFileError={setFileError}
            />
          </div>
          
          <FormActions isLoading={isLoading} />
        </form>
      </CardContent>
    </Card>
  );
}
