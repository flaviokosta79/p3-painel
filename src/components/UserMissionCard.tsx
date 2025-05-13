import { Mission, UnitMissionProgress, MissionStatus, SubmittedFile } from "@/db/MissionStorage"; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Upload, FileText, Edit2, Trash2, AlertTriangle } from "lucide-react"; 
import { useRef, useMemo } from 'react'; 
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/useAuth"; 

interface UserMissionCardProps {
  mission: Mission;
  currentUser: User; 
  onFileUpload: (missionId: string, file: File) => void; 
  onRemoveFile: (missionId: string) => void; 
  isAdminView?: boolean; 
}

export function UserMissionCard({ mission, currentUser, onFileUpload, onRemoveFile, isAdminView = false }: UserMissionCardProps) {
  const { id: missionId, title, description, dayOfWeek, unitProgress } = mission;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userIsCurrentlyAdmin = currentUser?.isAdmin || false;

  const unitProgressForCurrentUser = useMemo(() => {
    if (!currentUser || !currentUser.unit) return undefined;
    return unitProgress.find(up => up.unitId === currentUser.unit.id);
  }, [unitProgress, currentUser]);

  const displayedStatus: MissionStatus | "Status Desconhecido" = unitProgressForCurrentUser?.status || (currentUser && currentUser.unit ? 'Pendente' : 'Status Desconhecido');
  const submittedFileForUnit: SubmittedFile | null | undefined = unitProgressForCurrentUser?.submittedFile;
  const isSubmittedByThisUnit = !!submittedFileForUnit;

  const cardShouldBeDisabled = 
    (isAdminView && userIsCurrentlyAdmin) || 
    (!userIsCurrentlyAdmin && displayedStatus !== 'Pendente' && !isSubmittedByThisUnit && !['Atrasada', 'Não Cumprida'].includes(displayedStatus)); 

  const getStatusBadgeElement = (statusToDisplay: MissionStatus | "Status Desconhecido") => {
    switch (statusToDisplay) {
      case 'Pendente':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pendente</Badge>;
      case 'Cumprida':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'Atrasada':
        return <Badge variant="destructive">Atrasada</Badge>;
      case 'Não Cumprida':
        return <Badge variant="destructive" className="bg-red-700 text-white border-red-700">Não Cumprida</Badge>;
      case 'Status Desconhecido':
         return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Status Indisp.</Badge>;
      default:
        const exhaustiveCheck: never = statusToDisplay;
        return <Badge variant="secondary">{exhaustiveCheck}</Badge>;
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(missionId, file);
    }
  };
  
  const disableActionsDueToAdminView = isAdminView && userIsCurrentlyAdmin;
  
  let canUpload = false;
  let canChangeOrRemove = false;

  if (!disableActionsDueToAdminView && !userIsCurrentlyAdmin) { 
    canUpload = ['Pendente', 'Atrasada', 'Não Cumprida'].includes(displayedStatus);
    canChangeOrRemove = isSubmittedByThisUnit && ['Cumprida', 'Pendente', 'Atrasada', 'Não Cumprida'].includes(displayedStatus);
  }
  

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col",
      {
        'opacity-60 bg-slate-50 pointer-events-none': cardShouldBeDisabled,
        'bg-card': !cardShouldBeDisabled,
      }
    )}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {isSubmittedByThisUnit && <CheckCircle className="h-5 w-5 text-green-500" />}
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
        {isSubmittedByThisUnit && submittedFileForUnit && (
          <div className="flex items-start text-muted-foreground"> 
            <FileText className="h-4 w-4 mr-1.5 text-sky-600 flex-shrink-0 mt-0.5" /> 
            <div className="flex-grow min-w-0">
              <p className="text-xs font-medium text-foreground/80 truncate" title={submittedFileForUnit.name}>{submittedFileForUnit.name}</p>
              <p className="text-xs">
                {(submittedFileForUnit.size / 1024).toFixed(1)} KB &bull; {new Date(submittedFileForUnit.uploadedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center">
          {getStatusBadgeElement(displayedStatus)}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv,.xlsx,.pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {isSubmittedByThisUnit ? (
          <div className="flex w-full items-center space-x-2"> 
            <Button 
              onClick={handleButtonClick} 
              variant="outline"
              size="sm" 
              className="flex-grow"
              disabled={!canChangeOrRemove || disableActionsDueToAdminView} 
            >
              <Edit2 className="h-4 w-4 mr-1.5" /> Alterar
            </Button>
            <Button 
              onClick={() => onRemoveFile(missionId)} 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:bg-red-100 hover:text-red-700"
              disabled={!canChangeOrRemove || disableActionsDueToAdminView} 
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleButtonClick}
            disabled={!canUpload || disableActionsDueToAdminView} 
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white`}
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
