import { useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

export default function AdminLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-[#f4f6f8] lg:flex">
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <section className="min-w-0 flex-1">
        <AdminTopbar />
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </section>
    </main>
  );
}

