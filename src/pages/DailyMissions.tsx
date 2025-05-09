import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileUp, Check, Calendar, FileText, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDailyMissions, DailyTask, DayMissions } from "@/hooks/useDailyMissions";

// Componente de upload de arquivo para uma tarefa específica
const TaskUpload = ({ task }: { task: DailyTask }) => {
  const { user } = useAuth();
  const { uploadFile, hasUserCompletedTaskToday } = useDailyMissions();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Verificar se o usuário já enviou este documento hoje
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!user) return;
      
      setIsCheckingStatus(true);
      try {
        const completed = await hasUserCompletedTaskToday(task.id, user.id);
        setUploaded(completed);
      } catch (error) {
        console.error("Erro ao verificar status do envio:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkCompletionStatus();
  }, [task.id, user, hasUserCompletedTaskToday]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
    }
  };  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro ao enviar",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Obter ID do usuário ou usar um valor padrão se não estiver disponível
      const userId = user?.id || 'anonymous-user';
      
      // Upload do arquivo para o Supabase Storage
      const filePath = await uploadFile(task.id, file, userId);
      
      toast({
        title: "Documento enviado",
        description: `O arquivo ${file.name} foi enviado com sucesso.`,
      });
      
      setUploaded(true);
      
      // Atualizar status do componente
      const checkStatus = async () => {
        const isCompleted = await hasUserCompletedTaskToday(task.id, userId);
        setUploaded(isCompleted);
      };
      
      // Verificar novamente após alguns segundos para garantir
      setTimeout(checkStatus, 2000);
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      
      // Exibir mensagem mais específica, se disponível
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ocorreu um erro ao enviar o arquivo. Tente novamente.";
      
      toast({
        title: "Erro ao enviar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{task.name}</Label>
          {task.frequency && (
            <Badge variant="outline" className="text-xs">
              {task.frequency}
            </Badge>
          )}
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground">{task.description}</p>
        )}
        
        <div className="flex items-center justify-center py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Verificando status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={`file-${task.id}`} className="text-sm font-medium">
          {task.name}
        </Label>
        {task.frequency && (
          <Badge variant="outline" className="text-xs">
            {task.frequency}
          </Badge>
        )}
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground">{task.description}</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mt-2">
        <div className="flex items-center space-x-2">
          <Input
            id={`file-${task.id}`}
            type="file"
            onChange={handleFileChange}
            className="flex-1"
            disabled={uploading || uploaded}
          />
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || uploaded}
          className={uploaded ? "bg-green-600 hover:bg-green-700" : ""}
          size="sm"
        >
          {uploading ? (
            <>
              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : uploaded ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Enviado
            </>
          ) : (
            <>
              <FileUp className="mr-1 h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Componente principal da página de missões diárias
const DailyMissions = () => {
  const { user } = useAuth();
  const { dailyMissions, loading } = useDailyMissions();
  const today = new Date();
  const currentDayNumber = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  
  // Ajustar para que domingo seja 0 e os outros dias consequentemente
  const adjustedDayNumber = currentDayNumber === 0 ? 6 : currentDayNumber - 1;
    // Verificar se temos dados de missões
  const hasMissions = dailyMissions && dailyMissions.length > 0;
  
  // Obter as missões do dia atual (se for dia útil)
  const todayMissions = hasMissions ? dailyMissions.find(
    (day) => day.dayNumber === currentDayNumber
  ) : null;
  
  // Definir a tab ativa para o dia atual ou para segunda-feira se for final de semana
  const defaultTab = currentDayNumber >= 1 && currentDayNumber <= 5 
    ? String(currentDayNumber)
    : "1";

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Carregando missões diárias...</p>
        </div>
      </MainLayout>
    );
  }
  
  // Se não houver missões após o carregamento, mostrar mensagem
  if (!hasMissions) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Missões Diárias</h1>
            <p className="text-muted-foreground">
              Envie os relatórios e documentos necessários para cada dia da semana
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-muted-foreground">Nenhuma missão diária encontrada.</p>
              <Button 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Missões Diárias</h1>
            <p className="text-muted-foreground">
              Envie os relatórios e documentos necessários para cada dia da semana
            </p>
          </div>
          
          <Card className="w-auto bg-muted/50">
            <CardContent className="flex items-center p-4 gap-2">
              <Calendar className="h-5 w-5 text-pmerj-blue" />
              <div>
                <p className="text-sm font-medium">Hoje é</p>
                <p className="text-lg font-bold">
                  {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start overflow-auto">
            {dailyMissions.map((dayMission) => (
              <TabsTrigger
                key={dayMission.dayNumber}
                value={String(dayMission.dayNumber)}
                className={
                  dayMission.dayNumber === currentDayNumber
                    ? "border-b-2 border-pmerj-blue font-bold"
                    : ""
                }
              >
                {dayMission.day}
                {dayMission.dayNumber === currentDayNumber && (
                  <span className="ml-1.5 bg-pmerj-blue text-white text-xs py-0.5 px-2 rounded-full">
                    Hoje
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {dailyMissions.map((dayMission) => (
            <TabsContent
              key={dayMission.dayNumber}
              value={String(dayMission.dayNumber)}
              className="mt-6"
            >
              <Card className={dayMission.dayNumber === currentDayNumber ? "border-pmerj-blue" : ""}>
                <CardHeader className={dayMission.dayNumber === currentDayNumber ? "bg-pmerj-blue/5" : ""}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{dayMission.day}</CardTitle>
                      <CardDescription>
                        {dayMission.tasks.length} documentos para enviar
                      </CardDescription>
                    </div>
                    {dayMission.dayNumber === currentDayNumber && (
                      <Badge className="bg-pmerj-blue">Hoje</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {dayMission.tasks.map((task) => (
                      <TaskUpload key={task.id} task={task} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DailyMissions;
