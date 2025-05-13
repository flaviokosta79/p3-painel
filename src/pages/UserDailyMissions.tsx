import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMissions, type UnitMissionProgress } from "@/hooks/useMissions"; 
import { Mission } from "@/db/MissionStorage";
import { useEffect, useState } from "react";
import { UserMissionCard } from "@/components/UserMissionCard";
import { useToast } from "@/components/ui/use-toast"; 
import { cn } from "@/lib/utils"; 

// Helper para obter o dia da semana em português para o valor da aba
const getDayValue = (dayIndex: number): Mission['dayOfWeek'] => {
  // Domingo: 0, Segunda: 1, ..., Sábado: 6
  const days: Mission['dayOfWeek'][] = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  // Se for Sábado (6) ou Domingo (0), padrão para Segunda-feira
  if (dayIndex === 0 || dayIndex === 6) return "Segunda-feira";
  return days[dayIndex];
};

// Nova função para formatar a data para a aba
const getFormattedDateForDayOfWeek = (dayName: Mission['dayOfWeek']): string => {
  const today = new Date(); // Use a data atual real
  const todayIndex = today.getDay(); // 0 para Domingo, 1 para Segunda, etc.

  const dayMap: Record<Mission['dayOfWeek'], number> = {
    "Domingo": 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    "Sábado": 6,
  };
  const targetDayIndex = dayMap[dayName];

  const diffDays = targetDayIndex - todayIndex;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diffDays);

  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0'); // getMonth() é 0-indexado

  return `${day}/${month}`;
};

export function UserDailyMissions() {
  const { user } = useAuth();
  const { missions, loading: missionsLoading, updateUnitMissionStatus, setUnitMissionFile, clearUnitMissionFile } = useMissions(); 
  const [userMissions, setUserMissions] = useState<Mission[]>([]);
  // const [userUnitProgressMap, setUserUnitProgressMap] = useState<Record<string, UnitMissionProgress | undefined>>({}); // Não é mais necessário

  const today = new Date(); // Mantido para currentDayValue
  const currentDayValue = getDayValue(today.getDay());
  const [selectedDay, setSelectedDay] = useState<Mission['dayOfWeek']>(currentDayValue); // Inicializa com o dia atual
  const { toast } = useToast(); 

  const daysOfWeekForTabs: Mission['dayOfWeek'][] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

  useEffect(() => {
    if (user && user.unit && missions) {
      const dayString = selectedDay;
      const isUserAdmin = user.isAdmin; // Correção: usar user.isAdmin

      const filteredMissions: Mission[] = [];
      // const progressMap: Record<string, UnitMissionProgress | undefined> = {}; // Não é mais necessário aqui, o card vai lidar com isso

      missions.forEach((mission) => {
        if (mission.dayOfWeek !== dayString) return; 

        if (isUserAdmin) {
          filteredMissions.push(mission);
        } else {
          const targetUnit = mission.targetUnitIds.includes(user.unit.id as string);
          if (targetUnit) {
            const unitProgressForUser = mission.unitProgress.find(up => up.unitId === user.unit.id);
            
            if (unitProgressForUser) {
              const isPending = unitProgressForUser.status === 'Pendente';
              // Usuário vê a missão se estiver pendente para sua unidade, OU se ele mesmo a cumpriu
              const isCumpridaByUser = unitProgressForUser.status === 'Cumprida' && unitProgressForUser.submittedFile && unitProgressForUser.submittedFile.uploadedById === user.id;
              // Ou se estiver atrasada ou não cumprida, para que ele possa agir
              const isAtrasada = unitProgressForUser.status === 'Atrasada';
              const isNaoCumprida = unitProgressForUser.status === 'Não Cumprida';

              if (isPending || isCumpridaByUser || isAtrasada || isNaoCumprida) {
                filteredMissions.push(mission);
                // progressMap[mission.id] = unitProgressForUser; // Não é mais necessário aqui
              }
            } else {
              // Se não há unitProgress para esta unidade, e ela é alvo, o usuário deveria vê-la como 'Pendente'.
              // Isso implica que ao criar a missão, unitProgress deve ser inicializado para todas as targetUnitIds.
              // Por agora, se não houver, vamos assumir que ele não deve interagir ainda ou há um problema de dados.
              console.warn(`Missão ${mission.id} não tem unitProgress para a unidade do usuário ${user.unit.id}. Não será exibida.`);
            }
          }
        }
      });
      setUserMissions(filteredMissions);
      // setUserUnitProgressMap(progressMap); // Não é mais necessário aqui
    }
  }, [missions, user, selectedDay]);

  const handleFileUpload = async (missionId: string, file: File) => { // unitId removido dos params, será pego de user.unit.id
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

  const handleRemoveFile = async (missionId: string) => { // unitId removido dos params, será pego de user.unit.id
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Missões Diárias</h1>
          <p className="text-muted-foreground">
            Acompanhe e envie suas missões atribuídas para cada dia da semana.
          </p>
        </div>

        <Tabs defaultValue={currentDayValue} value={selectedDay} onValueChange={(value) => setSelectedDay(value as Mission['dayOfWeek'])} className="space-y-4">
          <TabsList>
            {daysOfWeekForTabs.map((day) => {
              const formattedDate = getFormattedDateForDayOfWeek(day);
              const isToday = day === currentDayValue;
              return (
                <TabsTrigger 
                  key={day} 
                  value={day}
                  className={cn({
                    "bg-primary/10 text-primary font-semibold": isToday && selectedDay !== day, // Destaque suave se for hoje mas não selecionado
                    "border-2 border-primary/50": isToday && selectedDay === day, // Destaque mais forte se for hoje E selecionado
                  })}
                >
                  {day} {formattedDate}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {daysOfWeekForTabs.map((day) => (
            <TabsContent key={day} value={day}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {missionsLoading && <p>Carregando missões...</p>}
                {!missionsLoading && userMissions.filter(m => m.dayOfWeek === day).length === 0 && (
                  <p className="col-span-full text-muted-foreground">
                    Nenhuma missão para {day.toLowerCase().replace('-feira', '')} direcionada à sua unidade ou já cumprida e não enviada por você.
                  </p>
                )}
                {userMissions
                  .filter(m => m.dayOfWeek === day)
                  .map((mission) => (
                    <UserMissionCard 
                      key={mission.id} 
                      mission={mission} 
                      // unitId={user?.unit?.id || ''} // Removido
                      // unitProgress={userUnitProgressMap[mission.id]} // Removido
                      onFileUpload={handleFileUpload} // Simplificado, unitId será pego de user.unit.id dentro da função
                      onRemoveFile={handleRemoveFile} // Simplificado
                      isAdminView={user?.isAdmin || false} // Correção: usar user.isAdmin
                      currentUser={user} 
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
