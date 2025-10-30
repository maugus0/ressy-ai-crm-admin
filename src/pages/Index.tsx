import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ClientsTable } from "@/components/ClientsTable";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1">
          <ClientsTable />
        </main>
      </div>
    </div>
  );
};

export default Index;
