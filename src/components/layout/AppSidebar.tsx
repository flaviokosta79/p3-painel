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
import { Home, File, Users, FileText, Settings, Archive } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import brazilianFlag from "@/assets/brazilian-flag.svg";
import newLogo from "@/assets/5cpa.png"; // Novo logo

export function AppSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
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
      
      <SidebarContent>
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
                  <NavLink to="/documents/upload" className="w-full">
                    <File className="h-5 w-5" />
                    <span>Enviar Documento</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documents" className="w-full">
                    <Archive className="h-5 w-5" />
                    <span>Meus Documentos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/documents" className="w-full">
                        <FileText className="h-5 w-5" />
                        <span>Gestão de Documentos</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/users" className="w-full">
                        <Users className="h-5 w-5" />
                        <span>Gestão de Usuários</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/settings" className="w-full">
                        <Settings className="h-5 w-5" />
                        <span>Configurações</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
