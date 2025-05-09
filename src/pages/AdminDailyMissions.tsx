import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import { v4 as uuidv4 } from 'uuid';

// Componente para o formulário de tarefa
const TaskForm = ({
  task,
  onSave,
  onCancel,
}: {
  task: Partial<DailyTask>;
  onSave: (task: DailyTask) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<DailyTask>>(task);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "O nome da tarefa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: formData.id || uuidv4(),
      name: formData.name!,
      description: formData.description,
      frequency: formData.frequency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Tarefa</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Relatório Operações Policiais"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Salvar na pasta específica"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequência (Opcional)</Label>
        <Select
          value={formData.frequency || ""}
          onValueChange={(value) => setFormData({ ...formData, frequency: value })}
        >
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Selecione a frequência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Diária">Diária</SelectItem>
            <SelectItem value="Semanal">Semanal</SelectItem>
            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
            <SelectItem value="Mensal">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </form>
  );
};

// Componente para cada tarefa na lista
const TaskItem = ({
  task,
  onEdit,
  onDelete,
}: {
  task: DailyTask;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md bg-card">
      <div className="space-y-1 flex-1">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          <h4 className="font-medium">{task.name}</h4>
          {task.frequency && (
            <Badge variant="outline" className="ml-2 text-xs">
              {task.frequency}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
      </div>

      <div className="flex space-x-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(task)}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a tarefa "{task.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(task.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Componente para o conteúdo do dia
const DayContent = ({
  dayMission,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: {
  dayMission: DayMissions;
  onAddTask: (dayNumber: number, task: DailyTask) => void;
  onEditTask: (dayNumber: number, task: DailyTask) => void;
  onDeleteTask: (dayNumber: number, id: string) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<DailyTask>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleAddClick = () => {
    setCurrentTask({});
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditClick = (task: DailyTask) => {
    setCurrentTask(task);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSaveTask = (task: DailyTask) => {
    if (isEditing) {
      onEditTask(dayMission.dayNumber, task);
    } else {
      onAddTask(dayMission.dayNumber, task);
    }
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{dayMission.day}</CardTitle>
            <CardDescription>
              {dayMission.tasks.length} documentos configurados
            </CardDescription>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Tarefa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dayMission.tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-6">
              Nenhuma tarefa cadastrada para {dayMission.day}.
              Clique em "Adicionar Tarefa" para começar.
            </p>
          )}
          
          {dayMission.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={handleEditClick}
              onDelete={(id) => onDeleteTask(dayMission.dayNumber, id)}
            />
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os detalhes da tarefa"
                : "Adicione uma nova tarefa para o dia"}
            </DialogDescription>
          </DialogHeader>
          
          <TaskForm
            task={currentTask}
            onSave={handleSaveTask}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Componente principal da página admin
const AdminDailyMissions = () => {
  const {
    dailyMissions,
    addTask,
    updateTask,
    deleteTask,
    loading,
    saveAllChanges,
  } = useDailyMissions();
  
  const today = new Date();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await saveAllChanges();
      toast({
        title: "Sucesso",
        description: "Todas as alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gerenciar Missões Diárias
            </h1>
            <p className="text-muted-foreground">
              Configure os documentos e relatórios que precisam ser enviados em cada dia da semana
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveAll}
              className="bg-pmerj-blue hover:bg-pmerj-blue/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
            
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
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando...</span>
          </div>
        ) : (
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="w-full justify-start overflow-auto">
              {dailyMissions.map((dayMission) => (
                <TabsTrigger
                  key={dayMission.dayNumber}
                  value={String(dayMission.dayNumber)}
                >
                  {dayMission.day}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {dailyMissions.map((dayMission) => (
              <TabsContent
                key={dayMission.dayNumber}
                value={String(dayMission.dayNumber)}
                className="mt-6"
              >
                <DayContent
                  dayMission={dayMission}
                  onAddTask={addTask}
                  onEditTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDailyMissions;
