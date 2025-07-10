import type { ReactNode } from "react";
import { useState } from "react";
import { useUrlStore } from "../../stores/urlStore";
import { AddUrlForm } from "../forms/AddUrlForm";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);

  const { createUrl, loadingStates, fetchUrls } = useUrlStore();

  const handleAddUrl = () => {
    setShowAddUrlModal(true);
  };

  const handleAddUrlSuccess = () => {
    setShowAddUrlModal(false);
    fetchUrls(); // Refresh the URL list
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header sidebarCollapsed={sidebarCollapsed} />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAddUrl={handleAddUrl}
      />
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        <div className="p-8">{children}</div>
      </main>

      {/* Global Add URL Modal */}
      <AddUrlForm
        onSuccess={handleAddUrlSuccess}
        onSubmit={createUrl}
        loading={loadingStates?.create || false}
        asDialog={true}
        open={showAddUrlModal}
        onOpenChange={setShowAddUrlModal}
      />
    </div>
  );
}
