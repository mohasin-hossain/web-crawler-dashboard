import type { ReactNode } from "react";
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header sidebarCollapsed={sidebarCollapsed} />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
