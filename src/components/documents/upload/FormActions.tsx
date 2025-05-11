
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FormActionsProps {
  isLoading: boolean;
}

export function FormActions({ isLoading }: FormActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between pt-4">
      <Button 
        type="button" 
        variant="outline"
        onClick={() => navigate(-1)}
      >
        Cancelar
      </Button>
      <Button 
        type="submit"
        className="bg-pmerj-blue text-white hover:bg-pmerj-blue/90"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Enviar Documento"}
      </Button>
    </div>
  );
}
