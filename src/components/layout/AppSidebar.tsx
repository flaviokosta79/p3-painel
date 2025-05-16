import { 
  Sidebar, 
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { Home, File, Users, FileText, Settings, Archive, LayoutList } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import brazilianFlag from "@/assets/brazilian-flag.svg";
import newLogo from "@/assets/5cpa.png"; // Novo logo

export function AppSidebar() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.perfil === UserRole.ADMIN;
  
  return (
    <Sidebar>
      <SidebarHeader className="py-4 flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src={newLogo} // Novo logo
              alt="Logo 5º CPA" 
              className="h-16 w-auto" // Mantendo a altura, a largura será automática. Pode precisar de ajuste.
            />
          </div>
          <div className="text-center">
            <h3 className="font-heading font-bold text-white text-sm">5º CPA</h3>
            <div className="flex items-center justify-center mt-1">
              <img src={brazilianFlag} alt="Bandeira" className="h-4 mr-1" />
              <span className="text-xs text-white/80">PMERJ</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="w-full">
                    <Home className="h-5 w-5" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documentos/upload" className="w-full">
                    <File className="h-5 w-5" />
                    <span>Enviar Documento</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documentos/lista" className="w-full">
                    <Archive className="h-5 w-5" />
                    <span>Meus Documentos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Item de Menu para Missões Diárias do Usuário */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/missoes" className="w-full">
                    <LayoutList className="h-5 w-5" /> 
                    <span>Minhas Missões Diárias</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo de Administração na parte inferior */}
        {isAdmin && (
          <div className="mt-auto mb-8">
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/missoes" className="w-full">
                        <LayoutList className="h-5 w-5" />
                        <span>Gestão de Missões Diárias</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/documentos" className="w-full">
                        <FileText className="h-5 w-5" />
                        <span>Gestão de Documentos</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/usuarios" className="w-full">
                        <Users className="h-5 w-5" />
                        <span>Gestão de Usuários</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/configuracoes" className="w-full">
                        <Settings className="h-5 w-5" />
                        <span>Configurações</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
