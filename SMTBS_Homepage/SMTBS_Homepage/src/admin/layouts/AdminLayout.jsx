import { useState } from "react";
import AdminSidebar, { AdminSidebarDrawer } from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

export default function AdminLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <AdminSidebar />
      <AdminSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <AdminHeader onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
