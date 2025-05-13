import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import MissionStorage, { type Mission, type MissionStatus, type DayOfWeek } from '@/db/MissionStorage';
import { useAuth } from './useAuth';
import { useUsers } from './useUsers';
import { v4 as uuidv4 } from 'uuid';

// Exportar tipos para uso externo
export type { Mission, MissionStatus, DayOfWeek };

interface MissionsContextType {
  missions: Mission[];
  loading: boolean;
  addMission: (missionData: Omit<Mission, 'id' | 'status' | 'creationDate' | 'createdBy' | 'createdByName' | 'updatedAt' | 'lastUpdatedById' | 'lastUpdatedByName'>) => Promise<boolean>; 
  deleteMission: (missionId: string) => Promise<boolean>;
  updateMission: (mission: Mission) => Promise<boolean>;
  updateMissionStatus: (missionId: string, newStatus: MissionStatus, updatedByUserId: string) => Promise<boolean>; 
  getMissionById: (missionId: string) => Mission | undefined;
  getMissionsByUnitId: (unitId: string) => Mission[];
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

  const addMission = useCallback(async (missionData: Omit<Mission, 'id' | 'status' | 'creationDate' | 'createdBy' | 'createdByName' | 'updatedAt' | 'lastUpdatedById' | 'lastUpdatedByName'> & { targetUnitIds: string[] }): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para criar missão.");
      return false;
    }
    const currentUserName = currentUser.name || getUserNameById(currentUser.id) || 'Usuário Desconhecido';
    const newMission: Mission = {
      ...missionData,
      id: uuidv4(),
      status: 'Pendente',
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

  const updateMission = useCallback(async (updatedMissionData: Mission): Promise<boolean> => {
    if (!currentUser) {
      console.error("Usuário não autenticado para atualizar missão.");
      return false;
    }
    const missionToUpdate = missions.find(m => m.id === updatedMissionData.id);
    if (!missionToUpdate) return false;

    const currentUserName = currentUser.name || getUserNameById(currentUser.id) || 'Usuário Desconhecido';

    const fullyUpdatedMission: Mission = {
      ...updatedMissionData, 
      lastUpdatedById: currentUser.id,
      lastUpdatedByName: currentUserName,
      updatedAt: new Date().toISOString(),
    };

    const success = await MissionStorage.saveMission(fullyUpdatedMission);
    if (success) {
      setMissions(prevMissions => 
        prevMissions.map(m => m.id === fullyUpdatedMission.id ? fullyUpdatedMission : m)
      );
    }
    return success;
  }, [missions, currentUser, getUserNameById]);

  const updateMissionStatus = useCallback(async (missionId: string, newStatus: MissionStatus, updatedByUserId: string): Promise<boolean> => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return false;

    const updatedByUserName = getUserNameById(updatedByUserId) || 'Usuário Desconhecido';

    const updatedMission: Mission = {
      ...mission,
      status: newStatus,
      lastUpdatedById: updatedByUserId,
      lastUpdatedByName: updatedByUserName,
      updatedAt: new Date().toISOString(),
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
    return missions.filter(mission => mission.targetUnitIds.includes(unitId));
  }, [missions]);

  return (
    <MissionsContext.Provider value={{ missions, loading, addMission, deleteMission, updateMission, updateMissionStatus, getMissionById, getMissionsByUnitId }}>
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
