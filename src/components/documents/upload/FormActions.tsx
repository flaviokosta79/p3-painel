
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FormActionsProps {
  isLoading: boolean;
  onCancel?: () => void;
  submitText?: string;
}

export function FormActions({ isLoading, onCancel, submitText = "Enviar" }: FormActionsProps) {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex justify-between pt-4 gap-2">
      <Button 
        type="button" 
        variant="outline"
        size="sm"
        onClick={handleCancel}
      >
        Cancelar
      </Button>
      <Button 
        type="submit"
        className="bg-pmerj-blue text-white hover:bg-pmerj-blue/90"
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : submitText}
      </Button>
    </div>
  );
}
