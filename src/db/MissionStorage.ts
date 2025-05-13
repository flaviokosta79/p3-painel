import type { User } from '@/hooks/useAuth';

export type MissionStatus = 'Pendente' | 'Cumprida' | 'Não Cumprida' | 'Atrasada';
export type DayOfWeek = 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira' | 'Sábado' | 'Domingo';

export interface SubmittedFile {
  name: string;
  type: string;
  size: number;
  uploadedById: User['id'];
  uploadedByName: User['name'];
  uploadedAt: string; 
}

export interface UnitMissionProgress {
  unitId: string;
  status: MissionStatus;
  submittedFile?: SubmittedFile | null;
  submittedAt?: string; 
  lastUpdatedById?: User['id']; 
  lastUpdatedByName?: User['name'];
  updatedAt?: string; 
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  targetUnitIds: string[]; 
  unitProgress: UnitMissionProgress[]; 
  dayOfWeek: DayOfWeek;
  createdBy: User['id'];
  createdByName: User['name'];
  creationDate: string; 
  updatedAt?: string; 
  lastUpdatedById?: string; 
  lastUpdatedByName?: string;
}

interface StoredMission {
  id: string;
  content: Mission;
  lastModified: string;
}

const MISSION_STORAGE_KEY = 'db_missions_v2'; 
const OLD_MISSION_STORAGE_KEY = 'db_missions';

const migrateOldMissionData = (oldMission: any): Mission => {
  const newUnitProgress: UnitMissionProgress[] = (oldMission.targetUnitIds || []).map((unitId: string) => ({
    unitId: unitId,
    status: oldMission.status || 'Pendente', 
    submittedFile: oldMission.submittedFile || null,
    submittedAt: oldMission.status === 'Cumprida' ? oldMission.updatedAt || oldMission.creationDate : undefined,
    lastUpdatedById: oldMission.lastUpdatedById || oldMission.createdBy,
    lastUpdatedByName: oldMission.lastUpdatedByName || oldMission.createdByName,
    updatedAt: oldMission.updatedAt || oldMission.creationDate,
  }));

  return {
    id: oldMission.id,
    title: oldMission.title,
    description: oldMission.description,
    targetUnitIds: oldMission.targetUnitIds || [],
    unitProgress: newUnitProgress,
    dayOfWeek: oldMission.dayOfWeek,
    createdBy: oldMission.createdBy,
    createdByName: oldMission.createdByName,
    creationDate: oldMission.creationDate,
    updatedAt: oldMission.updatedAt,
    lastUpdatedById: oldMission.lastUpdatedById,
    lastUpdatedByName: oldMission.lastUpdatedByName,
  };
};

const MissionStorage = {
  saveMission: async (mission: Mission): Promise<boolean> => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const existingMissionIndex = storedMissions.findIndex(m => m.id === mission.id);

      const currentUnitIdsInProgess = mission.unitProgress.map(up => up.unitId);
      mission.targetUnitIds.forEach(targetId => {
        if (!currentUnitIdsInProgess.includes(targetId)) {
          mission.unitProgress.push({
            unitId: targetId,
            status: 'Pendente',
            updatedAt: new Date().toISOString(),
          });
        }
      });
      mission.unitProgress = mission.unitProgress.filter(up => mission.targetUnitIds.includes(up.unitId));

      if (existingMissionIndex !== -1) {
        storedMissions[existingMissionIndex] = {
          id: mission.id,
          content: mission,
          lastModified: new Date().toISOString(),
        };
      } else {
        storedMissions.push({
          id: mission.id,
          content: mission,
          lastModified: new Date().toISOString(),
        });
      }

      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(storedMissions));
      console.log(`Missão ${mission.id} salva (v2).`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar missão (v2):', error);
      return false;
    }
  },

  getMissionById: (id: string): Mission | null => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const foundMission = storedMissions.find(m => m.id === id);
      return foundMission ? foundMission.content : null;
    } catch (error) {
      console.error('Erro ao buscar missão (v2):', error);
      return null;
    }
  },

  getAllMissions: (): Mission[] => {
    return MissionStorage.getAllStoredMissions().map(sm => sm.content);
  },

  getAllStoredMissions: (): StoredMission[] => {
    try {
      let storedData = localStorage.getItem(MISSION_STORAGE_KEY);
      if (!storedData) {
        const oldDataString = localStorage.getItem(OLD_MISSION_STORAGE_KEY);
        if (oldDataString) {
          console.log('Migrando dados de missões antigas...');
          const oldStoredMissions: any[] = JSON.parse(oldDataString);
          const newStoredMissions: StoredMission[] = oldStoredMissions.map(oldSm => ({
            id: oldSm.id,
            content: migrateOldMissionData(oldSm.content || oldSm), 
            lastModified: oldSm.lastModified || new Date().toISOString(),
          }));
          localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(newStoredMissions));
          console.log('Migração concluída.');
          storedData = JSON.stringify(newStoredMissions);
        } else {
          return []; 
        }
      }
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Erro ao buscar missões armazenadas (v2):', error);
      return [];
    }
  },

  deleteMission: async (id: string): Promise<boolean> => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const updatedMissions = storedMissions.filter(m => m.id !== id);
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(updatedMissions));
      console.log(`Missão ${id} excluída (v2).`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir missão (v2):', error);
      return false;
    }
  },
};

export default MissionStorage;
