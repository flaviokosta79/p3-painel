import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMissions } from "@/hooks/useMissions";
import { Mission } from "@/db/MissionStorage";
import { useEffect, useState } from "react";
import { UserMissionCard } from "@/components/UserMissionCard";

// Helper para obter o dia da semana em português para o valor da aba
const getDayValue = (dayIndex: number): Mission['dayOfWeek'] => {
  // Domingo: 0, Segunda: 1, ..., Sábado: 6
  const days: Mission['dayOfWeek'][] = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  // Se for Sábado (6) ou Domingo (0), padrão para Segunda-feira
  if (dayIndex === 0 || dayIndex === 6) return "Segunda-feira";
  return days[dayIndex];
};

export function UserDailyMissions() {
  const { user } = useAuth();
  const { missions, updateMissionStatus, loading: missionsLoading, setMissionFile, clearMissionFile } = useMissions();
  const [userMissions, setUserMissions] = useState<Mission[]>([]);
  const [selectedDay, setSelectedDay] = useState<Mission['dayOfWeek']>(getDayValue(new Date().getDay()));

  const today = new Date();
  const currentDayValue = getDayValue(today.getDay());

  const daysOfWeekForTabs: Mission['dayOfWeek'][] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

  useEffect(() => {
    if (user && missions) {
      const dayString = selectedDay; // selectedDay já é do tipo DayOfWeek
      const isAdmin = user.isAdmin;

      const filtered = missions.filter((mission) => {
        let isTargetUser = !isAdmin ? (mission.targetUnitIds.includes(user.unit.id as string) || mission.targetUnitIds.includes('ALL')) : true;
        
        const isPending = mission.status === 'Pendente';
        // Para admin: mostra se pendente OU se tem arquivo (de qualquer usuário)
        // Para usuário: mostra se pendente OU se CUMPRIDA e o arquivo foi enviado POR ELE
        const shouldShowForAdmin = isAdmin && (isPending || !!mission.submittedFile);
        const shouldShowForUser = !isAdmin && (isPending || (mission.status === 'Cumprida' && mission.submittedFile && mission.submittedFile.uploadedById === user.id));

        return (
          mission.dayOfWeek === dayString &&
          isTargetUser &&
          (isAdmin ? shouldShowForAdmin : shouldShowForUser)
        );
      });
      setUserMissions(filtered);
    }
  }, [missions, user, selectedDay]);

  // Modificada para lidar com upload de arquivo
  const handleFileUpload = async (missionId: string, file: File) => {
    if (user) {
      console.log(`Arquivo para missão ${missionId}:`, file.name, file.type, file.size);
      try {
        // A lógica de como 'submittedFile' é definido será movida para useMissions
        await setMissionFile(missionId, file, user); // Função hipotética em useMissions
        // O status pode ou não mudar aqui, dependendo da regra de negócio.
        // Por exemplo, pode ir para 'Em Análise' ou diretamente 'Cumprida'.
        // Se o envio do arquivo significa que a missão está cumprida:
        // await updateMissionStatus(missionId, "Cumprida", user.id);
        console.log(`Arquivo enviado para missão ${missionId}.`);
      } catch (error) {
        console.error("Erro ao enviar arquivo para missão:", error);
      }
    }
  };

  const handleRemoveFile = async (missionId: string) => {
    if (user) {
      try {
        // A lógica de como 'submittedFile' é removido será movida para useMissions
        await clearMissionFile(missionId, user); // Função hipotética em useMissions
        // O status provavelmente voltará para 'Pendente'
        // await updateMissionStatus(missionId, "Pendente", user.id);
        console.log(`Arquivo removido da missão ${missionId}.`);
      } catch (error) {
        console.error("Erro ao remover arquivo da missão:", error);
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
            {daysOfWeekForTabs.map((day) => (
              <TabsTrigger key={day} value={day}>
                {day}
              </TabsTrigger>
            ))}
          </TabsList>

          {daysOfWeekForTabs.map((day) => (
            <TabsContent key={day} value={day}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {missionsLoading && <p>Carregando missões...</p>}
                {!missionsLoading && userMissions.filter(m => m.dayOfWeek === day).length === 0 && (
                  <p className="col-span-full text-muted-foreground">
                    Nenhuma missão pendente para {day.toLowerCase().replace('-feira', '')}.
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
                      isAdminView={user?.isAdmin || false} // Nova prop
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
