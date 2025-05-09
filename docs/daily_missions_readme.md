# Funcionalidade de Missões Diárias do 5º CPA

## Visão Geral
A funcionalidade de Missões Diárias foi desenvolvida para o 5º CPA da Polícia Militar do Rio de Janeiro, permitindo o gerenciamento e envio de documentos e relatórios diários necessários para o funcionamento administrativo da organização.

## Funcionalidades Principais

### Para Usuários Regulares
- Visualização das tarefas organizadas por dia da semana
- Upload de documentos para cada tarefa
- Indicação visual do dia atual (hoje)
- Feedback visual de documentos já enviados

### Para Administradores
- Gerenciamento completo de tarefas diárias (CRUD)
- Adição de novas tarefas para cada dia da semana
- Edição de tarefas existentes (nome, descrição, frequência)
- Exclusão de tarefas que não são mais necessárias
- Persistência de configurações no Supabase

## Configuração Técnica

### Pré-requisitos
1. Conta Supabase com acesso administrativo
2. Instalação de dependências necessárias:
   - @supabase/supabase-js
   - uuid
   - @types/uuid (para desenvolvimento)

### Configuração do Supabase
1. Crie um novo projeto no Supabase
2. Execute os scripts SQL no arquivo `docs/supabase_setup_daily_missions.sql` para criar as tabelas necessárias:
   - `daily_missions` - armazena a configuração de missões para cada dia
   - `task_uploads` - rastreia os arquivos enviados pelos usuários

3. Configure um bucket de armazenamento para os documentos:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents', true)
ON CONFLICT (id) DO NOTHING;
```

4. Configure as políticas de acesso ao bucket (execute no SQL Editor do Supabase):
```sql
-- Leitura para usuários autenticados
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Upload para usuários autenticados
CREATE POLICY "Authenticated Users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Permissões de atualização/exclusão apenas para próprios uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid() = owner);

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid() = owner);
```

### Configuração do Ambiente
1. Configure as variáveis de ambiente no arquivo `.env`:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

## Utilização

### Para Usuários
1. Acesse a página "Missões Diárias" no menu lateral
2. Navegue entre as abas para visualizar tarefas de cada dia da semana
3. Faça upload dos documentos necessários usando os campos de arquivo
4. Receba confirmação visual quando o documento for enviado com sucesso

### Para Administradores
1. Acesse a página "Gestão de Missões" no menu administrativo
2. Use as abas para navegar entre os dias da semana
3. Adicione novas tarefas usando o botão "Adicionar Tarefa"
4. Edite tarefas existentes clicando no ícone de lápis
5. Exclua tarefas usando o ícone de lixeira (confirmação necessária)
6. Clique em "Salvar Alterações" para persistir todas as mudanças

## Estrutura de Dados

### DailyTask
```typescript
interface DailyTask {
  id: string;
  name: string;
  description?: string;
  frequency?: string;
}
```

### DayMissions
```typescript
interface DayMissions {
  day: string;
  dayNumber: number;
  tasks: DailyTask[];
}
```

## Visão Técnica

A funcionalidade utiliza um Context Provider (`DailyMissionsProvider`) para gerenciar o estado global das missões e para disponibilizar funções de gerenciamento. Os dados são armazenados no Supabase e mantidos em cache localmente para melhor desempenho.

Os arquivos enviados são armazenados no bucket do Supabase Storage, e os metadados dos uploads são rastreados na tabela `task_uploads`, permitindo verificar quais documentos já foram enviados por cada usuário.

## Manutenção e Suporte

Para questões técnicas ou suporte relacionado a esta funcionalidade, entre em contato com a equipe de desenvolvimento.
