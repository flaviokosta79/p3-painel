
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
import { Plus, Search, MoreHorizontal, Edit, Trash, Check, UserX, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminUsersList = () => {
  const { users, loading, deleteUser, toggleUserStatus } = useUsers();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrar usuários com base na pesquisa
  const filteredUsers = users.filter((user) => {
    if (
      searchTerm &&
      !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar usuários (ativos primeiro, depois por nome)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Ordenar por status (ativos primeiro)
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    
    // Ordenar por nome
    return a.name.localeCompare(b.name);
  });
  
  const handleToggleUserStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
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
                    <TableRow>{/* Removido o espaço em branco aqui */}
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>{/* Removido o espaço em branco aqui */}
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => (
                      <TableRow key={user.id}>{/* Removido o espaço em branco aqui */}
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={user.role === "admin" ? "bg-pmerj-blue" : "bg-gray-500"}>
                            {user.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.unit.name}</TableCell>
                        <TableCell>
                          <Badge className={user.active ? "bg-green-500" : "bg-red-500"}>
                            {user.active ? "Ativo" : "Inativo"}
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    {user.active ? (
                                      <>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Desativar
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Ativar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {user.active ? "Desativar Usuário" : "Ativar Usuário"}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {user.active
                                        ? `Tem certeza que deseja desativar o usuário "${user.name}"? Ele não poderá mais acessar o sistema.`
                                        : `Tem certeza que deseja ativar o usuário "${user.name}"? Ele poderá acessar o sistema novamente.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className={user.active ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}
                                      onClick={() => handleToggleUserStatus(user.id)}
                                    >
                                      {user.active ? "Desativar" : "Ativar"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {/* Opção para Excluir Usuário Permanentemente */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 hover:text-red-700 focus:text-red-700 focus:bg-red-100">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Usuário Permanentemente</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o usuário "{user.name}" permanentemente? Esta ação não pode ser desfeita e o usuário será removido do sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      Excluir Permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
