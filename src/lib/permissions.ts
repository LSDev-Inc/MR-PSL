export const PERMISSIONS = [
  "dashboard.read",
  "analytics.read",
  "participants.read",
  "participants.export",
  "candidates.read",
  "candidates.write",
  "program.read",
  "program.write",
  "content.read",
  "content.write",
  "qr.generate",
  "users.read",
  "users.create",
  "users.update",
  "users.disable",
  "audit.read",
  "settings.read",
  "settings.write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";

const rolePermissions: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: [
    "dashboard.read",
    "analytics.read",
    "participants.read",
    "participants.export",
    "candidates.read",
    "candidates.write",
    "program.read",
    "program.write",
    "content.read",
    "content.write",
    "qr.generate",
    "users.read",
    "audit.read",
    "settings.read",
  ],
  EDITOR: [
    "dashboard.read",
    "candidates.read",
    "candidates.write",
    "program.read",
    "program.write",
    "content.read",
    "content.write",
    "qr.generate",
  ],
  ANALYST: ["dashboard.read", "analytics.read", "participants.read"],
  VIEWER: ["dashboard.read", "analytics.read", "candidates.read", "program.read", "content.read"],
};

export function hasPermission(role: AdminRole, customPermissions: string[] = [], permission: Permission) {
  return (
    role === "SUPER_ADMIN" ||
    rolePermissions[role]?.includes(permission) === true ||
    customPermissions.includes(permission)
  );
}

export function permissionsForRole(role: AdminRole, customPermissions: string[] = []) {
  return role === "SUPER_ADMIN"
    ? [...PERMISSIONS]
    : [
        ...new Set([
          ...rolePermissions[role],
          ...customPermissions.filter((item): item is Permission => PERMISSIONS.includes(item as Permission)),
        ]),
      ];
}
