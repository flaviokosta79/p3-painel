import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import MissionStorage, { type Mission, type MissionStatus, type DayOfWeek, type UnitMissionProgress, supabaseRowToMission } from '@/db/MissionStorage'; 
import { useAuth, type User } from './useAuth';
import { useUsers } from './useUsers';
import { v4 as uuidv4 } from 'uuid';

export type { Mission, MissionStatus, DayOfWeek, UnitMissionProgress }; 

interface MissionsContextType {
  missions: Mission[];
  loading: boolean;
  addMission: (missionData: Omit<Mission, 'id' | 'unitProgress' | 'creationDate' | 'createdBy' | 'createdByName' | 'updatedAt' | 'lastUpdatedById' | 'lastUpdatedByName'> & { targetUnitIds: string[] }) => Promise<boolean>; 
  deleteMission: (missionId: string) => Promise<boolean>;
  updateMission: (missionData: Partial<Omit<Mission, 'unitProgress' | 'id'>> & Pick<Mission, 'id' | 'targetUnitIds'>) => Promise<boolean>; 
  updateUnitMissionStatus: (missionId: string, unitId: string, newStatus: MissionStatus, updatedByUserId: string) => Promise<boolean>; 
  getMissionById: (missionId: string) => Mission | undefined;
  getMissionsByUnitId: (unitId: string) => Mission[]; 
  setUnitMissionFile: (missionId: string, unitId: string, file: File) => Promise<boolean>;
  clearUnitMissionFile: (missionId: string, unitId: string) => Promise<boolean>;
}

interface MissionsProviderProps {
  children: ReactNode;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export const MissionsProvider: React.FC<MissionsProviderProps> = ({ children }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const { mappedUser: currentUser, supabase } = useAuth(); 
  const { getUserNameById } = useUsers(); 

  useEffect(() => {
    const loadMissions = async () => {
      setLoading(true);
      const storedMissions = await MissionStorage.getAllMissions();
      setMissions(storedMissions);
      setLoading(false);
    };
    loadMissions();

    if (!supabase) return; 

    const channel = supabase
      .channel('missoes-realtime')
      .on<Mission>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'missoes' },
        (payload) => {
          const newMission = supabaseRowToMission(payload.new);
          setMissions((prevMissions) => {
            if (prevMissions.find(m => m.id === newMission.id)) {
              return prevMissions;
            }
            const updatedMissions = [...prevMissions, newMission].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
            return updatedMissions;
          });
        }
      )
      .on<Mission>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'missoes' },
        (payload) => {
          const updatedMission = supabaseRowToMission(payload.new);
          setMissions((prevMissions) => {
            const updatedMissions = prevMissions.map(m => m.id === updatedMission.id ? updatedMission : m).sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
            return updatedMissions;
          });
        }
      )
      .on<Mission>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'missoes' },
        (payload) => {
          // @ts-ignore 
          const deletedMissionId = payload.old.id;
          if (!deletedMissionId) {
            console.warn(">>> Realtime DELETE: payload.old.id is missing. Check REPLICA IDENTITY for 'missoes' table. It should be FULL.", payload);
            return;
          }
          setMissions((prevMissions) => {
            const updatedMissions = prevMissions.filter(m => m.id !== deletedMissionId).sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
            return updatedMissions;
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
          console.error('Erro ou fechamento do canal Realtime de missões:', err, status);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]); 

  const addMission = useCallback(async (missionData: Omit<Mission, 'id' | 'unitProgress' | 'creationDate' | 'createdBy' | 'createdByName' | 'updatedAt' | 'lastUpdatedById' | 'lastUpdatedByName'> & { targetUnitIds: string[] }): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para criar missão.");
      return false;
    }
    const currentUserName = currentUser.name || getUserNameById(currentUser.id) || 'Usuário Desconhecido';
    
    const initialUnitProgress: UnitMissionProgress[] = missionData.targetUnitIds.map(unitId => ({
      unitId: unitId,
      status: 'Pendente',
      updatedAt: new Date().toISOString(),
      lastUpdatedById: currentUser.id, 
      lastUpdatedByName: currentUserName,
    }));

    const newMission: Mission = {
      ...missionData,
      id: uuidv4(),
      unitProgress: initialUnitProgress,
      creationDate: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUserName,
      updatedAt: new Date().toISOString(),
      lastUpdatedById: currentUser.id,
      lastUpdatedByName: currentUserName,
    };
    const success = await MissionStorage.saveMission(newMission, currentUser);
    if (!success) {
      console.error('Falha ao salvar nova missão no MissionStorage.');
    }
    return success;
  }, [currentUser, getUserNameById]);

  const deleteMission = useCallback(async (missionId: string): Promise<boolean> => {
    const success = await MissionStorage.deleteMission(missionId);
    return success;
  }, []);

  const updateMission = useCallback(async (missionData: Partial<Omit<Mission, 'unitProgress' | 'id'>> & Pick<Mission, 'id' | 'targetUnitIds'>): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para atualizar missão.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionData.id); 
    if (!missionToUpdate) {
        console.warn("Tentativa de atualizar missão não encontrada no estado local, pode já ter sido removida ou é um ID inválido.");
        return false;
    }

    const currentUserName = currentUser.name || getUserNameById(currentUser.id) || 'Usuário Desconhecido';

    const updatedMission: Mission = {
      ...missionToUpdate, 
      ...missionData, 
      lastUpdatedById: currentUser.id,
      lastUpdatedByName: currentUserName,
      updatedAt: new Date().toISOString(),
    };

    const success = await MissionStorage.saveMission(updatedMission, currentUser);
    if (!success) {
      console.error('Falha ao ATUALIZAR missão no MissionStorage.');
    }
    return success;
  }, [missions, currentUser, getUserNameById]);

  const updateUnitMissionStatus = useCallback(async (missionId: string, unitId: string, newStatus: MissionStatus, updatedByUserId: string): Promise<boolean> => {
    const mission = missions.find(m => m.id === missionId); 
    if (!mission) {
        console.warn("Tentativa de atualizar status de unidade em missão não encontrada no estado local.");
        return false;
    }

    const updatedByUserName = getUserNameById(updatedByUserId) || 'Usuário Desconhecido';
    const now = new Date().toISOString();

    const updatedUnitProgress = mission.unitProgress.map(up => 
      up.unitId === unitId 
        ? { 
            ...up, 
            status: newStatus, 
            lastUpdatedById: updatedByUserId, 
            lastUpdatedByName: updatedByUserName, 
            updatedAt: now,
            submittedAt: newStatus === 'Cumprida' ? up.submittedAt || now : up.submittedAt, 
          } 
        : up
    );

    const updatedMission: Mission = {
      ...mission,
      unitProgress: updatedUnitProgress,
      lastUpdatedById: updatedByUserId, 
      lastUpdatedByName: updatedByUserName,
      updatedAt: now,
    };

    const success = await MissionStorage.saveMission(updatedMission, currentUser);
    if (!success) {
      console.error('Falha ao salvar atualização de status da missão no MissionStorage.');
    }
    return success;
  }, [missions, getUserNameById, currentUser]);

  const getMissionById = useCallback((missionId: string): Mission | undefined => {
    return missions.find(m => m.id === missionId);
  }, [missions]);

  const getMissionsByUnitId = useCallback((unitId: string): Mission[] => {
    return missions.filter(mission => 
      mission.targetUnitIds.includes(unitId)
    );
  }, [missions]);

  const setUnitMissionFile = useCallback(async (missionId: string, unitId: string, file: File): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para enviar arquivo.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionId); 
    if (!missionToUpdate) {
        console.warn("Tentativa de definir arquivo para missão não encontrada no estado local.");
        return false;
    }

    const now = new Date().toISOString();
    const updatedUnitProgress = missionToUpdate.unitProgress.map(up => {
      if (up.unitId === unitId) {
        return {
          ...up,
          status: 'Cumprida' as MissionStatus, 
          submittedFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedById: currentUser.id,
            uploadedByName: currentUser.name,
            uploadedAt: now,
          },
          submittedAt: now,
          lastUpdatedById: currentUser.id,
          lastUpdatedByName: currentUser.name,
          updatedAt: now,
        };
      }
      return up;
    });

    const updatedMission: Mission = {
      ...missionToUpdate,
      unitProgress: updatedUnitProgress,
      lastUpdatedById: currentUser.id, 
      lastUpdatedByName: currentUser.name,
      updatedAt: now, 
    };

    const success = await MissionStorage.saveMission(updatedMission, currentUser);
    if (!success) {
      console.error('Falha ao salvar missão com arquivo no MissionStorage.');
    }
    return success;
  }, [missions, currentUser, getUserNameById]); 

  const clearUnitMissionFile = useCallback(async (missionId: string, unitId: string): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para limpar arquivo.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionId); 
    if (!missionToUpdate) {
        console.warn("Tentativa de limpar arquivo para missão não encontrada no estado local.");
        return false;
    }

    const now = new Date().toISOString();
    const updatedUnitProgress = missionToUpdate.unitProgress.map(up => {
      if (up.unitId === unitId) {
        return {
          ...up,
          status: 'Pendente' as MissionStatus, 
          submittedFile: null,
          lastUpdatedById: currentUser.id,
          lastUpdatedByName: currentUser.name,
          updatedAt: now,
        };
      }
      return up;
    });

    const updatedMission: Mission = {
      ...missionToUpdate,
      unitProgress: updatedUnitProgress,
      lastUpdatedById: currentUser.id, 
      lastUpdatedByName: currentUser.name,
      updatedAt: now, 
    };

    const success = await MissionStorage.saveMission(updatedMission, currentUser);
    if (!success) {
      console.error('Falha ao limpar arquivo da missão no MissionStorage.');
    }
    return success;
  }, [missions, currentUser, getUserNameById]); 

  return (
    <MissionsContext.Provider value={{
      missions,
      loading,
      addMission,
      deleteMission,
      updateMission,
      updateUnitMissionStatus,
      getMissionById,
      getMissionsByUnitId,
      setUnitMissionFile,
      clearUnitMissionFile,
    }}>
      {children}
    </MissionsContext.Provider>
  );
};

export const useMissions = (): MissionsContextType => {
  const context = useContext(MissionsContext);
  if (!context) {
    throw new Error('useMissions deve ser usado dentro de um MissionsProvider');
  }
  return context;
};
