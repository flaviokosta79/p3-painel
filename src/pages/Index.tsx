import { useAuth } from "@/hooks/useAuth";
import { useDocuments, type Document } from "@/hooks/useDocuments";
import { useMissions } from "@/hooks/useMissions";
import type { Mission, DayOfWeek } from "@/db/MissionStorage";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { File, FileCheck, FileClock, ListChecks } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { UserMissionCard } from "@/components/UserMissionCard"; 
import { useToast } from "@/components/ui/use-toast"; 
import { cn } from "@/lib/utils"; 

// Helper de UserDailyMissions.tsx para obter o dia da semana para o valor da aba
const getDayValueForTabs = (dayIndex: number): DayOfWeek => {
  const days: DayOfWeek[] = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  if (dayIndex === 0 || dayIndex === 6) return "Segunda-feira"; 
  return days[dayIndex];
};

// Helper de UserDailyMissions.tsx para formatar a data para a aba
const getFormattedDateForDayOfWeekTabs = (dayName: DayOfWeek): string => {
  const today = new Date();
  const todayIndex = today.getDay();
  const dayMap: Record<DayOfWeek, number> = {
    "Domingo": 0, "Segunda-feira": 1, "Terça-feira": 2, "Quarta-feira": 3, "Quinta-feira": 4, "Sexta-feira": 5, "Sábado": 6,
  };
  const targetDayIndex = dayMap[dayName];
  const diffDays = targetDayIndex - todayIndex;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diffDays);
  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const Index = () => {
  const { mappedUser: user } = useAuth();
  const { documents, loading: documentsLoading } = useDocuments();
  const {
    missions,
    loading: missionsLoading,
    setUnitMissionFile,
    clearUnitMissionFile
  } = useMissions();
  const navigate = useNavigate();
  const { toast } = useToast(); 

  const isAdmin = user?.isAdmin;
  const stats = getStats(); 

  // Lógica de Missões (adaptada de UserDailyMissions.tsx)
  const [userMissions, setUserMissions] = useState<Mission[]>([]);
  const todayForTabs = new Date();
  const currentDayValueForTabs = getDayValueForTabs(todayForTabs.getDay());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDayValueForTabs);
  const daysOfWeekForTabs: DayOfWeek[] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

  useEffect(() => {
    if (user && user.unit && missions) {
      const filtered: Mission[] = [];
      missions.forEach((mission) => {
        if (mission.dayOfWeek !== selectedDay) return;

        if (isAdmin) {
          filtered.push(mission);
        } else {
          const targetUnit = mission.targetUnitIds.includes(user.unit!.id as string);
          if (targetUnit) {
            const unitProgressForUser = mission.unitProgress.find(up => up.unitId === user.unit!.id);
            if (unitProgressForUser) {
              const isPending = unitProgressForUser.status === 'Pendente';
              const isCumpridaByUser = unitProgressForUser.status === 'Cumprida' && unitProgressForUser.submittedFile && unitProgressForUser.submittedFile.uploadedById === user.id;
              const isAtrasada = unitProgressForUser.status === 'Atrasada';
              const isNaoCumprida = unitProgressForUser.status === 'Não Cumprida';

              if (isPending || isCumpridaByUser || isAtrasada || isNaoCumprida) {
                filtered.push(mission);
              }
            } else {
               // Considerar adicionar a missão como pendente se não houver progresso para a unidade alvo
                const isTargetAndNoProgress = mission.targetUnitIds.includes(user.unit!.id!)
                if(isTargetAndNoProgress){
                    // Adicionar uma entrada de progresso padrão 'Pendente' não deve ser feito aqui,
                    // isso deve ser tratado na criação da missão ou no hook useMissions.
                    // Por agora, se não houver progresso, não exibimos para o usuário não admin.
                    // Mas para admin, mostramos tudo.
                    // console.warn(`Missão ${mission.id} sem unitProgress para unidade ${user.unit!.id}. Não exibida para usuário comum.`);
                }
            }
          }
        }
      });
      setUserMissions(filtered);
    }
  }, [missions, user, selectedDay, isAdmin]);

  const handleFileUpload = async (missionId: string, file: File) => {
    if (user && user.unit) {
      try {
        await setUnitMissionFile(missionId, user.unit.id, file, user);
        toast({ title: "Sucesso", description: "Arquivo enviado e status atualizado para Cumprida." });
      } catch (error) {
        console.error("Erro ao enviar arquivo para missão:", error);
        toast({ title: "Erro", description: "Não foi possível enviar o arquivo.", variant: "destructive" });
      }
    }
  };

  const handleRemoveFile = async (missionId: string) => {
    if (user && user.unit) {
      try {
        await clearUnitMissionFile(missionId, user.unit.id, user);
        toast({ title: "Sucesso", description: "Arquivo removido e status atualizado para Pendente." });
      } catch (error) {
        console.error("Erro ao remover arquivo da missão:", error);
        toast({ title: "Erro", description: "Não foi possível remover o arquivo.", variant: "destructive" });
      }
    }
  };
  // Fim da Lógica de Missões

  // Filtrar documentos pendentes para o usuário atual
  const pendingDocuments = documents
    .filter(doc => user && doc.submittedBy?.id === user.id && (doc.status === 'pending' || doc.status === 'revision'))
    .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 5);

  // Função getStats (movida para melhor organização)
  function getStats() {
    const filteredDocs = isAdmin
      ? documents
      : documents.filter((doc) => doc.submittedBy.id === user?.id);
    return {
      total: filteredDocs.length,
      pending: filteredDocs.filter((doc) => doc.status === "pending").length,
      approved: filteredDocs.filter((doc) => doc.status === "approved").length,
      completed: filteredDocs.filter((doc) => doc.status === "completed").length,
    };
  }

  if (documentsLoading || missionsLoading) {
    return (
      <MainLayout>
        <div className="p-4">Carregando dados da página inicial...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-xs font-medium">Total de Documentos</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-xs font-medium">Documentos Pendentes</CardTitle>
              <FileClock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-xs font-medium">Documentos Concluídos</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-xl font-bold">{stats.approved + stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Seção Missões Diárias (Linha Inteira) */}
        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-2xl font-semibold tracking-tight">Missões Diárias</h2>
          <Tabs defaultValue={currentDayValueForTabs} value={selectedDay} onValueChange={(value) => setSelectedDay(value as DayOfWeek)} className="space-y-4">
            <TabsList>
              {daysOfWeekForTabs.map((day) => {
                const formattedDate = getFormattedDateForDayOfWeekTabs(day);
                const isToday = day === currentDayValueForTabs;
                return (
                  <TabsTrigger
                    key={day}
                    value={day}
                    className={cn({
                      "bg-primary/10 text-primary font-semibold": isToday && selectedDay !== day,
                      "border-2 border-primary/50": isToday && selectedDay === day,
                    })}
                  >
                    {day} {formattedDate}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {daysOfWeekForTabs.map((day) => (
              <TabsContent key={day} value={day}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Cards de missão podem usar mais colunas aqui */}
                  {missionsLoading && <p>Carregando missões...</p>}
                  {!missionsLoading && userMissions.filter(m => m.dayOfWeek === day).length === 0 && (
                    <p className="col-span-full text-muted-foreground">
                      Nenhuma missão para {day.toLowerCase().replace('-feira', '')}.
                    </p>
                  )}
                  {userMissions
                    .filter(m => m.dayOfWeek === day)
                    .map((mission) => (
                      <UserMissionCard
                        key={mission.id}
                        mission={mission}
                        onFileUpload={handleFileUpload}
                        onRemoveFile={handleRemoveFile}
                        isAdminView={isAdmin || false}
                        currentUser={user}
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Grade Inferior: Documentos Pendentes e Histórico (2 colunas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
          {/* Coluna Documentos Pendentes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Documentos Pendentes</h2>
            {pendingDocuments.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {pendingDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <Card className="p-2 text-center">
                <p className="text-muted-foreground mb-2">Nenhum documento pendente</p>
              </Card>
            )}
          </div>

          {/* Coluna Histórico de Envios (Placeholder) */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Histórico de Envios</h2>
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">
                (Conteúdo do histórico de envios aqui)
              </p>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
