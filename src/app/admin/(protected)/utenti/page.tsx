import type { Metadata } from "next";
import { UserManager } from "@/components/admin-editors";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Account amministratori" };

export default async function UsersPage() {
  const actor = await requireAdmin("users.read");
  return (
    <div className="admin-content">
      <h1>Account amministratori</h1>
      <p className="admin-subtitle">
        Invita i collaboratori, avvia il reset password e revoca gli account quando necessario.
      </p>
      <UserManager superAdmin={actor.role === "SUPER_ADMIN"} />
    </div>
  );
}
