
# PMERJ - Sistema de Documentos

## Visão Geral

Este sistema foi desenvolvido para gerenciar o fluxo de documentos da Polícia Militar do Estado do Rio de Janeiro (PMERJ). O sistema permite que usuários enviem documentos, administradores revisem e aprovem esses documentos, e oferece diferentes níveis de acesso conforme o perfil do usuário.

## Estrutura do Sistema

### Autenticação e Autorização

O sistema utiliza um sistema de autenticação próprio com diferentes papéis de usuário:
- **Admin**: Tem acesso a todas as funcionalidades do sistema, incluindo gerenciamento de usuários
- **User**: Pode enviar documentos e acompanhar o status de seus envios

A autenticação é gerenciada pelo hook `useAuth` que mantém o estado do usuário logado e fornece funções para login, logout e verificação de permissões.

### Gerenciamento de Documentos

Os documentos seguem um fluxo de trabalho com diferentes status:
- **Pendente (pending)**: Documento enviado e aguardando análise
- **Em Revisão (revision)**: Documento que precisa de ajustes
- **Aprovado (approved)**: Documento aprovado pelo administrador
- **Concluído (completed)**: Documento finalizado no sistema

### Principais Componentes

#### Hooks Principais

1. **useAuth.tsx**: Gerencia autenticação e informações do usuário
2. **useDocuments.tsx**: Gerencia operações relacionadas a documentos (adicionar, atualizar status, comentar)
3. **useUsers.tsx**: Gerencia operações relacionadas a usuários (adicionar, atualizar, desativar)

#### Componentes de Interface

1. **MainLayout.tsx**: Layout principal que inclui a barra lateral e o cabeçalho
2. **AppSidebar.tsx**: Barra lateral de navegação
3. **DocumentUploadForm.tsx**: Formulário para envio de documentos
4. **DocumentCard.tsx**: Card que exibe informações resumidas de um documento

#### Páginas

1. **Login.tsx**: Página de login
2. **Index.tsx**: Página inicial após o login
3. **DocumentUpload.tsx**: Página para envio de novos documentos
4. **DocumentsList.tsx**: Lista de documentos do usuário
5. **DocumentDetail.tsx**: Detalhes de um documento específico
6. **AdminDocumentsList.tsx**: Lista de todos os documentos (para administradores)
7. **AdminUsersList.tsx**: Lista de usuários (para administradores)
8. **AdminNewUser.tsx**: Página para criação de novos usuários
9. **AdminEditUser.tsx**: Página para edição de usuários existentes

## Fluxo de Dados

O sistema utiliza React Query para gerenciar o estado dos dados e as requisições. Os dados são armazenados localmente utilizando o localStorage para fins de demonstração, mas em um ambiente de produção seriam integrados com uma API back-end.

## Como Adicionar Novas Funcionalidades

### 1. Adicionar um Novo Campo ao Formulário de Documentos

1. Atualize o tipo de documento em `useDocuments.tsx`
2. Modifique `DocumentFormFields.tsx` para incluir o novo campo
3. Atualize `useDocumentForm.ts` para gerenciar o estado do novo campo
4. Modifique `DocumentUploadForm.tsx` para passar as novas props

### 2. Adicionar uma Nova Página

1. Crie o arquivo da página em `src/pages/`
2. Utilize o `MainLayout` para manter a consistência visual
3. Adicione a rota no `App.tsx`, utilizando o componente `ProtectedRoute` para páginas que exigem autenticação
4. Se necessário, adicione um link na barra lateral em `AppSidebar.tsx`

### 3. Adicionar um Novo Status de Documento

1. Atualize o tipo `DocumentStatus` em `useDocuments.tsx`
2. Modifique as funções relacionadas ao status em `useDocuments.tsx`
3. Atualize os componentes visuais que exibem o status (como `DocumentCard.tsx`) para incluir o novo status
4. Se necessário, adicione novas ações no componente `DocumentDetail.tsx`

### 4. Adicionar Um Novo Perfil de Usuário

1. Atualize o tipo `UserRole` em `useAuth.tsx`
2. Modifique as funções de verificação de permissão em `useAuth.tsx`
3. Atualize as rotas protegidas em `App.tsx` para incluir verificação do novo perfil
4. Adicione ou modifique componentes para exibir conteúdo específico para o novo perfil

### 5. Implementar uma Nova Funcionalidade de Administração

1. Crie novos componentes em `src/components/admin/`
2. Adicione uma nova página em `src/pages/Admin[NomeDaFuncionalidade].tsx`
3. Atualize o `AppSidebar.tsx` para incluir link para a nova página (apenas para administradores)
4. Adicione a rota no `App.tsx` com a proteção de rota adequada

## Boas Práticas

1. **Componentização**: Mantenha os componentes pequenos e focados em uma única responsabilidade
2. **Hooks Personalizados**: Crie hooks para lógica reutilizável
3. **TypeScript**: Utilize tipos para garantir a segurança e documentação do código
4. **Consistência Visual**: Utilize os componentes do Shadcn UI e mantenha padrões visuais consistentes
5. **Feedback ao Usuário**: Utilize toasts para informar sobre o resultado das ações

## Tecnologias Utilizadas

- **React**: Biblioteca para construção de interfaces
- **React Router**: Para roteamento entre páginas
- **React Query**: Para gerenciamento de estado e requisições
- **Tailwind CSS**: Para estilização
- **Shadcn UI**: Biblioteca de componentes baseada em Radix UI
- **TypeScript**: Para tipagem estática e segurança do código
- **Lucide Icons**: Para ícones

---

Este documento serve como um guia para entender e estender o sistema. Para mais detalhes técnicos, consulte os comentários no código fonte.
