import { jwtVerify, SignJWT } from "jose";
import type { Types } from "mongoose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { requireAuthSecret } from "@/lib/env";
import { type AdminRole, hasPermission, type Permission, permissionsForRole } from "@/lib/permissions";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminSession, AdminUser } from "@/models";

export const ADMIN_COOKIE = "ramadu_admin_session";
const encoder = new TextEncoder();
const secretKey = () => encoder.encode(requireAuthSecret());

export type AdminActor = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  institutionId: string;
  authVersion: number;
};

export async function createAdminSession(
  user: {
    _id: Types.ObjectId;
    email: string;
    role: AdminRole;
    permissions: string[];
    authVersion: number;
  },
  request: Request,
) {
  const { randomUUID } = await import("node:crypto");
  const jti = randomUUID();
  const expiry = new Date(Date.now() + 4 * 60 * 60 * 1000);
  await AdminSession.create({ institutionId: INSTITUTION_ID, userId: user._id, jti, expiresAt: expiry });
  const token = await new SignJWT({
    sub: user._id.toString(),
    role: user.role,
    av: user.authVersion,
    institutionId: INSTITUTION_ID,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secretKey());
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure:
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() === "https" ||
      new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: 4 * 60 * 60,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      if (payload.jti) {
        await connectDb();
        await AdminSession.updateOne(
          { jti: payload.jti, institutionId: INSTITUTION_ID },
          { $set: { revokedAt: new Date() } },
        );
      }
    } catch {
      /* Expired or invalid session; clearing the cookie is sufficient. */
    }
  }
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || !payload.jti || payload.institutionId !== INSTITUTION_ID || typeof payload.av !== "number")
      return null;
    await connectDb();
    const [user, session] = await Promise.all([
      AdminUser.findOne({ _id: payload.sub, institutionId: INSTITUTION_ID, disabledAt: { $exists: false } }).select(
        "email role permissions authVersion",
      ),
      AdminSession.findOne({
        jti: payload.jti,
        institutionId: INSTITUTION_ID,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      }),
    ]);
    if (!user || !session || user.authVersion !== payload.av) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role as AdminRole,
      permissions: permissionsForRole(user.role as AdminRole, user.permissions),
      institutionId: INSTITUTION_ID,
      authVersion: user.authVersion,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(permission?: Permission) {
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login");
  if (permission && !hasPermission(actor.role, actor.permissions, permission)) redirect("/admin?errore=permesso");
  return actor;
}

export function actorHasPermission(actor: AdminActor, permission: Permission) {
  return hasPermission(actor.role, actor.permissions, permission);
}
