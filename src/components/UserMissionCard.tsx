import { Mission } from "@/db/MissionStorage";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Upload, FileText, Edit2, Trash2 } from "lucide-react";
import { useRef } from 'react'; 

interface UserMissionCardProps {
  mission: Mission;
  onFileUpload: (missionId: string, file: File) => void; 
  onRemoveFile: (missionId: string) => void; 
  isAdminView?: boolean;
}

export function UserMissionCard({ mission, onFileUpload, onRemoveFile, isAdminView = false }: UserMissionCardProps) {
  const { id: missionId, title, description, dayOfWeek, status, submittedFile } = mission;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitted = !!submittedFile;
  // Card fica desabilitado visualmente se status não for Pendente E nenhum arquivo foi submetido.
  // Os botões de ação (Alterar/Excluir) têm sua própria lógica de desabilitar baseada apenas no status Pendente.
  const isVisuallyDisabled = status !== 'Pendente' && !isSubmitted;

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(missionId, file);
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out ${isVisuallyDisabled ? 'opacity-70 bg-slate-100' : 'bg-card'} flex flex-col`}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {isSubmitted && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
        {description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2 pt-1 space-y-2 text-xs text-muted-foreground flex-grow"> 
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1.5" /> Dia: {dayOfWeek}
        </div>
        {isSubmitted && submittedFile && (
          <div className="flex items-start text-muted-foreground"> 
            <FileText className="h-4 w-4 mr-1.5 text-sky-600 flex-shrink-0 mt-0.5" /> 
            <div className="flex-grow min-w-0">
              <p className="text-xs font-medium text-foreground/80 truncate" title={submittedFile.name}>{submittedFile.name}</p>
              <p className="text-xs">
                {(submittedFile.size / 1024).toFixed(1)} KB &bull; {new Date(submittedFile.uploadedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv,.xlsx,.pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {isSubmitted ? (
          <div className="flex w-full items-center space-x-2"> 
            <Button 
              onClick={handleButtonClick} 
              variant="outline"
              size="sm" 
              className="flex-grow"
              disabled={isAdminView || (status !== 'Pendente' && status !== 'Cumprida')} 
            >
              <Edit2 className="h-4 w-4 mr-1.5" /> Alterar
            </Button>
            <Button 
              onClick={() => onRemoveFile(missionId)} 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:bg-red-100 hover:text-red-700"
              disabled={isAdminView || (status !== 'Pendente' && status !== 'Cumprida')} 
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleButtonClick}
            disabled={isVisuallyDisabled || isAdminView} 
            className={`w-full ${'bg-blue-500 hover:bg-blue-600'} text-white`}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Enviar Arquivo
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
