import type { ReactNode } from "react";
import { AdminNavigation } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const actor = await requireAdmin("dashboard.read");
  return (
    <div className="admin-frame">
      <AdminNavigation actor={actor} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
