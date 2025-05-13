import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import MissionStorage, { type Mission, type MissionStatus, type DayOfWeek, type UnitMissionProgress } from '@/db/MissionStorage'; 
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
  setUnitMissionFile: (missionId: string, unitId: string, file: File, user: User) => Promise<boolean>;
  clearUnitMissionFile: (missionId: string, unitId: string, user: User) => Promise<boolean>;
}

interface MissionsProviderProps {
  children: ReactNode;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export const MissionsProvider: React.FC<MissionsProviderProps> = ({ children }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { getUserNameById } = useUsers(); 

  useEffect(() => {
    const loadMissions = async () => {
      setLoading(true);
      const storedMissions = await MissionStorage.getAllMissions();
      setMissions(storedMissions);
      setLoading(false);
    };
    loadMissions();
  }, []);

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
    const success = await MissionStorage.saveMission(newMission);
    if (success) {
      setMissions(prevMissions => [...prevMissions, newMission]);
    }
    return success;
  }, [currentUser, getUserNameById]);

  const deleteMission = useCallback(async (missionId: string): Promise<boolean> => {
    const success = await MissionStorage.deleteMission(missionId);
    if (success) {
      setMissions(prevMissions => prevMissions.filter(m => m.id !== missionId));
    }
    return success;
  }, []);

  const updateMission = useCallback(async (missionUpdateData: Partial<Omit<Mission, 'unitProgress' | 'id'>> & Pick<Mission, 'id' | 'targetUnitIds'>): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para atualizar missão.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionUpdateData.id);
    if (!missionToUpdate) return false;

    const currentUserName = currentUser.name || getUserNameById(currentUser.id) || 'Usuário Desconhecido';

    const updatedMission: Mission = {
      ...missionToUpdate, 
      ...missionUpdateData, 
      lastUpdatedById: currentUser.id,
      lastUpdatedByName: currentUserName,
      updatedAt: new Date().toISOString(),
    };

    const success = await MissionStorage.saveMission(updatedMission);
    if (success) {
      const reloadedMission = await MissionStorage.getMissionById(updatedMission.id);
      if (reloadedMission) {
        setMissions(prevMissions => 
          prevMissions.map(m => m.id === reloadedMission.id ? reloadedMission : m)
        );
      } else {
        setMissions(prevMissions => 
          prevMissions.map(m => m.id === updatedMission.id ? updatedMission : m)
        );
      }
    }
    return success;
  }, [missions, currentUser, getUserNameById]);

  const updateUnitMissionStatus = useCallback(async (missionId: string, unitId: string, newStatus: MissionStatus, updatedByUserId: string): Promise<boolean> => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return false;

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

    const success = await MissionStorage.saveMission(updatedMission);
    if (success) {
      setMissions(prevMissions => 
        prevMissions.map(m => m.id === missionId ? updatedMission : m)
      );
    }
    return success;
  }, [missions, getUserNameById]);

  const getMissionById = useCallback((missionId: string): Mission | undefined => {
    return missions.find(m => m.id === missionId);
  }, [missions]);

  const getMissionsByUnitId = useCallback((unitId: string): Mission[] => {
    return missions.filter(mission => 
      mission.targetUnitIds.includes(unitId)
    );
  }, [missions]);

  const setUnitMissionFile = useCallback(async (missionId: string, unitId: string, file: File, user: User): Promise<boolean> => {
    if (!user) {
      console.error("Usuário não autenticado para enviar arquivo.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionId);
    if (!missionToUpdate) return false;

    const now = new Date().toISOString();
    const updatedUnitProgress = missionToUpdate.unitProgress.map(up => {
      if (up.unitId === unitId) {
        return {
          ...up,
          status: 'Cumprida' as MissionStatus, // Define como Cumprida ao enviar o arquivo
          submittedFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedById: user.id,
            uploadedByName: user.name,
            uploadedAt: now,
          },
          submittedAt: now,
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
          updatedAt: now,
        };
      }
      return up;
    });

    const updatedMission: Mission = {
      ...missionToUpdate,
      unitProgress: updatedUnitProgress,
      lastUpdatedById: user.id, 
      lastUpdatedByName: user.name,
      updatedAt: now,
    };

    const success = await MissionStorage.saveMission(updatedMission);
    if (success) {
      setMissions(prevMissions => 
        prevMissions.map(m => m.id === missionId ? updatedMission : m)
      );
    }
    return success;
  }, [missions]);

  const clearUnitMissionFile = useCallback(async (missionId: string, unitId: string, user: User): Promise<boolean> => {
    if (!user) {
      console.error("Usuário não autenticado para remover arquivo.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === missionId);
    if (!missionToUpdate) return false;

    const now = new Date().toISOString();
    const updatedUnitProgress = missionToUpdate.unitProgress.map(up => {
      if (up.unitId === unitId) {
        return {
          ...up,
          status: 'Pendente' as MissionStatus, // Volta para Pendente ao remover o arquivo
          submittedFile: null,
          submittedAt: undefined, // Limpa data de submissão
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
          updatedAt: now,
        };
      }
      return up;
    });

    const updatedMission: Mission = {
      ...missionToUpdate,
      unitProgress: updatedUnitProgress,
      lastUpdatedById: user.id, 
      lastUpdatedByName: user.name,
      updatedAt: now,
    };
    const success = await MissionStorage.saveMission(updatedMission);
    if (success) {
      setMissions(prevMissions => 
        prevMissions.map(m => m.id === missionId ? updatedMission : m)
      );
    }
    return success;
  }, [missions]);

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
      clearUnitMissionFile   
    }}>
      {children}
    </MissionsContext.Provider>
  );
};

export const useMissions = () => {
  const context = useContext(MissionsContext);
  if (context === undefined) {
    throw new Error('useMissions must be used within a MissionsProvider');
  }
  return context;
};
