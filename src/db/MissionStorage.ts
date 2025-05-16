import { supabase } from '@/lib/supabaseClient'; // Importar o cliente Supabase
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

// A interface Mission permanece a mesma, mas seus campos serão mapeados para snake_case no Supabase
export interface Mission {
  id: string; // UUID
  title: string;
  description?: string;
  targetUnitIds: string[]; // Array de UUIDs das unidades
  unitProgress: UnitMissionProgress[]; // Armazenado como JSONB
  dayOfWeek: DayOfWeek;
  createdBy: User['id'];
  createdByName: User['name'];
  creationDate: string; // TIMESTAMPTZ
  updatedAt?: string; // TIMESTAMPTZ
  lastUpdatedById?: string; 
  lastUpdatedByName?: string;
  requiresFileSubmission: boolean; // Novo campo
}

// Helper para mapear Mission para o formato da tabela Supabase (snake_case)
const missionToSupabaseRow = (mission: Mission, lastUpdatedById: User['id'], lastUpdatedByName: User['name']) => ({
  id: mission.id,
  title: mission.title,
  description: mission.description,
  target_unit_ids: mission.targetUnitIds,
  unit_progress: mission.unitProgress,
  day_of_week: mission.dayOfWeek,
  created_by: mission.createdBy,
  created_by_name: mission.createdByName,
  creation_date: mission.creationDate,
  updated_at: mission.updatedAt,
  last_updated_by_id: lastUpdatedById,
  last_updated_by_name: lastUpdatedByName,
  requires_file_submission: mission.requiresFileSubmission, // Novo campo mapeado
});

// Helper para mapear a linha do Supabase para Mission (camelCase)
export const supabaseRowToMission = (row: any): Mission => ({
  id: row.id,
  title: row.title,
  description: row.description,
  targetUnitIds: row.target_unit_ids || [],
  unitProgress: row.unit_progress || [],
  dayOfWeek: row.day_of_week,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  creationDate: row.creation_date,
  updatedAt: row.updated_at,
  lastUpdatedById: row.last_updated_by_id,
  lastUpdatedByName: row.last_updated_by_name,
  requiresFileSubmission: row.requires_file_submission === undefined ? true : row.requires_file_submission, // Novo campo mapeado, default true se não existir
});

const MissionStorage = {
  saveMission: async (mission: Mission, user: User): Promise<boolean> => {
    const missionRow = missionToSupabaseRow(mission, user.id, user.name);

    try {
      // Verifica se a missão já existe para decidir entre insert e update
      // @ts-ignore PostgrestError pode ter status e statusText
      const { data: existingMission, error: fetchErrorResponse }: { data: any, error: any } = await supabase
        .from('missoes')
        .select('id') // Revertido para 'id'
        .eq('id', mission.id)
        .single();

      const isErrorPGRST116 = fetchErrorResponse && fetchErrorResponse.code === 'PGRST116';

      if (fetchErrorResponse && !isErrorPGRST116) {
        console.error('>>> MissionStorage: Erro INESPERADO ao verificar missão existente:', fetchErrorResponse);
      } else if (isErrorPGRST116) {
        // Silenciosamente trata PGRST116 como 'não encontrado'
      }

      if (existingMission) { 
        // Lógica de UPDATE
        const updatePayload = { ...missionRow };
        delete updatePayload.id; // Não atualize o ID
        delete updatePayload.created_by; // Geralmente não se atualiza o criador original
        delete updatePayload.created_by_name;
        delete updatePayload.creation_date;

        const { error: updateError } = await supabase
          .from('missoes')
          .update(updatePayload)
          .eq('id', mission.id);
        if (updateError) {
          console.error('Erro ao ATUALIZAR missão no Supabase:', updateError);
          return false;
        }
        console.log(`Missão ${mission.id} ATUALIZADA no Supabase.`);
      } else {
        // Lógica de INSERT
        const { error: insertError } = await supabase
          .from('missoes')
          .insert(missionRow);
        if (insertError) {
          console.error('Erro ao inserir missão no Supabase:', insertError);
          return false;
        }
        console.log(`Missão ${mission.id} inserida no Supabase.`);
      }
      return true;
    } catch (error) {
      console.error('Erro geral ao salvar missão no Supabase:', error);
      return false;
    }
  },

  getMissionById: async (id: string): Promise<Mission | null> => {
    try {
      const { data, error } = await supabase
        .from('missoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrada
        console.error('Erro ao buscar missão por ID no Supabase:', error);
        return null;
      }
      return data ? supabaseRowToMission(data) : null;
    } catch (error) {
      console.error('Erro ao buscar missão por ID no Supabase:', error);
      return null;
    }
  },

  getAllMissions: async (): Promise<Mission[]> => {
    try {
      const { data, error } = await supabase
        .from('missoes')
        .select('*')
        .order('creation_date', { ascending: false }); // Opcional: ordenar

      if (error) {
        console.error('Erro ao buscar todas as missões no Supabase:', error);
        return [];
      }
      return data ? data.map(supabaseRowToMission) : [];
    } catch (error) {
      console.error('Erro ao buscar todas as missões no Supabase:', error);
      return [];
    }
  },

  deleteMission: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('missoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir missão no Supabase:', error);
        return false;
      }
      console.log(`Missão ${id} excluída do Supabase.`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir missão no Supabase:', error);
      return false;
    }
  },
};

export default MissionStorage;
