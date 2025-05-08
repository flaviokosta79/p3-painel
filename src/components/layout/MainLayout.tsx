
import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
          <footer className="p-4 text-center text-sm text-gray-500 border-t">
            © {new Date().getFullYear()} 5º CPA - Polícia Militar do Estado do Rio de Janeiro
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
