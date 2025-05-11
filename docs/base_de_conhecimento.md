# Base de Conhecimento: Painel P3 - Sistema de Documentos PMERJ

Este documento serve como um guia central para entender a arquitetura, funcionamento e desenvolvimento do projeto Painel P3, focado no Sistema de Gerenciamento de Documentos da PMERJ.

## 1. Visão Geral do Projeto

O Painel P3 é uma aplicação web front-end desenvolvida para gerenciar o fluxo de documentos da Polícia Militar do Estado do Rio de Janeiro (PMERJ). O sistema permite que usuários enviem documentos, administradores revisem e aprovem esses documentos, e oferece diferentes níveis de acesso conforme o perfil do usuário.

### 1.1. Tecnologias Principais

*   **Framework Front-end:** React (com Vite como builder)
*   **Linguagem:** TypeScript
*   **UI Components:** shadcn-ui (construído sobre Radix UI)
*   **Estilização:** Tailwind CSS
*   **Roteamento:** React Router DOM
*   **Gerenciamento de Estado de Servidor/Cache:** React Query (`@tanstack/react-query`)
*   **Validação de Schema:** Zod
*   **Ícones:** Lucide React
*   **Backend (Potencial/Dependência):** Supabase (`@supabase/supabase-js` está presente nas dependências, mas a autenticação e persistência de dados atuais são mockadas usando `localStorage`).

## 2. Estrutura do Sistema

### 2.1. Estrutura de Diretórios Principal

*   `public/`: Arquivos estáticos servidos diretamente.
*   `src/`: Contém todo o código-fonte da aplicação.
    *   `main.tsx`: Ponto de entrada da aplicação React.
    *   `App.tsx`: Componente raiz, configura provedores globais (QueryClient, Auth, Documents, Users, Tooltip) e o roteamento principal.
    *   `assets/`: Imagens, fontes e outros arquivos estáticos usados pela aplicação.
    *   `components/`:
        *   `ui/`: Componentes do shadcn-ui.
        *   Componentes customizados reutilizáveis (ex: `ProtectedRoute.tsx`, `MainLayout.tsx`, `AppSidebar.tsx`, `DocumentUploadForm.tsx`, `DocumentCard.tsx`).
    *   `hooks/`: Custom Hooks do React.
        *   `useAuth.tsx`: Gerencia estado do usuário e autenticação.
        *   `useDocuments.tsx`: Gerencia estado e operações de documentos.
        *   `useUsers.tsx`: Gerencia estado e operações de usuários.
        *   `use-toast.ts`: Para exibir notificações.
    *   `lib/`: Funções utilitárias, configuração de bibliotecas.
        *   `utils.ts`: Funções utilitárias gerais (ex: `cn` para classnames).
        *   (Potencialmente) `supabaseClient.ts` ou similar para configuração do Supabase.
    *   `pages/`: Componentes que representam as diferentes telas/rotas da aplicação (detalhadas abaixo).
    *   `index.css`: Estilos globais.
*   `vite.config.ts`: Configuração do Vite (servidor de desenvolvimento, plugins, aliases).
*   `tailwind.config.ts`: Configuração do Tailwind CSS.
*   `tsconfig.json` (e variantes): Configurações do TypeScript.
*   `package.json`: Define metadados do projeto, dependências e scripts.
*   `README.md` (raiz): Informações gerais sobre o projeto Lovable original.
*   `docs/README.md`: Informações específicas sobre o sistema PMERJ.

### 2.2. Páginas Principais

1.  **Login.tsx**: Página de login.
2.  **Index.tsx**: Página inicial após o login (dashboard).
3.  **DocumentUpload.tsx**: Página para envio de novos documentos.
4.  **DocumentsList.tsx**: Lista de documentos do usuário logado.
5.  **DocumentDetail.tsx**: Detalhes de um documento específico, permitindo ações com base no status e perfil.
6.  **AdminDocumentsList.tsx**: Lista de todos os documentos (visível para administradores).
7.  **AdminUsersList.tsx**: Lista de usuários do sistema (visível para administradores).
8.  **AdminNewUser.tsx**: Página para criação de novos usuários (visível para administradores).
9.  **AdminEditUser.tsx**: Página para edição de usuários existentes (visível para administradores).
10. **NotFound.tsx**: Página para rotas não encontradas (404).

## 3. Como Funciona o Sistema

### 3.1. Inicialização

1.  `main.tsx` renderiza o componente `App.tsx` no elemento `#root` do `index.html`.
2.  `App.tsx` envolve a aplicação com diversos provedores:
    *   `QueryClientProvider`: Para React Query.
    *   `AuthProvider`: Para gerenciamento de autenticação.
    *   `DocumentsProvider`: Para dados de documentos.
    *   `UsersProvider`: Para dados de usuários.
    *   `TooltipProvider`: Para tooltips.
    *   `Toaster` e `Sonner`: Para notificações.
3.  `BrowserRouter` é configurado para gerenciar as rotas da aplicação.

### 3.2. Autenticação e Controle de Acesso

*   **Estado Atual:** A autenticação e a persistência de dados são **MOCKADAS**.
    *   O hook `useAuth` (`src/hooks/useAuth.tsx`) contém uma lista de usuários mockados (`MOCK_USERS`) com senhas, papéis e unidades.
    *   A função `login` verifica as credenciais contra essa lista mockada.
    *   Os dados do usuário logado são armazenados no `localStorage` (chave `pmerj_user`).
    *   Ao carregar, o `AuthProvider` tenta recuperar o usuário do `localStorage`.
*   **Papéis de Usuário:**
    *   **Admin**: Tem acesso a todas as funcionalidades do sistema, incluindo gerenciamento de usuários e visualização de todos os documentos.
    *   **User**: Pode enviar documentos, visualizar seus próprios documentos e acompanhar o status de seus envios.
*   **Proteção de Rotas:**
    *   O componente `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) é usado em `App.tsx`.
    *   Verifica se o usuário está autenticado via `useAuth().isAuthenticated`.
    *   Se não autenticado, redireciona para `/login`.
    *   Pode opcionalmente verificar um `requiredRole` (ex: "admin"). Se o usuário não tiver o papel, redireciona para a página inicial (`/`) ou outra definida.

### 3.3. Gerenciamento de Documentos (Fluxo de Trabalho)

Os documentos seguem um fluxo de trabalho com diferentes status:

*   **Pendente (pending)**: Documento recém-enviado e aguardando análise do administrador.
*   **Em Revisão (revision)**: Documento que foi analisado pelo administrador e precisa de ajustes por parte do usuário que o enviou.
*   **Aprovado (approved)**: Documento revisado e aprovado pelo administrador.
*   **Concluído (completed)**: Documento cujo ciclo de vida no sistema foi finalizado (pode ter sido arquivado ou processado externamente).

O hook `useDocuments.tsx` é central para gerenciar esses status e as operações relacionadas (envio, atualização, listagem, etc.).

### 3.4. Fluxo de Dados / Gerenciamento de Estado

*   **React Query:** Usado para buscar, armazenar em cache e atualizar dados do servidor (mesmo que atualmente mockados). A configuração está em `App.tsx` com `QueryClientProvider`.
*   **Context API (Custom Hooks):**
    *   `useAuth`: Gerencia estado do usuário e autenticação.
    *   `useDocuments`: Gerencia estado e operações de documentos.
    *   `useUsers`: Gerencia estado e operações de usuários.
*   **LocalStorage:** Utilizado para persistir os dados mockados de usuário e, possivelmente, outros dados para fins de demonstração.

## 4. Como Rodar o Projeto Localmente

1.  **Clone o repositório** (se ainda não o fez).
2.  **Navegue até o diretório do projeto:** `cd p3-painel`
3.  **Instale as dependências:** `npm i` (o `package-lock.json` sugere `npm`).
4.  **Inicie o servidor de desenvolvimento:** `npm run dev`
5.  Abra o navegador no endereço fornecido (geralmente `http://localhost:8080`).

## 5. Como Adicionar Novas Funcionalidades

### 5.1. Adicionar um Novo Campo ao Formulário de Documentos

1.  **Atualize o tipo de Documento:** Modifique a interface/tipo do documento (provavelmente em `useDocuments.tsx` ou um arquivo de tipos dedicado) para incluir o novo campo.
2.  **Modifique o Formulário:**
    *   Se houver um componente de campos de formulário reutilizável (ex: `DocumentFormFields.tsx`), adicione o novo campo lá.
    *   Atualize o hook de gerenciamento do formulário (ex: `useDocumentForm.ts` ou lógica dentro de `DocumentUpload.tsx`/`DocumentEdit.tsx`) para incluir o estado e validação do novo campo (usando `react-hook-form` e `zod`).
3.  **Atualize o Componente de Upload/Edição:** Modifique `DocumentUploadForm.tsx` (ou similar) para renderizar o novo campo e passar as props necessárias para o `react-hook-form`.
4.  **Adapte a Lógica de Submissão:** Certifique-se de que a função de submissão em `useDocuments.tsx` (ou onde for implementada) consiga lidar com o novo campo.

### 5.2. Adicionar uma Nova Página/Rota

1.  **Crie o Componente da Página:**
    *   Crie um novo arquivo `.tsx` em `src/pages/` (ex: `src/pages/NovaPagina.tsx`).
    *   Desenvolva o componente React. Considere usar o `MainLayout.tsx` para manter a consistência visual.
    *   ```tsx
        // src/pages/NovaPagina.tsx
        import MainLayout from '@/components/layout/MainLayout'; // Exemplo

        const NovaPagina = () => {
          return (
            <MainLayout>
              <h1>Nova Página</h1>
              {/* Conteúdo da página */}
            </MainLayout>
          );
        };
        export default NovaPagina;
        ```
2.  **Adicione a Rota em `App.tsx`:**
    *   Importe seu novo componente de página em `src/App.tsx`.
    *   Adicione uma nova `<Route>` dentro do `<Routes>`:
        ```tsx
        // src/App.tsx
        import NovaPagina from "./pages/NovaPagina";
        // ... outras importações

        // Dentro do componente App, dentro de <Routes>
        <Route
          path="/nova-pagina"
          element={
            <ProtectedRoute> {/* Ou <ProtectedRoute requiredRole="admin"> ou sem Proteção */}
              <NovaPagina />
            </ProtectedRoute>
          }
        />
        ```
3.  **Adicione Links de Navegação (se necessário):**
    *   Atualize `AppSidebar.tsx` ou outros menus para incluir um link para `/nova-pagina`, controlando sua visibilidade com base no papel do usuário, se aplicável.

### 5.3. Adicionar um Novo Status de Documento

1.  **Atualize o Tipo `DocumentStatus`:** No arquivo onde `DocumentStatus` é definido (provavelmente em `useDocuments.tsx` ou um arquivo de tipos), adicione o novo valor de status.
2.  **Modifique as Funções em `useDocuments.tsx`:** Adapte as funções que manipulam o status (criação, atualização, lógica de transição de status) para reconhecer e lidar com o novo status.
3.  **Atualize Componentes Visuais:** Modifique componentes que exibem ou interagem com o status (ex: `DocumentCard.tsx`, `DocumentDetail.tsx`, filtros de lista) para refletir o novo status (cores, textos, ações disponíveis).
4.  **Ajuste Ações:** Se o novo status permitir ou restringir certas ações, atualize a lógica em `DocumentDetail.tsx` ou componentes relacionados.

### 5.4. Adicionar Um Novo Perfil de Usuário

1.  **Atualize o Tipo `UserRole`:** Em `useAuth.tsx` (ou onde `UserRole` estiver definido), adicione o novo papel.
2.  **Modifique Funções de Permissão:** Adapte as funções de verificação de permissão em `useAuth.tsx` e `ProtectedRoute.tsx` para considerar o novo papel e suas permissões.
3.  **Atualize Rotas Protegidas:** Em `App.tsx`, ajuste o `requiredRole` nas rotas conforme necessário para o novo perfil.
4.  **Adapte Componentes:** Crie ou modifique componentes para exibir conteúdo ou funcionalidades específicas para o novo perfil. Considere condicionais baseadas em `user.role`.

### 5.5. Implementar uma Nova Funcionalidade de Administração

1.  **Crie Novos Componentes (se necessário):** Coloque componentes específicos de administração em `src/components/admin/` (crie o diretório se não existir) ou dentro de subdiretórios de `src/pages/admin/`.
2.  **Adicione uma Nova Página de Admin:** Crie o arquivo da página em `src/pages/Admin[NomeDaFuncionalidade].tsx` (ex: `src/pages/admin/AdminLogs.tsx`).
3.  **Atualize a Navegação (Sidebar):** Adicione um link para a nova página administrativa em `AppSidebar.tsx`, garantindo que seja visível apenas para usuários com o papel 'admin'.
4.  **Adicione a Rota:** Em `App.tsx`, adicione a rota para a nova página, protegendo-a com `<ProtectedRoute requiredRole="admin">`.

### 5.6. Adicionando Novos Componentes de UI (shadcn-ui)

1.  **Use a CLI do shadcn-ui** (se configurada) ou adicione manualmente.
    *   Comando típico: `npx shadcn-ui@latest add nome-do-componente`
    *   Isso geralmente adiciona o código do componente diretamente em `src/components/ui/`.
2.  **Importe e Use:**
    *   Importe o componente do `shadcn-ui` de `@/components/ui/nome-do-componente` em suas páginas ou outros componentes.

### 5.7. Interagindo com o Backend (Supabase - Futuro)

*   **Situação Atual:** A autenticação e persistência de dados são mockadas.
*   **Passos para Integrar Supabase (Exemplo para Autenticação e Dados):**
    1.  **Configure o Cliente Supabase:**
        *   Crie `src/lib/supabaseClient.ts` (se ainda não existir).
        *   ```typescript
            import { createClient } from '@supabase/supabase-js'

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
              throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
            }

            export const supabase = createClient(supabaseUrl, supabaseAnonKey);
            ```
        *   Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ao seu arquivo `.env` na raiz do projeto. **NÃO versione o `.env` com chaves reais.**
    2.  **Atualize `useAuth.tsx`:**
        *   Substitua a lógica mockada pelas chamadas da API do Supabase: `supabase.auth.signInWithPassword`, `supabase.auth.signOut`, `supabase.auth.onAuthStateChange`.
        *   Os dados do usuário (incluindo o `role`) devem vir do Supabase (ex: da tabela `users` ou `profiles`, e metadados do usuário autenticado). Configure tabelas e RLS (Row Level Security) no Supabase.
    3.  **Gerenciamento de Dados (CRUD com `useDocuments`, `useUsers`):**
        *   Modifique os hooks `useDocuments.tsx` e `useUsers.tsx` para usar o cliente Supabase (`supabase.from('table_name').select()`, `.insert()`, `.update()`, `.delete()`) em conjunto com React Query para as operações CRUD.

## 6. Boas Práticas

1.  **Componentização**: Mantenha os componentes pequenos e focados em uma única responsabilidade. Utilize `src/components/` para componentes reutilizáveis.
2.  **Hooks Personalizados**: Crie hooks em `src/hooks/` para encapsular lógica de estado, efeitos colaterais e interações com contexto ou APIs que sejam reutilizáveis.
3.  **TypeScript**: Utilize tipos de forma consistente para garantir a segurança do código, melhorar a legibilidade e facilitar a refatoração. Defina interfaces e tipos claros para dados e props.
4.  **Consistência Visual**: Utilize os componentes do `shadcn-ui` e siga os padrões de design estabelecidos. Mantenha a consistência em espaçamentos, tipografia e cores.
5.  **Feedback ao Usuário**: Utilize toasts (via `use-toast` ou `sonner`) para informar o usuário sobre o resultado de suas ações (sucesso, erro, aviso).
6.  **Tratamento de Erros**: Implemente tratamento de erros robusto, especialmente para chamadas de API (mesmo mockadas), e forneça feedback claro ao usuário.
7.  **Comentários**: Adicione comentários ao código onde a lógica não for óbvia.

## 7. Como Evitar Quebrar o Sistema

*   **Entenda o Fluxo de Dados:** Especialmente como `useAuth`, `ProtectedRoute`, React Query e os custom hooks (`useDocuments`, `useUsers`) interagem.
*   **Siga os Padrões Existentes:** Observe como as páginas, componentes e hooks atuais são estruturados e implementados.
*   **Use TypeScript:** Aproveite a tipagem para pegar erros em tempo de desenvolvimento. Verifique os erros do TypeScript antes de commitar.
*   **Linting:** Rode `npm run lint` regularmente para verificar a qualidade do código e aderência aos padrões definidos.
*   **Testes (TODO):** Idealmente, adicione testes unitários (ex: com Vitest/React Testing Library) para componentes e hooks críticos, e testes de integração para fluxos de usuário importantes.
*   **Revisão de Código:** Se trabalhar em equipe, peça para outros revisarem suas alterações (Pull Requests).
*   **Backup Local / Controle de Versão:** Faça commits frequentes com mensagens claras. Use branches para novas funcionalidades ou grandes refatorações.
*   **Atualize esta Base de Conhecimento:** Se você descobrir algo novo, implementar uma nova funcionalidade significativa ou fizer mudanças na arquitetura, atualize este documento!

---

**Última Atualização:** (Preencher com data da última modificação)

**TODO:**
*   Detalhar funcionamento dos hooks `useDocuments` e `useUsers` assim que a implementação (mockada ou real) for completamente analisada.
*   Adicionar seção sobre deploy (se diferente do Lovable ou se houver um processo específico para o ambiente PMERJ).
