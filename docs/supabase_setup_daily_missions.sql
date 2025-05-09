
-- Create the daily_missions table for storing mission configurations
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  tasks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the task_uploads table to track uploaded files
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

-- Create an index on task_id and user_id for quick lookups
CREATE INDEX idx_task_uploads_task_id ON task_uploads(task_id);
CREATE INDEX idx_task_uploads_user_id ON task_uploads(user_id);
CREATE INDEX idx_task_uploads_uploaded_at ON task_uploads(uploaded_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at column on daily_missions table
CREATE TRIGGER update_daily_missions_updated_at
BEFORE UPDATE ON daily_missions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for daily missions documents if it doesn't exist
-- Note: Run this in the Supabase SQL editor
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'Documents', TRUE)
-- ON CONFLICT (id) DO NOTHING;

-- Create policies for storage bucket access
-- For the documents bucket, allow users to read any file
-- CREATE POLICY "Public Read Access"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload files
-- CREATE POLICY "Authenticated Users can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Allow users to update and delete only their own uploads
-- CREATE POLICY "Users can update own uploads"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'documents' AND auth.uid() = owner);

-- CREATE POLICY "Users can delete own uploads"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Sample data insertion for testing
-- INSERT INTO daily_missions (day, day_number, tasks)
-- VALUES 
--   ('Segunda-feira', 1, '[
--     {"id": "op-police-mon", "name": "Relatório Operações Policiais"},
--     {"id": "cargo-theft-mon", "name": "Relatório Roubo de carga"},
--     {"id": "rush-op", "name": "Planejamento Operação \"RUSH\" (PM/3)", "frequency": "Quinzenal"},
--     {"id": "revista-op", "name": "Planejamento Operação \"REVISTA\" (PM/3)", "frequency": "Quinzenal"},
--     {"id": "staff-plan", "name": "Planilha de Emprego de Efetivo", "description": "Salvar na pasta"},
--     {"id": "ptou-plan", "name": "Planejamento \"PTOU\" atualizado"},
--     {"id": "ptou-report", "name": "Relatório \"PTOU\" – msg nº 920 do EME e 287 5º CPA"},
--     {"id": "sme-missions-mon", "name": "Encaminhar Missões da SME e salvar os relatórios"}
--   ]'::jsonb);
