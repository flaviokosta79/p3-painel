import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, UserRole } from "@/hooks/useAuth";
import { DocumentsProvider } from "@/hooks/useDocuments";
import { UsersProvider } from "@/hooks/useUsers";
import { DocumentRequirementsProvider } from "@/hooks/DocumentRequirementsProvider";
import { MissionsProvider } from "@/hooks/useMissions.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Páginas
import Login from "./pages/Login";
import Index from "./pages/Index";
import DocumentUpload from "./pages/DocumentUpload";
import DocumentsList from "./pages/DocumentsList";
import DocumentDetail from "./pages/DocumentDetail";
import DocumentEdit from "./pages/DocumentEdit";
import AdminDocumentsList from "./pages/AdminDocumentsList";
import AdminUsersList from "./pages/AdminUsersList";
import AdminNewUser from "./pages/AdminNewUser";
import AdminEditUser from "./pages/AdminEditUser";
import NotFound from "./pages/NotFound";
import PaginaExemplo from "./pages/PaginaExemplo";
import AdminDailyMissions from "./pages/AdminDailyMissions";
import { UserDailyMissions } from "./pages/UserDailyMissions";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    )
  },
  {
    path: "/documentos/upload",
    element: (
      <ProtectedRoute>
        <DocumentUpload />
      </ProtectedRoute>
    )
  },
  {
    path: "/documentos/lista",
    element: (
      <ProtectedRoute>
        <DocumentsList />
      </ProtectedRoute>
    )
  },
  {
    path: "/documentos/detalhes/:id",
    element: (
      <ProtectedRoute>
        <DocumentDetail />
      </ProtectedRoute>
    )
  },
  {
    path: "/documentos/editar/:id",
    element: (
      <ProtectedRoute>
        <DocumentEdit />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/documentos",
    element: (
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminDocumentsList />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/usuarios",
    element: (
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminUsersList />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/usuarios/novo",
    element: (
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminNewUser />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/usuarios/editar/:id",
    element: (
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminEditUser />
      </ProtectedRoute>
    )
  },
  {
    path: "/exemplo",
    element: (
      <ProtectedRoute>
        <PaginaExemplo />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/missoes",
    element: (
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminDailyMissions />
      </ProtectedRoute>
    )
  },
  {
    path: "/missoes",
    element: (
      <ProtectedRoute>
        <UserDailyMissions />
      </ProtectedRoute>
    )
  },
  {
    path: "*",
    element: <NotFound />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DocumentsProvider>
        <UsersProvider>
          <DocumentRequirementsProvider>
            <MissionsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <RouterProvider router={router} />
              </TooltipProvider>
            </MissionsProvider>
          </DocumentRequirementsProvider>
        </UsersProvider>
      </DocumentsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
