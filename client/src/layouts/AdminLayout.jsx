import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

export default function AdminLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#f8f5f0] lg:flex">
      <AdminSidebar />
      <section className="min-w-0 flex-1">
        <AdminTopbar />
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </section>
    </main>
  );
}
