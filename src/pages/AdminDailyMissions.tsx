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
import { Search, Plus, Trash2, CalendarIcon, Edit, CheckCircle2, XCircle, AlertCircle, Clock, HelpCircle, MoreHorizontal, Upload, Pencil } from "lucide-react"; 
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AdminDailyMissions = () => {
  const { missions, loading: loadingMissions, addMission, deleteMission, updateMission, updateUnitMissionStatus, setUnitMissionFile, clearUnitMissionFile } = useMissions(); 
  const { units: allUnitsFromHook, users, getUnitNameById, loading: loadingUsers } = useUsers(); 
  const { mappedUser: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Segunda-feira');
  const [requiresFileSubmission, setRequiresFileSubmission] = useState(true);

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
    setRequiresFileSubmission(true);
  };

  const handleOpenCreateDialog = (mission: Mission | null = null) => {
    if (mission) {
      setEditingMission(mission);
      setMissionTitle(mission.title);
      setMissionDescription(mission.description || "");
      setTargetUnitIds(mission.targetUnitIds);
      setDayOfWeek(mission.dayOfWeek);
      setRequiresFileSubmission(mission.requiresFileSubmission === undefined ? true : mission.requiresFileSubmission);
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
        requiresFileSubmission: requiresFileSubmission,
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
        requiresFileSubmission: requiresFileSubmission,
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
    const success = await setUnitMissionFile(missionId, unitId, file);
    if (success) {
      toast({ title: "Upload Concluído", description: `Arquivo ${file.name} enviado e status atualizado.` });
    } else {
      toast({ title: "Erro no Upload", variant: "destructive" });
    }
    setSelectedFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleClearFileForUnit = async (missionId: string, unitId: string) => {
    if (!currentUser) {
      toast({ title: "Erro de Autenticação", variant: "destructive" });
      return;
    }
    console.log(`Limpando arquivo para unidade ${unitId} na missão ${missionId}`);
    await clearUnitMissionFile(missionId, unitId);
  };

  const ADMIN_UNIT_ID = 'cpa5'; // ID da unidade a ser excluída da exibição de progresso

  // Filtra as unidades para exibição nos formulários, excluindo a unidade admin
  const unitsForForms = allUnitsFromHook.filter(unit => unit.id !== ADMIN_UNIT_ID && unit.name !== "5º CPA");

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
            <DropdownMenu key={up.unitId}> 
              <DropdownMenuTrigger asChild>
                <Badge variant="outline" className={`cursor-pointer ${badgeClasses}`}> 
                  {unitName}
                </Badge>
              </DropdownMenuTrigger>
              {currentUser && (
                <DropdownMenuContent className="w-56 p-2">
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
                            await handleClearFileForUnit(mission.id, up.unitId);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Limpar Arquivo
                      </Button>
                  )}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
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

  const daysOfWeek: DayOfWeek[] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

  // Agrupa missões por dia para o Accordion
  const daysOrder: DayOfWeek[] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
  const daysWithFilteredMissions = Array.from(new Set(sortedMissions.map(m => m.dayOfWeek)))
    .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

  // Função para renderizar o cabeçalho da tabela interna do Accordion
  const renderInnerTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[200px] pl-4">Título</TableHead>
        <TableHead className="min-w-[300px]">Unidade(s) Alvo e Progresso</TableHead>
        <TableHead className="text-right min-w-[100px] pr-4">Ações Gerais</TableHead>
      </TableRow>
    </TableHeader>
  );

  if (loadingMissions || loadingUsers || authLoading) {
    return <MainLayout><div className="flex justify-center items-center h-64"><p>Carregando dados...</p></div></MainLayout>;
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
              {sortedMissions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma missão encontrada com os filtros atuais.</p>
              ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {daysWithFilteredMissions.map((day) => {
                  const missionsForThisDay = sortedMissions.filter(
                    (mission) => mission.dayOfWeek === day
                  );

                  return (
                    <AccordionItem value={day} key={day} className="border rounded-md shadow-sm hover:shadow-md transition-shadow bg-card">
                      <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline flex justify-between w-full items-center data-[state=closed]:rounded-md data-[state=open]:rounded-t-md">
                        <span className="flex-grow text-left">{day}</span>
                        <Badge variant="secondary">{missionsForThisDay.length} {missionsForThisDay.length === 1 ? 'missão' : 'missões'}</Badge>
                      </AccordionTrigger>
                      <AccordionContent className="p-0 border-t data-[state=closed]:rounded-b-md">
                        <div className="overflow-x-auto">
                          <Table className="mb-0">
                            {renderInnerTableHeader()}
                            <TableBody>
                              {missionsForThisDay.map((mission) => (
                                <TableRow key={mission.id}>
                                  <TableCell className="py-3 font-medium align-top pl-4">
                                    <div className="font-medium">{mission.title}</div>
                                    {mission.description && <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{mission.description}</div>}
                                  </TableCell>
                                  <TableCell className="py-3 align-top">
                                    {renderUnitProgress(mission, statusFilter)}
                                  </TableCell>
                                  <TableCell className="py-3 text-right align-top pr-4">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Abrir menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenCreateDialog(mission)}> {/* handleOpenCreateDialog com missão abre em modo edição */}
                                          <Pencil className="mr-2 h-4 w-4" />
                                          <span>Editar</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteMission(mission.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Excluir</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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

            <div className="items-top flex space-x-2 mb-4">
              <Checkbox 
                id="requiresFileSubmission"
                checked={requiresFileSubmission}
                onCheckedChange={(checked) => setRequiresFileSubmission(Boolean(checked))}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="requiresFileSubmission"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Requer envio de arquivo?
                </label>
                <p className="text-xs text-muted-foreground">
                  Se marcado, o usuário precisará enviar um arquivo para cumprir a missão. Caso contrário, poderá apenas marcar como cumprida.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4"> 
              <Label htmlFor="missionTargetUnitIdsGroup" className="text-right pt-1"> 
                Unidade(s) Alvo*
              </Label>
              <div className="col-span-3">
                <div className="flex flex-col space-y-2" id="missionTargetUnitIdsGroup">
                  {unitsForForms.filter(unit => unit.name !== "5º CPA").map((unit) => (
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
