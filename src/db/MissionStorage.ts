import type { User } from '@/hooks/useAuth'; // Usaremos para createdBy

export type MissionStatus = 'Pendente' | 'Cumprida' | 'Não Cumprida' | 'Atrasada';
export type DayOfWeek = 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira' | 'Sábado' | 'Domingo';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  targetUnitIds: string[];
  dayOfWeek: DayOfWeek;
  status: MissionStatus;
  createdBy: User['id']; // ID do admin que criou
  createdByName: User['name']; // Nome do admin
  creationDate: string;  // Data de criação da missão (ISO string)
  updatedAt?: string; // Adicionado
  lastUpdatedById?: string; // Adicionado (ID do usuário que atualizou por último)
  lastUpdatedByName?: string; // Adicionado (Nome do usuário que atualizou por último)
  submittedFile?: {
    name: string;
    type: string;
    size: number;
    // storageUrl?: string; // Futuramente, para o link do arquivo armazenado
    uploadedById: User['id'];
    uploadedByName: User['name'];
    uploadedAt: string; // ISO string
  } | null;
  // submittedDocumentIds?: string[]; // Futura melhoria
}

// Interface para os dados armazenados, similar ao DocumentStorage
interface StoredMission {
  id: string;
  content: Mission;
  lastModified: string;
}

const MISSION_STORAGE_KEY = 'db_missions';

const MissionStorage = {
  /**
   * Salva uma missão.
   */
  saveMission: async (mission: Mission): Promise<boolean> => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const existingMissionIndex = storedMissions.findIndex(m => m.id === mission.id);

      if (existingMissionIndex !== -1) {
        // Atualiza missão existente
        storedMissions[existingMissionIndex] = {
          id: mission.id,
          content: mission,
          lastModified: new Date().toISOString(),
        };
      } else {
        // Adiciona nova missão
        storedMissions.push({
          id: mission.id,
          content: mission,
          lastModified: new Date().toISOString(),
        });
      }

      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(storedMissions));
      console.log(`Missão ${mission.id} salva.`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar missão:', error);
      return false;
    }
  },

  /**
   * Recupera uma missão pelo ID.
   */
  getMissionById: (id: string): Mission | null => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const foundMission = storedMissions.find(m => m.id === id);
      return foundMission ? foundMission.content : null;
    } catch (error) {
      console.error('Erro ao buscar missão:', error);
      return null;
    }
  },

  /**
   * Recupera todas as missões (apenas o conteúdo Mission).
   */
  getAllMissions: (): Mission[] => {
    return MissionStorage.getAllStoredMissions().map(sm => sm.content);
  },

  /**
   * Recupera todas as missões armazenadas (com metadados).
   */
  getAllStoredMissions: (): StoredMission[] => {
    try {
      const storedData = localStorage.getItem(MISSION_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Erro ao buscar missões armazenadas:', error);
      return [];
    }
  },

  /**
   * Exclui uma missão pelo ID.
   */
  deleteMission: async (id: string): Promise<boolean> => {
    try {
      const storedMissions = MissionStorage.getAllStoredMissions();
      const updatedMissions = storedMissions.filter(m => m.id !== id);
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(updatedMissions));
      console.log(`Missão ${id} excluída.`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir missão:', error);
      return false;
    }
  },
};

export default MissionStorage;
