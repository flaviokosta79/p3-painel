import { useState } from "react";
import { useUsers, UserData } from "@/hooks/useUsers";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, MoreHorizontal, Edit, Trash, Check, UserX, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminUsersList = () => {
  const { users, loading, deleteUser, toggleUserStatus, getUnitNameById } = useUsers();
  const navigate = useNavigate();
  
  console.log('[AdminUsersList] Usuários recebidos:', users); // Log para verificar usuários no componente
  if (users && users.length > 0) {
    const adminUser = users.find(u => u.id === 'user1');
    if (adminUser) {
      console.log('[AdminUsersList] Usuário Admin (user1):', adminUser);
      console.log('[AdminUsersList] Nome da unidade para cpa5:', getUnitNameById('cpa5'));
      console.log('[AdminUsersList] Nome da unidade para user1.unidadeId:', getUnitNameById(adminUser.unidadeId));
    }
  }

  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrar usuários com base na pesquisa
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true; 
    const term = searchTerm.toLowerCase();
    const unitName = getUnitNameById(user.unidadeId)?.toLowerCase() || "";

    return (
      user.nome.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      unitName.includes(term)
    );
  });
  
  // Ordenar usuários (ativos primeiro, depois por nome)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Ordenar por status (ativos primeiro)
    if (a.ativo && !b.ativo) return -1;
    if (!a.ativo && b.ativo) return 1;
    
    // Ordenar por nome
    return a.nome.localeCompare(b.nome);
  });
  
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => { 
    try {
      await toggleUserStatus(userId, !currentStatus); 
    } catch (error) {
      console.error("Erro ao alterar status do usuário:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie os usuários do sistema
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/admin/users/new")} 
            className="bg-pmerj-blue hover:bg-pmerj-blue/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou unidade..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="py-8 text-center">Carregando usuários...</div>
            ) : sortedUsers.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableCaption>Lista de usuários do sistema</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={user.perfil === "admin" ? "bg-pmerj-blue" : "bg-gray-500"}>
                            {user.perfil === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getUnitNameById(user.unidadeId) || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={user.ativo ? "bg-green-500" : "bg-red-500"}>
                            {user.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/users/edit/${user.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              {/* Opção para Ativar/Desativar Usuário */}
                              <Tooltip delayDuration={100}>
                                <AlertDialog>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      {/* O DropdownMenuItem é o gatilho real */}
                                      <DropdownMenuItem 
                                        onSelect={(e) => {
                                          e.preventDefault(); 
                                          // A ação de toggle é feita no AlertDialogAction
                                        }}
                                        disabled={user.perfil === 'admin'} 
                                        className={`flex items-center ${user.perfil === 'admin' ? "text-muted-foreground cursor-not-allowed" : ""}`} 
                                        aria-label={user.ativo ? "Desativar usuário" : "Ativar usuário"}
                                      >
                                        {user.ativo ? (
                                          <><UserX className="mr-2 h-4 w-4" /> Desativar</>
                                        ) : (
                                          <><UserCheck className="mr-2 h-4 w-4" /> Ativar</>
                                        )}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="center">
                                    {user.perfil === 'admin' ? "Não é possível alterar o status de administradores" : (user.ativo ? "Desativar este usuário" : "Ativar este usuário")}
                                  </TooltipContent>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Você tem certeza que deseja {user.ativo ? "desativar" : "ativar"} o usuário {user.nome}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleToggleUserStatus(user.id, user.ativo)}> 
                                        {user.ativo ? "Desativar" : "Ativar"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Tooltip>

                              {/* Opção para Excluir Usuário (apenas se não for admin) */}
                              {user.perfil !== 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      onSelect={(e) => e.preventDefault()} 
                                      className="text-red-600 hover:!text-red-700"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Você tem certeza que deseja excluir o usuário {user.nome}? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum usuário encontrado
                {searchTerm && " com os critérios de busca atuais"}.
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} usuário(s) encontrado(s)
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminUsersList;
