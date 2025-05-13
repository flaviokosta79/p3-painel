import { UserRole } from '@/hooks/useAuth'; // Importar UserRole

// Definir a interface UserData localmente ou importá-la se estiver em um arquivo central de tipos
// Por simplicidade, vamos definir aqui, mas idealmente viria de um local compartilhado se usada em mais lugares.
export interface MockUserData {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  unidadeId: string; // ID da unidade, correspondendo aos IDs em defaultUnits de useUsers.tsx
  ativo: boolean;
  // senha?: string; // Não armazenar senhas em mock data em texto plano
  // createdAt?: string; // Pode ser adicionado se necessário para testes
}

export const usuários: MockUserData[] = [
  {
    id: 'user1',
    nome: 'Admin',
    email: 'admin@teste.com',
    perfil: 'admin',
    unidadeId: 'cpa5',
    ativo: true,
  },
  {
    id: 'user2',
    nome: 'Usuário Comum Teste 1',
    email: 'user1@teste.com',
    perfil: 'user',
    unidadeId: '2', // 28º BPM
    ativo: true,
  },
  {
    id: 'user3',
    nome: 'Usuário Comum Teste 2',
    email: 'user2@teste.com',
    perfil: 'user',
    unidadeId: '1', // 10º BPM
    ativo: false,
  },
  {
    id: 'user4',
    nome: 'Flavio Kosta',
    email: 'flaviokosta@gmail.com',
    perfil: 'admin',
    unidadeId: '3', // 33º BPM
    ativo: true,
  }
];

// Se precisar de outros dados mockados, podem ser adicionados aqui.
// export const подразделения = [...];
