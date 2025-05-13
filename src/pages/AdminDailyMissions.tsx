import { useState, type FormEvent, useEffect, useCallback } from "react";
import { useMissions, type Mission, type MissionStatus, type DayOfWeek } from "@/hooks/useMissions"; 
import { useUsers, type Unit } from "@/hooks/useUsers"; 
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Trash2, CalendarIcon, Edit } from "lucide-react"; 
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { Calendar } from "@/components/ui/calendar"; 
import { format } from "date-fns"; 
import { ptBR } from "date-fns/locale"; 
import { cn } from "@/lib/utils"; 
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const AdminDailyMissions = () => {
  const { missions, loading: loadingMissions, addMission, deleteMission, updateMissionStatus, updateMission } = useMissions(); 
  const { units, users, getUnitNameById, loading: loadingUsers } = useUsers(); 
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); 

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionTargetUnitIds, setMissionTargetUnitIds] = useState<string[]>([]);
  const [missionDayOfWeek, setMissionDayOfWeek] = useState<DayOfWeek | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MissionStatus | "all">("all");

  const resetDialogForm = () => {
    setMissionTitle("");
    setMissionDescription("");
    setMissionTargetUnitIds([]);
    setMissionDayOfWeek(null);
    setSubmitError(null);
    setEditingMission(null);
    setIsCreateDialogOpen(false);
  };

  const handleOpenCreateDialog = (mission: Mission | null = null) => {
    if (mission) {
      setEditingMission(mission);
      setMissionTitle(mission.title);
      setMissionDescription(mission.description || "");
      setMissionTargetUnitIds(mission.targetUnitIds);
      setMissionDayOfWeek(mission.dayOfWeek);
    } else {
      setEditingMission(null);
      setMissionTitle("");
      setMissionDescription("");
      setMissionTargetUnitIds([]);
      setMissionDayOfWeek(null);
    }
    setIsCreateDialogOpen(true);
  };

  const handleCreateOrUpdateMission = async (e: FormEvent) => {
    e.preventDefault();
    if (!missionTitle || !missionDayOfWeek) {
      setSubmitError("Título e Dia da Semana são obrigatórios.");
      return;
    }

    setSubmitError(null);
    let success = false;

    if (editingMission) {
      // Preservar dados de criação originais e atualizar o resto
      const updatedMissionData: Mission = {
        ...editingMission, // Isso traz id, createdBy, createdByName, creationDate
        title: missionTitle,
        description: missionDescription,
        targetUnitIds: missionTargetUnitIds,
        dayOfWeek: missionDayOfWeek,
        // lastUpdatedById, lastUpdatedByName, updatedAt serão atualizados em updateMission
      };
      success = await updateMission(updatedMissionData);
    } else {
      const missionData = {
        title: missionTitle,
        description: missionDescription,
        targetUnitIds: missionTargetUnitIds,
        dayOfWeek: missionDayOfWeek,
        // createdBy e createdByName serão definidos em addMission
      };
      success = await addMission(missionData); // Passar apenas os campos necessários
    }

    if (success) {
      toast({
        title: editingMission ? "Missão Atualizada!" : "Missão(ões) Criada(s)!",
        description: editingMission 
          ? `A missão "${missionTitle}" foi atualizada.` 
          : `Nova(s) missão(ões) "${missionTitle}" criada(s) para as unidades selecionadas.`,
      });
      resetDialogForm();
    } else {
      toast({
        title: "Erro",
        description: editingMission ? "Não foi possível atualizar a missão." : "Não foi possível criar a(s) missão(ões).",
        variant: "destructive",
      });
      setSubmitError(editingMission ? "Falha ao atualizar missão." : "Falha ao criar missão(ões).");
    }
  };

  const handleDeleteMission = async (missionId: string, missionTargetUnitId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta instância da missão?")) {
      const success = await deleteMission(missionId); 
      if (success) {
        toast({ title: "Missão Excluída", description: "A instância da missão foi removida.", });
      } else {
        toast({ title: "Erro", description: "Não foi possível excluir a instância da missão.", variant: "destructive" });
      }
    }
  };

  const handleMissionStatusChange = async (missionId: string, newStatus: MissionStatus) => {
    if (!currentUser) { 
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para alterar o status da missão.", variant: "destructive" });
      return;
    }
    try {
      await updateMissionStatus(missionId, newStatus, currentUser.id); 
      toast({ title: "Status da Missão Atualizado", description: `A missão foi marcada como ${newStatus}.` });
    } catch (error) {
      console.error("Erro ao atualizar status da missão:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o status da missão.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: MissionStatus): string => {
    switch (status) {
      case "Pendente": return "#fdba74"; 
      case "Cumprida": return "#86efac"; 
      case "Não Cumprida": return "#fca5a5"; 
      case "Atrasada": return "#facc15"; 
      default: return "#e5e7eb"; 
    }
  };
  
  const getStatusText = (status: MissionStatus): string => {
    return status; 
  };
  
  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  const getDisplayableUnitNames = useCallback((targetUnitIds: string[]): string => {
    if (loadingUsers || !units || units.length === 0) {
      return "Carregando unidades...";
    }
    if (!targetUnitIds || targetUnitIds.length === 0) {
      return "Nenhuma unidade alvo";
    }

    const allUnitIdsFromContext = units.map(u => u.id);
    const allSelected = targetUnitIds.length === allUnitIdsFromContext.length && 
                        allUnitIdsFromContext.every(id => targetUnitIds.includes(id));

    if (allSelected) {
      return "Todas as Unidades";
    }
    
    return targetUnitIds
      .map(id => getUnitNameById(id) || `ID (${id}) Desc.`)
      .join(', ');
  }, [units, getUnitNameById, loadingUsers]);

  const filteredMissions = missions
    .filter((mission) => {
      if (unitFilter === "all") return true;
      return mission.targetUnitIds.includes(unitFilter);
    })
    .filter((mission) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "Pendente" && mission.status === "Pendente") return true;
      if (statusFilter === "Cumprida" && mission.status === "Cumprida") return true;
      if (statusFilter === "Não Cumprida" && mission.status === "Não Cumprida") return true;
      if (statusFilter === "Atrasada" && mission.status === "Atrasada") return true;
      return false;
    })
    .filter((mission) => {
      if (!searchTerm) return true;
      return (
        mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission.description && mission.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

  const sortedMissions = [...filteredMissions].sort((a, b) => {
    return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
  });

  if (loadingMissions || loadingUsers) {
    return <MainLayout><p>Carregando dados...</p></MainLayout>;
  }

  return (
    <MainLayout>
      <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) resetDialogForm();
        setIsCreateDialogOpen(isOpen);
      }}>
        {/* O Card agora está DENTRO do Dialog principal */}
        <Card className="mb-4">
          <CardHeader className="px-4 py-1">
            <div className="flex justify-between items-center">
              <CardTitle>Gerenciar Missões Semanais</CardTitle>
              {/* Este DialogTrigger agora está dentro do escopo do Dialog pai */}
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenCreateDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Criar Missão Semanal
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input 
                placeholder="Buscar por título, descrição, unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MissionStatus | "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Cumprida">Cumprida</SelectItem>
                  <SelectItem value="Não Cumprida">Não Cumprida</SelectItem>
                  <SelectItem value="Atrasada">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(loadingMissions || loadingUsers) && <p>Carregando missões e usuários...</p>}
            {(!loadingMissions && !loadingUsers && filteredMissions.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma missão encontrada com os filtros atuais.</p>
              </div>
            )}

            {(!loadingMissions && !loadingUsers && filteredMissions.length > 0) && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Título</TableHead>
                  <TableHead className="w-[15%]">Unidade(s) Alvo</TableHead>
                  <TableHead className="w-[10%]">Dia</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[15%]">Responsável (Última Atualização)</TableHead>
                  <TableHead className="w-[15%]">Última Atualização</TableHead>
                  <TableHead className="text-right w-[10%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissions.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.title}</TableCell>
                    <TableCell>{getDisplayableUnitNames(mission.targetUnitIds)}</TableCell>
                    <TableCell>{mission.dayOfWeek}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getStatusColor(mission.status), color: '#000' }}>
                        {getStatusText(mission.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{mission.lastUpdatedByName || mission.createdByName || "N/A"}</TableCell>
                    <TableCell>{formatDateDisplay(mission.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">...</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Opções da Missão</h4>
                              <p className="text-xs text-muted-foreground">
                                Atualize o status ou edite/exclua a missão.
                              </p>
                            </div>
                            <div className="grid gap-2">
                              <Select 
                                defaultValue={mission.status}
                                onValueChange={async (newStatus: MissionStatus) => {
                                  await handleMissionStatusChange(mission.id, newStatus);
                                }}
                              >
                                <SelectTrigger>Mudar Status</SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pendente">Pendente</SelectItem>
                                  <SelectItem value="Cumprida">Cumprida</SelectItem>
                                  <SelectItem value="Não Cumprida">Não Cumprida</SelectItem>
                                  {/* <SelectItem value="Atrasada">Atrasada</SelectItem>  Atrasada deve ser automática */}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={() => handleOpenCreateDialog(mission)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar Missão
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMission(mission.id, mission.targetUnitIds[0])}> {/* targetUnitId não existe mais, precisa de ajuste se a lógica de deleção depende de uma única unidade */}
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Missão
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* O DialogContent que mostra o formulário para criar/editar missão */}
        <DialogContent className="sm:max-w-[525px] p-4">
          <DialogHeader>
            <DialogTitle>{editingMission ? "Editar Missão" : "Criar Nova Missão Semanal"}</DialogTitle>
            <DialogDescription>
              {editingMission ? "Atualize os detalhes da missão semanal." : "Preencha os detalhes para criar uma nova missão semanal recorrente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateMission} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="missionTitle" className="text-right">Título*</Label>
              <Input id="missionTitle" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="missionDescription" className="text-right">Descrição</Label>
              <Textarea id="missionDescription" value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} className="col-span-3" />
            </div>

            {/* Dia da Semana */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="missionDayOfWeek" className="text-right">
                Dia da Semana*
              </Label>
              <Select
                value={missionDayOfWeek || undefined} 
                onValueChange={(value: DayOfWeek) => setMissionDayOfWeek(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o dia da semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                  <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                  <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                  <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                  <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unidades Alvo - Múltipla Seleção com Checkboxes */}
            <div className="grid grid-cols-4 items-start gap-4"> 
              <Label htmlFor="missionTargetUnitIdsGroup" className="text-right pt-2"> 
                Unidade(s) Alvo*
              </Label>
              <div className="col-span-3">
                <div className="flex flex-col space-y-2" id="missionTargetUnitIdsGroup">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={missionTargetUnitIds.includes(unit.id)}
                        onCheckedChange={(checked) => {
                          setMissionTargetUnitIds(prev => 
                            checked ? [...prev, unit.id] : prev.filter(id => id !== unit.id)
                          );
                        }}
                        disabled={!!editingMission} 
                      />
                      <Label htmlFor={`unit-${unit.id}`} className="font-normal">{unit.name}</Label>
                    </div>
                  ))}
                </div>
                {!editingMission && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-border">
                      <Checkbox
                        id="select-all-units"
                        checked={units.length > 0 && missionTargetUnitIds.length === units.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMissionTargetUnitIds(units.map(u => u.id));
                          } else {
                            setMissionTargetUnitIds([]);
                          }
                        }}
                      />
                      <Label htmlFor="select-all-units" className="font-normal">Selecionar Todas as Unidades</Label>
                    </div>
                  )}
              </div>
            </div>

            {submitError && <p className="col-span-4 text-red-500 text-sm text-center py-2">{submitError}</p>}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{editingMission ? "Salvar Alterações" : "Criar Missão Semanal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AdminDailyMissions;
