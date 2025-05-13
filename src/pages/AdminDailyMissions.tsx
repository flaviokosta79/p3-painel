import { useState, type FormEvent, useEffect, useCallback } from "react";
import { useMissions, type Mission, type MissionStatus, type DayOfWeek, type UnitMissionProgress } from "@/hooks/useMissions"; 
import { useUsers, type Unit } from "@/hooks/useUsers"; 
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Plus, Trash2, CalendarIcon, Edit, CheckCircle2, XCircle, AlertCircle, Clock, HelpCircle, MoreHorizontal, Upload } from "lucide-react"; 
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
// Imports para Dialog, Textarea e Checkbox
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const AdminDailyMissions = () => {
  const { missions, loading: loadingMissions, addMission, deleteMission, updateMission, updateUnitMissionStatus, setUnitMissionFile, clearUnitMissionFile } = useMissions(); 
  const { units: allUnitsFromHook, users, getUnitNameById, loading: loadingUsers } = useUsers(); 
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Segunda-feira');

  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all"); 
  const [statusFilter, setStatusFilter] = useState<MissionStatus | "all">("all"); 

  const getUnitStatusColor = (status: MissionStatus): string => {
    switch (status) {
      case "Cumprida": return "#4CAF50"; 
      case "Pendente": return "#FFC107"; 
      case "Não Cumprida": return "#F44336"; 
      case "Atrasada": return "#FF9800"; 
      default: return "#9E9E9E"; 
    }
  };

  const getUnitStatusText = (status: MissionStatus): string => {
    return status;
  };

  const resetDialogForm = () => {
    setEditingMission(null);
    setMissionTitle("");
    setMissionDescription("");
    setTargetUnitIds([]);
    setDayOfWeek('Segunda-feira');
  };

  const handleOpenCreateDialog = (mission: Mission | null = null) => {
    if (mission) {
      setEditingMission(mission);
      setMissionTitle(mission.title);
      setMissionDescription(mission.description || "");
      setTargetUnitIds(mission.targetUnitIds);
      setDayOfWeek(mission.dayOfWeek);
    } else {
      resetDialogForm();
    }
    setIsCreateDialogOpen(true);
  };

  const handleCreateOrUpdateMission = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    if (editingMission) {
      const success = await updateMission({ 
        id: editingMission.id,
        title: missionTitle,
        description: missionDescription,
        targetUnitIds: targetUnitIds,
        dayOfWeek: dayOfWeek,
      });
      if (success) {
        toast({ title: "Sucesso", description: "Missão atualizada." });
      } else {
        toast({ title: "Erro", description: "Não foi possível atualizar a missão.", variant: "destructive" });
      }
    } else {
      const success = await addMission({
        title: missionTitle,
        description: missionDescription,
        targetUnitIds: targetUnitIds,
        dayOfWeek: dayOfWeek,
      });
      if (success) {
        toast({ title: "Sucesso", description: "Missão criada." });
      } else {
        toast({ title: "Erro", description: "Não foi possível criar a missão.", variant: "destructive" });
      }
    }
    setIsSubmitting(false);
    setIsCreateDialogOpen(false);
    resetDialogForm();
  };

  const handleDeleteMission = async (missionId: string) => {
    const success = await deleteMission(missionId);
    if (success) {
      toast({ title: "Sucesso", description: "Missão excluída." });
    } else {
      toast({ title: "Erro", description: "Não foi possível excluir a missão.", variant: "destructive" });
    }
  };

  const handleUnitMissionStatusChange = async (missionId: string, unitId: string, newStatus: MissionStatus) => {
    if (!currentUser) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    console.log(`Mudando status para ${newStatus} para unidade ${unitId} na missão ${missionId}`);
    const success = await updateUnitMissionStatus(missionId, unitId, newStatus, currentUser.id);
    if (success) {
      toast({ title: "Status Atualizado", description: `Status da unidade alterado para ${newStatus}.` });
    } else {
      toast({ title: "Erro ao Atualizar Status", variant: "destructive" });
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUploadForUnit = async (missionId: string, unitId: string, file: File) => {
    if (!currentUser) {
      toast({ title: "Erro de Autenticação", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
      return;
    }
    console.log(`Enviando arquivo ${file.name} para unidade ${unitId} na missão ${missionId}`);
    const success = await setUnitMissionFile(missionId, unitId, file, currentUser);
    if (success) {
      toast({ title: "Upload Concluído", description: `Arquivo ${file.name} enviado e status atualizado.` });
    } else {
      toast({ title: "Erro no Upload", variant: "destructive" });
    }
    setSelectedFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const ADMIN_UNIT_ID = 'cpa5'; // ID da unidade a ser excluída da exibição de progresso

  // Filtra as unidades para exibição nos formulários, excluindo a unidade admin
  const unitsForForms = allUnitsFromHook.filter(unit => unit.id !== ADMIN_UNIT_ID);

  // Função para renderizar o progresso das unidades com popover
  const renderUnitProgress = (mission: Mission, currentStatusFilter: MissionStatus | "all") => {
    if (!mission.unitProgress || mission.unitProgress.length === 0) {
      return <span className="text-xs text-muted-foreground">Nenhuma unidade designada ou progresso não iniciado.</span>;
    }

    let initialUnitsForDisplay = mission.unitProgress.filter(up => up.unitId !== ADMIN_UNIT_ID);
    let unitsToShow = initialUnitsForDisplay;

    if (currentStatusFilter !== "all") {
        if (currentStatusFilter === 'Pendente') {
            unitsToShow = initialUnitsForDisplay.filter(up => up.status === 'Pendente' || up.status === 'Atrasada');
        } else {
            unitsToShow = initialUnitsForDisplay.filter(up => up.status === currentStatusFilter);
        }
    }
    // Se currentStatusFilter === "all", unitsToShow permanece como initialUnitsForDisplay (todas as unidades não-admin)

    if (unitsToShow.length === 0) {
        if (initialUnitsForDisplay.length > 0 && currentStatusFilter !== "all") {
            // Havia unidades inicialmente, mas nenhuma correspondeu ao filtro de status atual
            let statusDisplayName = currentStatusFilter;
            if (currentStatusFilter === 'Pendente') statusDisplayName = 'Pendente/Atrasada' as MissionStatus; // Cast para evitar erro de tipo na string
            return <span className="text-xs text-muted-foreground">Nenhuma unidade '{statusDisplayName}' nesta missão.</span>;
        } else if (mission.unitProgress.some(up => up.unitId === ADMIN_UNIT_ID) && initialUnitsForDisplay.length === 0) {
            // Apenas a unidade ADMIN_UNIT_ID estava presente
            return <span className="text-xs text-muted-foreground">Controle interno do 5º CPA.</span>;
        } else if (initialUnitsForDisplay.length === 0 && mission.unitProgress.length === 0){
            // Nenhuma unidade de progresso para esta missão
             return <span className="text-xs text-muted-foreground">Progresso não iniciado.</span>;
        } else {
             // Caso genérico para quando unitsToShow é 0 após todos os filtros, mas não se encaixa nos acima
             return <span className="text-xs text-muted-foreground">Nenhuma unidade visível com os filtros atuais.</span>;
        }
    }

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {unitsToShow.map((up) => {
          const unitName = getUnitNameById(up.unitId) || 'Desconhecida';
          let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
          let badgeClasses = "";

          switch (up.status) {
            case "Cumprida":
              badgeClasses = "bg-green-500 hover:bg-green-600 text-white border-green-600";
              break;
            case "Pendente":
            case "Atrasada":
            case "Não Cumprida":
              badgeClasses = "bg-red-500 hover:bg-red-600 text-white border-red-600";
              break;
            default:
              badgeClasses = "bg-gray-400 hover:bg-gray-500 text-white border-gray-500"; 
          }

          return (
            <Popover key={up.unitId}> 
              <PopoverTrigger asChild>
                <Badge variant="outline" className={`cursor-pointer ${badgeClasses}`}> 
                  {unitName}
                </Badge>
              </PopoverTrigger>
              {currentUser && (
                <PopoverContent className="w-56 p-2">
                  <p className="text-xs text-muted-foreground mb-1">Ações para: {getUnitNameById(up.unitId) || unitName}</p>
                  <p className="text-sm font-semibold mb-2">Status Atual: {up.status}</p>
                  <Select 
                    defaultValue={up.status} 
                    onValueChange={async (newStatusVal: MissionStatus) => await handleUnitMissionStatusChange(mission.id, up.unitId, newStatusVal)}                       
                  >
                    <SelectTrigger className="h-8 text-xs mb-1">Mudar Status</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Cumprida">Cumprida</SelectItem>
                      <SelectItem value="Não Cumprida">Não Cumprida</SelectItem>
                    </SelectContent>
                  </Select>
                  {up.status !== 'Cumprida' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs mt-1"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('data-mission-id', mission.id);
                          fileInputRef.current.setAttribute('data-unit-id', up.unitId);
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Upload className="mr-1 h-3 w-3" /> Enviar Arquivo
                    </Button>
                  )}
                  {up.submittedFile && (
                     <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs mt-1"
                        onClick={async () => {
                            if (!currentUser) return;
                            const success = await clearUnitMissionFile(mission.id, up.unitId, currentUser);
                            if(success) toast({title: "Arquivo Removido"});
                            else toast({title: "Erro ao remover arquivo", variant: "destructive"});
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Remover Arquivo: {up.submittedFile.name.substring(0,15)}...
                      </Button>
                  )}
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>
    );
  };

  const filteredMissions = missions
    .filter((mission) => {
      if (unitFilter === "all") return true;
      return mission.targetUnitIds.includes(unitFilter);
    })
    .filter((mission) => {
      if (statusFilter === "all") return true; // Adicionar esta linha de volta

      if (unitFilter !== "all") {
        // Uma unidade específica está selecionada
        const specificUnitProgress = mission.unitProgress.find(up => up.unitId === unitFilter);
        
        if (!specificUnitProgress) {
          // Se a unidade específica não tem registro (improvável), considera 'Pendente'.
          return statusFilter === 'Pendente';
        }
        return specificUnitProgress.status === statusFilter;
      } else {
        // "Todas as unidades" está selecionado para o filtro de unidade
        if (statusFilter === 'Pendente') {
          // Missão aparece se ALGUMA unidade for Pendente ou Atrasada
          return mission.unitProgress.some(up => up.status === 'Pendente' || up.status === 'Atrasada');
        } else {
          // Para outros status ("Cumprida", "Não Cumprida", "Atrasada") com "Todas as unidades":
          // A missão passa se *pelo menos uma* unidade tiver esse status.
          return mission.unitProgress.some(up => up.status === statusFilter);
        }
      }
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
        <Card className="mb-4">
          <CardHeader className="px-4 py-1">
            <div className="flex justify-between items-center">
              <CardTitle>Gerenciar Missões Semanais</CardTitle>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenCreateDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Criar Missão Semanal
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Buscar por título, descrição, unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:col-span-1"
              />
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Filtrar por Unidade Alvo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {allUnitsFromHook.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MissionStatus | "all")}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Cumprida">Cumprida</SelectItem>
                  {/* <SelectItem value="Não Cumprida">Não Cumprida</SelectItem> // Removido */}
                  {/* <SelectItem value="Atrasada">Atrasada</SelectItem> // Removido */}
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredMissions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma missão encontrada com os filtros atuais.</p>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Título</TableHead> 
                    <TableHead className="w-[40%]">Unidade(s) Alvo e Progresso</TableHead> 
                    <TableHead className="w-[15%]">Dia</TableHead> 
                    <TableHead className="w-[20%]">Ações Gerais</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium align-top">{mission.title}</TableCell>
                      <TableCell className="align-top">
                        {renderUnitProgress(mission, statusFilter)}
                      </TableCell>
                      <TableCell className="align-top">{mission.dayOfWeek}</TableCell>
                      <TableCell className="text-right align-top">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">...</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">Opções da Missão</h4>
                                <p className="text-xs text-muted-foreground">
                                  Edite ou exclua a missão globalmente.
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenCreateDialog(mission)}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar Missão (Geral)
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteMission(mission.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Missão (Geral)
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
            </div>
          </CardContent>
        </Card>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            const missionId = fileInputRef.current?.getAttribute('data-mission-id');
            const unitId = fileInputRef.current?.getAttribute('data-unit-id');
            if (file && missionId && unitId) {
              handleFileUploadForUnit(missionId, unitId, file);
            }
          }}
        />

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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="missionDayOfWeek" className="text-right">
                Dia da Semana*
              </Label>
              <Select
                value={dayOfWeek} 
                onValueChange={(value: DayOfWeek) => setDayOfWeek(value)}
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

            <div className="grid grid-cols-4 items-start gap-4"> 
              <Label htmlFor="missionTargetUnitIdsGroup" className="text-right pt-1"> 
                Unidade(s) Alvo*
              </Label>
              <div className="col-span-3">
                <div className="flex flex-col space-y-2" id="missionTargetUnitIdsGroup">
                  {unitsForForms.map((unit) => (
                    <div key={unit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={targetUnitIds.includes(unit.id)}
                        onCheckedChange={(checked) => {
                          setTargetUnitIds(prev => 
                            checked ? [...prev, unit.id] : prev.filter(id => id !== unit.id)
                          );
                        }}
                      />
                      <label htmlFor={`unit-${unit.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {unit.name}
                      </label>
                    </div>
                  ))}
                  {unitsForForms.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma unidade operacional disponível para seleção.</p>}
                </div>
                {unitsForForms.length > 0 && (
                  <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-border">
                    <Checkbox
                      id="select-all-units"
                      checked={unitsForForms.length > 0 && targetUnitIds.length === unitsForForms.length && unitsForForms.every(u => targetUnitIds.includes(u.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargetUnitIds(unitsForForms.map(u => u.id));
                        } else {
                          setTargetUnitIds([]);
                        }
                      }}
                    />
                    <label htmlFor="select-all-units" className="text-sm font-medium leading-none">
                      Selecionar Todas as Unidades Visíveis
                    </label>
                  </div>
                )}
              </div>
            </div>

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
