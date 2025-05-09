# Guia de Solução de Problemas do Supabase - Missões Diárias

Este documento contém instruções para solucionar problemas comuns encontrados na conexão e utilização do Supabase no módulo de Missões Diárias.

## Erros Comuns e Soluções

### 1. Erro 400 (Bad Request) na consulta de missões diárias

**Erro:**
```
GET https://plclxpkwaopftzmiafhn.supabase.co/rest/v1/daily_missions?select=*&order=dayNumber.asc 400 (Bad Request)
```

**Causa:**
Este erro ocorre porque o campo `dayNumber` está sendo referenciado no formato camelCase, mas no banco de dados Supabase ele está definido como `day_number` (snake_case).

**Solução:**
Foi aplicada uma correção para utilizar o nome correto dos campos no formato snake_case em todas as consultas ao Supabase.

### 2. Erro "Supabase client não está disponível"

**Causa:**
Isto pode ocorrer se as variáveis de ambiente do Supabase não estiverem configuradas corretamente ou se houver problemas de conexão com o servidor.

**Solução:**

1. Verifique se as variáveis de ambiente estão definidas no arquivo `.env`:
   ```
   VITE_SUPABASE_URL=https://plclxpkwaopftzmiafhn.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Use a página de diagnóstico (disponível em `/admin/diagnostico`) para verificar a conexão e o estado das tabelas.

### 3. Tabelas ou Bucket não existem

Se o diagnóstico indicar que tabelas ou o bucket de armazenamento não existem, será necessário executar o script SQL fornecido em `docs/supabase_setup_daily_missions.sql`.

## Configurando o Banco de Dados

Para configurar corretamente o banco de dados do Supabase:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com) e selecione seu projeto.

2. Vá para o **SQL Editor** e cole o conteúdo do arquivo `docs/supabase_setup_daily_missions.sql`.

3. Execute o script completo para criar:
   - Tabela `daily_missions` com formato correto
   - Tabela `task_uploads` para rastrear uploads
   - Bucket de storage `documents`
   - Políticas de acesso adequadas

4. Após executar o script, use a ferramenta de diagnóstico para confirmar que tudo está funcionando corretamente.

## Soluções Adicionais Implementadas

Para melhorar a robustez da aplicação, foram implementadas várias melhorias:

1. **Carregamento Resiliente:**
   - Primeiro obtém dados do localStorage para melhorar a UX
   - Tenta carregar dados do Supabase em segundo plano
   - Mantém funcionamento offline com dados locais

2. **Tratamento Robusto de Erros:**
   - Melhor manipulação de erros de conexão
   - Fallback para armazenamento local quando o Supabase não está disponível
   - Verificação da existência do bucket antes de tentativas de upload

3. **Formatação Correta de Dados:**
   - Conversão adequada entre camelCase (frontend) e snake_case (backend)
   - Processamento adequado de formatos JSON

## Ferramenta de Diagnóstico

A aplicação agora inclui uma página de diagnóstico em `/admin/diagnostico` que:

1. Verifica se o Supabase está acessível
2. Confirma a existência das tabelas necessárias
3. Verifica o bucket de armazenamento
4. Sugere ações corretivas quando problemas são encontrados

Esta ferramenta é especialmente útil para administradores do sistema identificarem e solucionarem problemas relacionados ao Supabase.
