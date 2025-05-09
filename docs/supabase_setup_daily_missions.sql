
-- INSTRUÇÕES DE USO:
-- Este arquivo contém os comandos SQL necessários para configurar o banco de dados do Supabase
-- para a funcionalidade de Missões Diárias do 5º CPA.
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/[seu-projeto]/sql)

-- ========== PARTE 1: CRIAÇÃO DE TABELAS ==========
-- Criar a tabela de missões diárias para armazenar configurações de tarefas
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  tasks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar a tabela de uploads para rastrear arquivos enviados
CREATE TABLE task_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhorar o desempenho das consultas
CREATE INDEX idx_task_uploads_task_id ON task_uploads(task_id);
CREATE INDEX idx_task_uploads_user_id ON task_uploads(user_id);
CREATE INDEX idx_task_uploads_uploaded_at ON task_uploads(uploaded_at);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o campo updated_at na tabela daily_missions
CREATE TRIGGER update_daily_missions_updated_at
BEFORE UPDATE ON daily_missions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- ========== PARTE 2: CONFIGURAÇÃO DE STORAGE ==========
-- Criar bucket de armazenamento para documentos de missões diárias
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ========== PARTE 3: POLÍTICAS DE ACESSO ==========
-- Permitir que usuários autenticados leiam qualquer arquivo no bucket documents
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Permitir que usuários autenticados façam upload de arquivos
CREATE POLICY "Authenticated Users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Permitir que usuários atualizem apenas seus próprios uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Permitir que usuários excluam apenas seus próprios uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- ========== PARTE 4: DADOS INICIAIS ==========
-- Inserir dados iniciais para as missões diárias
INSERT INTO daily_missions (day, day_number, tasks)
VALUES 
  ('Segunda-feira', 1, '[
    {"id": "op-police-mon", "name": "Relatório Operações Policiais"},
    {"id": "cargo-theft-mon", "name": "Relatório Roubo de carga"},
    {"id": "rush-op", "name": "Planejamento Operação \"RUSH\" (PM/3)", "frequency": "Quinzenal"},
    {"id": "revista-op", "name": "Planejamento Operação \"REVISTA\" (PM/3)", "frequency": "Quinzenal"},
    {"id": "staff-plan", "name": "Planilha de Emprego de Efetivo", "description": "Salvar na pasta"},
    {"id": "ptou-plan", "name": "Planejamento \"PTOU\" atualizado"},
    {"id": "ptou-report", "name": "Relatório \"PTOU\" – msg nº 920 do EME e 287 5º CPA"},
    {"id": "sme-missions-mon", "name": "Encaminhar Missões da SME e salvar os relatórios"}
  ]'::jsonb),
  ('Terça-feira', 2, '[
    {"id": "op-police-tue", "name": "Relatório Operações Policiais"},
    {"id": "cargo-theft-tue", "name": "Relatório Roubo de carga"},
    {"id": "safe-displace", "name": "Relatório Deslocamento Seguro (PM/3)"},
    {"id": "in-067", "name": "Relatório IN nº 067 (Quando o PM pode Atirar)", "description": "Semana anterior"},
    {"id": "school-visit", "name": "Relatório Visita Escolar", "description": "Semana anterior"},
    {"id": "sme-missions-tue", "name": "Encaminhar Missões da SME e salvar os relatórios"}
  ]'::jsonb),
  ('Quarta-feira', 3, '[
    {"id": "op-police-wed", "name": "Relatório Operações Policiais"},
    {"id": "cargo-theft-wed", "name": "Relatório Roubo de carga"},
    {"id": "base-closure", "name": "Planejamento Fecha Quartel da próxima semana"},
    {"id": "sme-missions-wed", "name": "Encaminhar Missões da SME e salvar os relatórios"},
    {"id": "orders-in-force", "name": "Remeter as ordens em vigor para corregedoria", "description": "E-mail: sisd@cintpm.rj.gov.br"}
  ]'::jsonb),
  ('Quinta-feira', 4, '[
    {"id": "op-police-thu", "name": "Relatório Operações Policiais"},
    {"id": "cargo-theft-thu", "name": "Relatório Roubo de carga"},
    {"id": "safe-displace-plan", "name": "Planejamento deslocamento Seguro (PM/3)"},
    {"id": "arep3-plan", "name": "Planejamento ARep 3 – Diretriz 008/2020 (PM/3)"},
    {"id": "sme-missions-thu", "name": "Encaminhar Missões da SME e salvar os relatórios"}
  ]'::jsonb),
  ('Sexta-feira', 5, '[
    {"id": "op-police-fri", "name": "Relatório Operações Policiais"},
    {"id": "cargo-theft-fri", "name": "Relatório Roubo de carga"},
    {"id": "sme-missions-fri", "name": "Encaminhar Missões da SME e salvar os relatórios"},
    {"id": "orders-summary", "name": "Fazer os resumos das ordens em Vigor"}
  ]'::jsonb);
