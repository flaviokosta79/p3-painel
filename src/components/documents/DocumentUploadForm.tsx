
import { Card, CardContent } from "@/components/ui/card";
import { DocumentFormFields } from "./upload/DocumentFormFields";
import { FormActions } from "./upload/FormActions";
import { useDocumentForm } from "./upload/useDocumentForm";

export function DocumentUploadForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    isLoading,
    fileError,
    setFileError
  } = useDocumentForm();
  
  return (
    <Card className="w-full border-t border-x border-b rounded-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Envio de Documento</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <DocumentFormFields
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
            
            <FormActions 
              isLoading={isLoading} 
              isSubmitting={isSubmitting} 
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
